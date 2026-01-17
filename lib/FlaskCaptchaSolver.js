/**
 * Flask Captcha Solver - Interfaces with Flask server for captcha solving
 */

const axios = require('axios');
const fs = require('fs');
const { httpAgent } = require('./httpAgents');
const { PROXY_SERVER } = require('../config/constants');

class FlaskCaptchaSolver {
  /**
   * @param {string} serverUrl - Flask server URL for captcha solving
   */
  constructor(serverUrl = PROXY_SERVER) {
    this.serverUrl = serverUrl;
  }

  /**
   * Solve captcha from image file
   * @param {string} imagePath - Path to captcha image
   * @returns {Promise<string|null>} Solved captcha text or null on failure
   */
  async solveCaptcha(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(
        `${this.serverUrl}/api/captcha/solve`,
        { base64: base64Image },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
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

  /**
   * Solve captcha from base64 encoded image
   * @param {string} base64Image - Base64 encoded captcha image
   * @returns {Promise<string|null>} Solved captcha text or null on failure
   */
  async solveCaptchaFromBase64(base64Image) {
    try {
      const response = await axios.post(
        `${this.serverUrl}/api/captcha/solve`,
        { base64: base64Image },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
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

module.exports = FlaskCaptchaSolver;
