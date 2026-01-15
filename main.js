// 2rd VERSION WORKING 

const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');
const readline = require('readline');
const path = require('path');
const https = require('https');
const http = require('http');

// Custom HTTPS/HTTP agents to prevent socket hang up
const httpsAgent = new https.Agent({
  keepAlive: false,
  maxSockets: Infinity,
  timeout: 30000
});
const PROXYSERVER = 'http://10.0.0.172:8888';
const httpAgent = new http.Agent({
  keepAlive: false,
  maxSockets: Infinity,
  timeout: 30000
});

//============================================
// FLASK SERVER CAPTCHA SOLVER
//============================================
class FlaskCaptchaSolver {
  constructor(serverUrl = PROXYSERVER) {
    this.serverUrl = serverUrl;
  }
  async solveCaptcha(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const response = await axios.post(
        `${this.serverUrl}/api/captcha/solve`,
        { base64: base64Image },
        { 
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
          timeout: 30000,
          httpAgent: httpAgent
        }
      );
      if (response.data && response.data.status === 'success') {
        return response.data.captcha.toUpperCase();
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

//============================================
// COOKIE MANAGER
//============================================
class CookieManager {
  constructor() {
    this.cookies = {};
  }
  parseCookies(setCookieHeaders) {
    if (!setCookieHeaders) return;
    const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    headers.forEach(cookie => {
      const parts = cookie.split(';')[0].split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      this.cookies[name] = value;
    });
  }
  getCookieString() {
    return Object.entries(this.cookies).map(([name, value]) => `${name}=${value}`).join(';');
  }
  loadFromFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.cookies) {
          this.cookies = data.cookies;
          return true;
        }
      }
    } catch (error) {}
    return false;
  }
  saveToFile(filePath, metadata = {}) {
    const cookieData = { timestamp: new Date().toISOString(), ...metadata, cookies: this.cookies };
    fs.writeFileSync(filePath, JSON.stringify(cookieData, null, 2));
  }
  clear() {
    this.cookies = {};
  }
}

//============================================
// ACB LOGIN AUTOMATION
//============================================
class ACBLoginAutomation {
  constructor(username, password, options = {}) {
    this.username = username;
    this.password = password;
    this.baseUrl = 'https://online.acb.com.vn';
    this.sessionId = null;
    this.cookieManager = new CookieManager();
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0';
    this.captchaBuffer = null;
    this.captchaTimestamp = null;
    this.loginPageUrl = null;
    this.processorId = null;
    this.cookieFile = options.cookieFile || './acbCookie.json';
    this.rememberDevice = options.rememberDevice !== false;
    this.accountNumber = username;
    this.autoSolveCaptcha = options.autoSolveCaptcha !== false;
    this.flaskServerUrl = options.flaskServerUrl || PROXYSERVER;
    this.captchaSolver = new FlaskCaptchaSolver(this.flaskServerUrl);
    this.maxCaptchaRetries = options.maxCaptchaRetries || 3;
  }
  
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
  
