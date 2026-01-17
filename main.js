/**
 * ACB Bank API - Main Entry Point
 * Modular version with auto-restart functionality
 */

const fs = require('fs');
const { ACBLoginAutomation } = require('./lib');
const { PROXY_SERVER, TIMING } = require('./config/constants');

//============================================
// AUTO-RESTART EXECUTION
//============================================
async function runWithAutoRestart() {
  const USERNAME = '';
  const PASSWORD = '';
  const FETCH_INTERVAL = TIMING.FETCH_INTERVAL;
  const RESTART_DELAY = TIMING.RESTART_DELAY;
  
  while (true) {
    try {
      const bot = new ACBLoginAutomation(USERNAME, PASSWORD, {
        cookieFile: './acbCookie.json',
        autoSolveCaptcha: true,
        flaskServerUrl: PROXY_SERVER,
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

