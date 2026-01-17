/**
 * Application constants and configuration
 */

const PROXY_SERVER = 'http://10.0.0.172:8888';
const BASE_URL = 'https://online.acb.com.vn';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0';

const DEFAULT_OPTIONS = {
  cookieFile: './acbCookie.json',
  autoSolveCaptcha: true,
  maxCaptchaRetries: 3,
  rememberDevice: true
};

const TIMING = {
  FETCH_INTERVAL: 5000,
  RESTART_DELAY: 3000,
  REQUEST_TIMEOUT: 30000
};

module.exports = {
  PROXY_SERVER,
  BASE_URL,
  USER_AGENT,
  DEFAULT_OPTIONS,
  TIMING
};
