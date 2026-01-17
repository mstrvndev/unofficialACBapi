/**
 * Cookie Manager - Handles cookie parsing, storage and retrieval
 */

const fs = require('fs');

class CookieManager {
  constructor() {
    this.cookies = {};
  }

  /**
   * Parse Set-Cookie headers and store cookies
   * @param {string|string[]} setCookieHeaders - Cookie headers from response
   */
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

  /**
   * Get cookie string for request headers
   * @returns {string} Formatted cookie string
   */
  getCookieString() {
    return Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join(';');
  }

  /**
   * Load cookies from a JSON file
   * @param {string} filePath - Path to cookie file
   * @returns {boolean} Success status
   */
  loadFromFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.cookies) {
          this.cookies = data.cookies;
          return true;
        }
      }
    } catch (error) {
      // Silent fail - cookie loading is optional
    }
    return false;
  }

  /**
   * Save cookies to a JSON file
   * @param {string} filePath - Path to save cookie file
   * @param {object} metadata - Additional metadata to save
   */
  saveToFile(filePath, metadata = {}) {
    const cookieData = {
      timestamp: new Date().toISOString(),
      ...metadata,
      cookies: this.cookies
    };
    fs.writeFileSync(filePath, JSON.stringify(cookieData, null, 2));
  }

  /**
   * Clear all stored cookies
   */
  clear() {
    this.cookies = {};
  }

  /**
   * Get a specific cookie value
   * @param {string} name - Cookie name
   * @returns {string|undefined} Cookie value
   */
  get(name) {
    return this.cookies[name];
  }

  /**
   * Set a specific cookie value
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   */
  set(name, value) {
    this.cookies[name] = value;
  }
}

module.exports = CookieManager;