  async promptInput(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim().toUpperCase());
      });
    });
  }
  
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
        timeout: 30000,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });
      this.cookieManager.parseCookies(response.headers['set-cookie']);
      return true;
    } catch (error) {
      return false;
    }
  }
  
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
        timeout: 30000,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      this.cookieManager.parseCookies(response1.headers['set-cookie']);
      
      let loginPageUrl = this.baseUrl;
      if (response1.status === 302 && response1.headers.location) {
        let location = response1.headers.location;
        if (location.startsWith('http://online.acb.com.vn:443')) {
          location = location.replace('http://online.acb.com.vn:443', 'https://online.acb.com.vn');
        } else if (!location.startsWith('http')) {
          location = this.baseUrl + location;
        } else if (location.startsWith('http://')) {
          location = location.replace('http://', 'https://');
        }
        
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
          timeout: 30000,
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
        timeout: 30000,
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
  
  async solveCaptcha(imagePath) {
    try {
      const captchaText = await this.captchaSolver.solveCaptcha(imagePath);
      return captchaText;
    } catch (error) {
      return null;
    }
  }
  
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
          timeout: 30000,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        }
      );
      
      this.cookieManager.parseCookies(response.headers['set-cookie']);
      
      // Handle 302 redirect after login POST
      if (response.status === 302 && response.headers.location) {
        let location = response.headers.location;
        if (location.startsWith('http://online.acb.com.vn:443')) {
          location = location.replace('http://online.acb.com.vn:443', 'https://online.acb.com.vn');
        } else if (!location.startsWith('http')) {
          location = this.baseUrl + location;
        } else if (location.startsWith('http://')) {
          location = location.replace('http://', 'https://');
        }
        
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
          timeout: 30000,
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
          timeout: 30000
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
                  timeout: 30000
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
            timeout: 30000
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
  
  saveCookies() {
    this.cookieManager.saveToFile(this.cookieFile, {
      sessionId: this.sessionId,
      username: this.username,
      deviceTrusted: true,
      userAgent: this.userAgent,
      tokens: this.getTokens()
    });
  }
  
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

//============================================
// AUTO-RESTART EXECUTION
//============================================
async function runWithAutoRestart() {
  const USERNAME = '';
  const PASSWORD = '';
  const FETCH_INTERVAL = 5000;
  const RESTART_DELAY = 3000;
  
  while (true) {
    try {
      const bot = new ACBLoginAutomation(USERNAME, PASSWORD, {
        cookieFile: './acbCookie.json',
        autoSolveCaptcha: true,
        flaskServerUrl: PROXYSERVER,
        maxCaptchaRetries: 3
      });

      let loginResult = await bot.login();

      if (loginResult.success) {
        console.log('✅ Login successful!');
        if (loginResult.greeting) {
          console.log(`Welcome, ${loginResult.greeting}`);
        }

        let fetchCount = 0;
        while (true) {
          try {
            fetchCount++;
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 3);
            const transactions = await bot.getTransactions(fromDate, toDate);
            const outputData = {
              success: true,
              fetchCount,
              accountNumber: bot.accountNumber,
              fromDate: fromDate.toISOString(),
              toDate: toDate.toISOString(),
              transactions: transactions
            };
            console.log(JSON.stringify(outputData, null, 2));
            fs.writeFileSync('./transactions.json', JSON.stringify(outputData, null, 2));
            await new Promise(resolve => setTimeout(resolve, FETCH_INTERVAL));
          } catch (error) {
            console.log(JSON.stringify({ error: 'fetch_failed', message: error.message, timestamp: new Date().toISOString() }, null, 2));
            // Detect socket errors and restart process
            if (
              error.message &&
              (
                error.message.toLowerCase().includes('socket hang up') ||
                error.message.toLowerCase().includes('econnreset') ||
                error.message.toLowerCase().includes('etimedout')
              )
            ) {
              console.log(`🔄 Socket/network error detected. Restarting in ${RESTART_DELAY}ms...`);
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, FETCH_INTERVAL));
          }
        }
      } else if (loginResult.requiresOTP) {
        console.log('⚠️ OTP required but not implemented in this version');
        await new Promise(resolve => setTimeout(resolve, RESTART_DELAY));
        continue; // Restart
      } else {
        console.log(JSON.stringify({ success: false, error: 'Login failed' }, null, 2));
        await new Promise(resolve => setTimeout(resolve, RESTART_DELAY));
        continue; // Restart
      }
    } catch (error) {
      console.log(JSON.stringify({
        error: 'critical_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }, null, 2));
      console.log(`🔄 Restarting in ${RESTART_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RESTART_DELAY));
    }
  }
}

//============================================
// MAIN
//============================================
if (require.main === module) {
  runWithAutoRestart().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
module.exports = ACBLoginAutomation;

