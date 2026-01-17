/**
 * ACB Login Automation - Main automation class for ACB Internet Banking
 */

const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');
const readline = require('readline');

const CookieManager = require('./CookieManager');
const FlaskCaptchaSolver = require('./FlaskCaptchaSolver');
const { httpsAgent } = require('./httpAgents');
const { BASE_URL, USER_AGENT, PROXY_SERVER, DEFAULT_OPTIONS, TIMING } = require('../config/constants');

class ACBLoginAutomation {
  /**
   * @param {string} username - ACB account username
   * @param {string} password - ACB account password
   * @param {object} options - Configuration options
   */
  constructor(username, password, options = {}) {
    this.username = username;
    this.password = password;
    this.baseUrl = BASE_URL;
    this.sessionId = null;
    this.cookieManager = new CookieManager();
    this.userAgent = USER_AGENT;
    this.captchaBuffer = null;
    this.captchaTimestamp = null;
    this.loginPageUrl = null;
    this.processorId = null;
    this.cookieFile = options.cookieFile || DEFAULT_OPTIONS.cookieFile;
    this.rememberDevice = options.rememberDevice !== false;
    this.accountNumber = username;
    this.autoSolveCaptcha = options.autoSolveCaptcha !== false;
    this.flaskServerUrl = options.flaskServerUrl || PROXY_SERVER;
    this.captchaSolver = new FlaskCaptchaSolver(this.flaskServerUrl);
    this.maxCaptchaRetries = options.maxCaptchaRetries || DEFAULT_OPTIONS.maxCaptchaRetries;
  }

  /**
   * Get common headers for requests
   * @param {object} additionalHeaders - Additional headers to merge
   * @returns {object} Complete headers object
   */
  getCommonHeaders(additionalHeaders = {}) {
    return {
      'User-Agent': this.userAgent,
      'sec-ch-ua': '"Chromium";v="142", "Microsoft Edge";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8,vi;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Connection': 'close',
      'Cookie': this.cookieManager.getCookieString(),
      ...additionalHeaders
    };
  }

