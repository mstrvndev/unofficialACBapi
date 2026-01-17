/**
 * HTTP Agents - Custom HTTPS/HTTP agents configuration
 */

const https = require('https');
const http = require('http');
const { TIMING } = require('../config/constants');

/**
 * Custom HTTPS agent to prevent socket hang up
 */
const httpsAgent = new https.Agent({
  keepAlive: false,
  maxSockets: Infinity,
  timeout: TIMING.REQUEST_TIMEOUT
});

/**
 * Custom HTTP agent to prevent socket hang up
 */
const httpAgent = new http.Agent({
  keepAlive: false,
  maxSockets: Infinity,
  timeout: TIMING.REQUEST_TIMEOUT
});

module.exports = {
  httpsAgent,
  httpAgent
};