  /**
   * Prompt user for input via command line
   * @param {string} question - Question to display
   * @returns {Promise<string>} User input
   */
  async promptInput(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim().toUpperCase());
      });
    });
  }

  /**
   * Initialize session by visiting Request endpoint
   * @returns {Promise<boolean>} Success status
   */
  async initSession() {
    try {
      const response = await axios.get(`${this.baseUrl}/acbib/Request`, {
        headers: this.getCommonHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-User': '?1',
          'Sec-Fetch-Dest': 'document'
        }),
        httpsAgent: httpsAgent,
        proxy: false,
        timeout: TIMING.REQUEST_TIMEOUT,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });
      this.cookieManager.parseCookies(response.headers['set-cookie']);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get login page and extract session ID
   * @returns {Promise<string>} Login page HTML
   */
  async getLoginPage() {
    try {
      const response1 = await axios.get(`${this.baseUrl}/acbib/webmbtt`, {
        headers: this.getCommonHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-User': '?1',
          'Sec-Fetch-Dest': 'document'
        }),
        httpsAgent: httpsAgent,
        proxy: false,
        timeout: TIMING.REQUEST_TIMEOUT,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });

      this.cookieManager.parseCookies(response1.headers['set-cookie']);

      let loginPageUrl = this.baseUrl;
      if (response1.status === 302 && response1.headers.location) {
        let location = response1.headers.location;
        location = this._normalizeUrl(location);

        loginPageUrl = location;
        const urlParams = new URLSearchParams(loginPageUrl.split('?')[1]);
        this.sessionId = urlParams.get('dse_sessionId');
        this.loginPageUrl = loginPageUrl;

        const response2 = await axios.get(loginPageUrl, {
          headers: this.getCommonHeaders({
            'Referer': `${this.baseUrl}/acbib/webmbtt`,
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document'
          }),
          httpsAgent: httpsAgent,
          proxy: false,
          timeout: TIMING.REQUEST_TIMEOUT,
          maxRedirects: 0
        });

        this.cookieManager.parseCookies(response2.headers['set-cookie']);
        return response2.data;
      }

      return response1.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Normalize URL to use HTTPS properly
   * @param {string} location - URL to normalize
   * @returns {string} Normalized URL
   */
  _normalizeUrl(location) {
    if (location.startsWith('http://online.acb.com.vn:443')) {
      return location.replace('http://online.acb.com.vn:443', 'https://online.acb.com.vn');
    } else if (!location.startsWith('http')) {
      return this.baseUrl + location;
    } else if (location.startsWith('http://')) {
      return location.replace('http://', 'https://');
    }
    return location;
  }

  /**
   * Download captcha image
   * @param {string} savePath - Path to save captcha image
   * @returns {Promise<object>} Object containing file path
   */
  async downloadCaptcha(savePath = './acbCaptcha.jpg') {
    try {
      const response = await axios.get(`${this.baseUrl}/acbib/Captcha.jpg`, {
        responseType: 'arraybuffer',
        headers: this.getCommonHeaders({
          'Referer': this.loginPageUrl,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Dest': 'image'
        }),
        httpsAgent: httpsAgent,
        proxy: false,
        timeout: TIMING.REQUEST_TIMEOUT,
        maxRedirects: 0
      });
      this.cookieManager.parseCookies(response.headers['set-cookie']);
      this.captchaBuffer = response.data;
      this.captchaTimestamp = Date.now();
      fs.writeFileSync(savePath, response.data);
      return { filePath: savePath };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Solve captcha using Flask server
   * @param {string} imagePath - Path to captcha image
   * @returns {Promise<string|null>} Solved captcha text
   */
  async solveCaptcha(imagePath) {
    try {
      const captchaText = await this.captchaSolver.solveCaptcha(imagePath);
      return captchaText;
    } catch (error) {
      return null;
    }
  }

  /**
   * Submit login form
   * @param {string} captchaText - Solved captcha text
   * @returns {Promise<object>} Login result
   */
  async submitLogin(captchaText) {
    try {
      const formData = new URLSearchParams();
      formData.append('dse_sessionId', this.sessionId);
      formData.append('dse_applicationId', '-1');
      formData.append('dse_pageId', '2');
      formData.append('dse_operationName', 'obkLoginOp');
      formData.append('dse_errorPage', 'ibk/login.jsp');
      formData.append('dse_processorState', 'initial');
      formData.append('UserName', this.username);
      formData.append('PassWord', this.password);
      formData.append('glbLogedIn', 'WEB');
      formData.append('SecurityCode', captchaText);

      const response = await axios.post(
        `${this.baseUrl}/acbib/Request`,
        formData.toString(),
        {
          headers: this.getCommonHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': this.baseUrl,
            'Referer': this.loginPageUrl,
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document'
          }),
          httpsAgent: httpsAgent,
          proxy: false,
          timeout: TIMING.REQUEST_TIMEOUT,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        }
      );

      this.cookieManager.parseCookies(response.headers['set-cookie']);

      // Handle 302 redirect after login POST
      if (response.status === 302 && response.headers.location) {
        const location = this._normalizeUrl(response.headers.location);

        const finalResponse = await axios.get(location, {
          headers: this.getCommonHeaders({
            'Referer': `${this.baseUrl}/acbib/Request`,
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document'
          }),
          httpsAgent: httpsAgent,
          proxy: false,
          timeout: TIMING.REQUEST_TIMEOUT,
          maxRedirects: 0
        });

        this.cookieManager.parseCookies(finalResponse.headers['set-cookie']);
        return this.checkLoginResponse(finalResponse.data);
      }

      return this.checkLoginResponse(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check login response and determine result
   * @param {string} html - Response HTML
   * @returns {object} Login result object
   */
  checkLoginResponse(html) {
    const $ = cheerio.load(html);

    // Check for OTP requirement
    const hasOTPRadio = $('#safekey').length > 0;
    const hasOTPLabel = $('label[for="safekey"]').text().includes('OTPSafekey');
    if (hasOTPRadio || hasOTPLabel) {
      const processorId = $('input[name="dse_processorId"]').val();
      if (processorId) {
        this.processorId = processorId;
      }
      return { requiresOTP: true, html: html };
    }

    // Check for successful login
    const hasContentHolder = $('.content-holder').length > 0;
    let greeting = null;
    if (hasContentHolder) {
      const h1Text = $('.content-holder').find('h1').text().trim();
      const nameMatch = h1Text.match(/Xin chào,\s*(.+)$/i);
      if (nameMatch) greeting = nameMatch[1];
      return { success: true, greeting, message: h1Text, requiresOTP: false };
    }

    // Check for wrong captcha
    const bodyText = $('body').text();
    if (bodyText.includes('Mãxácthựckhôngđúng') || bodyText.includes('Securitycode')) {
      return { success: false, wrongCaptcha: true, message: 'Wrong captcha code' };
    }

    // Other errors
    const errorMsg = $('.error-message,.alert-danger,.error,.loginError').text().trim();
    return { success: false, message: errorMsg || 'Unknown error', requiresOTP: false };
  }

  /**
   * Re-login using saved cookies
   * @returns {Promise<object>} Login result
   */
  async reloginWithSavedCookie() {
    if (fs.existsSync(this.cookieFile) && this.cookieManager.loadFromFile(this.cookieFile)) {
      await this.initSession();
      await this.getLoginPage();
      for (let captchaAttempt = 0; captchaAttempt < this.maxCaptchaRetries; captchaAttempt++) {
        const { filePath } = await this.downloadCaptcha();
        const captchaText = this.autoSolveCaptcha
          ? await this.solveCaptcha(filePath)
          : await this.promptInput('\n👉 Enter captcha text:');
        const loginResult = await this.submitLogin(captchaText);
        if (loginResult.success) {
          this.saveCookies();
          return loginResult;
        }
      }
    }
    throw new Error('Re-login with saved cookie failed');
  }

  /**
   * Get transactions for date range
   * @param {Date|string} fromDate - Start date
   * @param {Date|string} toDate - End date
   * @param {string} accountNumber - Account number (optional)
   * @returns {Promise<array>} Array of transactions
   */
  async getTransactions(fromDate, toDate, accountNumber = null) {
    if (!accountNumber) accountNumber = this.accountNumber;
    let attemptedRelogin = false;

    while (true) {
      try {
        const formatDate = (date) => {
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };
        const formattedFromDate = formatDate(fromDate);
        const formattedToDate = formatDate(toDate);

        const accountDetailUrl = `${this.baseUrl}/acbib/Request?&dse_sessionId=${this.sessionId}&dse_applicationId=-1&dse_pageId=2&dse_operationName=ibkacctDetailProc&dse_errorPage=login.jsp&dse_processorState=initial&dse_nextEventName=start&AccountNbr=${accountNumber}`;
        let detailResponse = await axios.get(accountDetailUrl, {
          headers: this.getCommonHeaders(),
          httpsAgent: httpsAgent,
          proxy: false,
          timeout: TIMING.REQUEST_TIMEOUT
        });
        this.cookieManager.parseCookies(detailResponse.headers['set-cookie']);
        let $ = cheerio.load(detailResponse.data);
        let processorId = $('input[name="dse_processorId"]').val();

        if (!processorId) {
          if (fs.existsSync(this.cookieFile) && this.cookieManager.loadFromFile(this.cookieFile)) {
            await this.initSession();
            await this.getLoginPage();
            for (let captchaAttempt = 0; captchaAttempt < this.maxCaptchaRetries; captchaAttempt++) {
              const { filePath } = await this.downloadCaptcha();
              const captchaText = this.autoSolveCaptcha
                ? await this.solveCaptcha(filePath)
                : await this.promptInput('\n👉 Enter captcha text:');
              const loginResult = await this.submitLogin(captchaText);
              if (loginResult.success) {
                detailResponse = await axios.get(accountDetailUrl, {
                  headers: this.getCommonHeaders(),
                  httpsAgent: httpsAgent,
                  proxy: false,
                  timeout: TIMING.REQUEST_TIMEOUT
                });
                this.cookieManager.parseCookies(detailResponse.headers['set-cookie']);
                $ = cheerio.load(detailResponse.data);
                processorId = $('input[name="dse_processorId"]').val();
                if (processorId) break;
              }
              if (loginResult.wrongCaptcha) continue;
            }
            if (!processorId) throw new Error('Login with saved cookies unsuccessful or processorId still missing');
          } else {
            throw new Error('Could not extract processorId and no saved cookies');
          }
        }

        const formData = new URLSearchParams();
        formData.append('dse_sessionId', this.sessionId);
        formData.append('dse_applicationId', '-1');
        formData.append('dse_operationName', 'ibkacctDetailProc');
        formData.append('dse_pageId', '4');
        formData.append('dse_processorState', 'acctDetailPage');
        formData.append('dse_processorId', processorId);
        formData.append('dse_errorPage', '/ibk/acctinquiry/trans.jsp');
        formData.append('AccountNbr', accountNumber);
        formData.append('virtualAccount', '');
        formData.append('storeName', '');
        formData.append('CheckRef', 'false');
        formData.append('EdtRef', '');
        formData.append('dse_nextEventName', 'byDate');
        formData.append('activeDatetimeYN', 'N');
        formData.append('FromDate', formattedFromDate);
        formData.append('ToDate', formattedToDate);

        const transResponse = await axios.post(
          `${this.baseUrl}/acbib/Request`,
          formData.toString(),
          {
            headers: this.getCommonHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
            httpsAgent: httpsAgent,
            proxy: false,
            timeout: TIMING.REQUEST_TIMEOUT
          }
        );
        this.cookieManager.parseCookies(transResponse.headers['set-cookie']);
        return this.parseTransactions(transResponse.data);
      } catch (error) {
        const isRedirectError = (
          typeof error.message === 'string' &&
          error.message.toLowerCase().includes('maximum number of redirects')
        );
        if (isRedirectError && !attemptedRelogin) {
          attemptedRelogin = true;
          await this.reloginWithSavedCookie();
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Parse transactions from HTML response
   * @param {string} html - HTML response containing transactions
   * @returns {array} Array of parsed transactions
   */
  parseTransactions(html) {
    const $ = cheerio.load(html);
    const transactions = [];
    const table = $('#table1');
    
    if (!table.length) {
      return transactions;
    }

    table.find('tr.table-style-double1').each((index, element) => {
      const $row = $(element);
      if ($row.find('th').length > 0) return;
      
      const cells = $row.find('td');
      if (cells.length === 6) {
        const effectiveDate = $(cells[0]).text().trim();
        const transactionDate = $(cells[1]).text().trim();
        const transactionNumber = $(cells[2]).text().trim();
        const debit = $(cells[3]).text().trim().replace(/\s/g, '').replace(/\./g, '') || '0';
        const credit = $(cells[4]).text().trim().replace(/\s/g, '').replace(/\./g, '') || '0';
        const balance = $(cells[5]).text().trim().replace(/\s/g, '').replace(/\./g, '') || '0';
        
        if (transactionNumber && transactionNumber !== '&nbsp;' && transactionNumber !== '') {
          transactions.push({
            effectiveDate,
            transactionDate,
            transactionNumber,
            debit: parseInt(debit) || 0,
            credit: parseInt(credit) || 0,
            balance: parseInt(balance) || 0,
            description: ''
          });
        }
      } else if (cells.length >= 1 && transactions.length > 0) {
        const descCell = $row.find('td.acctSum');
        if (descCell.length > 0) {
          const description = descCell.first().text().trim();
          if (description && description !== '&nbsp;' && description !== '') {
            transactions[transactions.length - 1].description = description;
          }
        } else if (cells.length === 2) {
          const description = $(cells[0]).text().trim();
          if (description && description !== '&nbsp;' && description !== '') {
            transactions[transactions.length - 1].description = description;
          }
        }
      }
    });
    
    return transactions;
  }

  /**
   * Main login method
   * @param {number} maxRetries - Maximum number of login retries
   * @returns {Promise<object>} Login result with tokens
   */
  async login(maxRetries = 3) {
    // Try using saved cookies first
    if (this.rememberDevice && fs.existsSync(this.cookieFile) && this.cookieManager.loadFromFile(this.cookieFile)) {
      await this.initSession();
      await this.getLoginPage();
      for (let captchaAttempt = 0; captchaAttempt < this.maxCaptchaRetries; captchaAttempt++) {
        const { filePath } = await this.downloadCaptcha();
        const captchaText = this.autoSolveCaptcha
          ? await this.solveCaptcha(filePath)
          : await this.promptInput('\n👉 Enter captcha text:');
        const loginResult = await this.submitLogin(captchaText);
        if (loginResult.success || loginResult.requiresOTP) {
          this.saveCookies();
          return { ...loginResult, tokens: this.getTokens() };
        }
        if (loginResult.wrongCaptcha) continue;
      }
      throw new Error('Login with saved cookies failed');
    }

    // Fallback: new login
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.initSession();
        await this.getLoginPage();
        let captchaText = null;
        for (let captchaAttempt = 0; captchaAttempt < this.maxCaptchaRetries; captchaAttempt++) {
          const { filePath } = await this.downloadCaptcha();
          captchaText = this.autoSolveCaptcha
            ? await this.solveCaptcha(filePath)
            : await this.promptInput('\n👉 Enter captcha text:');
          const loginResult = await this.submitLogin(captchaText);
          if (loginResult.success || loginResult.requiresOTP) {
            this.saveCookies();
            return { ...loginResult, tokens: this.getTokens() };
          }
          if (loginResult.wrongCaptcha) continue;
        }
      } catch (error) {
        if (attempt >= maxRetries) throw error;
      }
    }
    throw new Error('Login failed after retries');
  }

  /**
   * Save cookies to file
   */
  saveCookies() {
    this.cookieManager.saveToFile(this.cookieFile, {
      sessionId: this.sessionId,
      username: this.username,
      deviceTrusted: true,
      userAgent: this.userAgent,
      tokens: this.getTokens()
    });
  }

  /**
   * Get authentication tokens
   * @returns {object} Token object
   */
  getTokens() {
    return {
      acbo_token_identity: this.cookieManager.cookies.acbo_token_identity,
      token: this.cookieManager.cookies.token,
      JSESSIONID: this.cookieManager.cookies.JSESSIONID,
      _acbId: this.cookieManager.cookies._acbId,
      acbo_language: this.cookieManager.cookies.acbo_language
    };
  }
}

module.exports = ACBLoginAutomation;
