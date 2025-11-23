const axios = require('axios');
const crypto = require('crypto-js');

class ACBApi {
    constructor(token = null) {
        this.baseUrl = 'https://online.acb.com.vn';
        this.token = token;
        this.deviceId = this.generateDeviceId();
        this.sessionId = null;
    }

    /**
     * Generate a unique device ID
     */
    generateDeviceId() {
        return crypto.MD5(Date.now().toString() + Math.random().toString()).toString();
    }

    /**
     * Generate request signature
     */
    generateSignature(data) {
        const secretKey = process.env.ACB_SECRET_KEY;
        if (!secretKey) {
            throw new Error('ACB_SECRET_KEY is not configured. Please set it in your .env file.');
        }
        
        const sortedData = Object.keys(data)
            .sort()
            .map(key => `${key}=${data[key]}`)
            .join('&');
        return crypto.HmacSHA256(sortedData, secretKey).toString();
    }

    /**
     * Login to ACB
     */
    async login(username, password, accountNumber) {
        try {
            // This is a mock implementation for educational purposes
            // Real ACB API endpoints and authentication methods may differ
            
            const loginData = {
                username: username,
                password: crypto.SHA256(password).toString(),
                accountNumber: accountNumber,
                deviceId: this.deviceId,
                timestamp: Date.now()
            };

            // In a real implementation, this would call the actual ACB API
            // For educational purposes, we'll simulate a response
            
            console.log('⚠️  [EDUCATIONAL MODE] Simulating login request...');
            console.log('📝 Login data prepared:', {
                username: username,
                accountNumber: accountNumber,
                deviceId: this.deviceId
            });

            // Simulated response
            this.token = crypto.SHA256(username + Date.now()).toString();
            this.sessionId = crypto.MD5(this.token).toString();

            return {
                token: this.token,
                sessionId: this.sessionId,
                message: 'Login successful (simulated)',
                warning: 'This is a simulated response for educational purposes'
            };

        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    /**
     * Get account balance
     */
    async getBalance(accountNumber) {
        if (!this.token) {
            throw new Error('Not authenticated. Please login first.');
        }

        try {
            console.log('⚠️  [EDUCATIONAL MODE] Simulating balance inquiry...');
            console.log('📝 Account:', accountNumber);

            // Simulated balance response
            return {
                accountNumber: accountNumber,
                balance: Math.floor(Math.random() * 10000000),
                availableBalance: Math.floor(Math.random() * 10000000),
                currency: 'VND',
                accountName: 'Simulated Account',
                timestamp: new Date().toISOString(),
                warning: 'This is a simulated response for educational purposes'
            };

        } catch (error) {
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    /**
     * Get transaction history
     */
    async getTransactions(accountNumber, fromDate = null, toDate = null) {
        if (!this.token) {
            throw new Error('Not authenticated. Please login first.');
        }

        try {
            console.log('⚠️  [EDUCATIONAL MODE] Simulating transaction history retrieval...');
            console.log('📝 Account:', accountNumber);
            console.log('📅 Date range:', fromDate || 'N/A', 'to', toDate || 'N/A');

            // Simulated transaction data
            const transactions = [];
            const numTransactions = Math.floor(Math.random() * 10) + 1;

            for (let i = 0; i < numTransactions; i++) {
                transactions.push({
                    id: crypto.MD5(`txn_${i}_${Date.now()}`).toString(),
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    amount: Math.floor(Math.random() * 1000000),
                    type: Math.random() > 0.5 ? 'credit' : 'debit',
                    description: `Sample transaction ${i + 1}`,
                    balance: Math.floor(Math.random() * 10000000)
                });
            }

            return {
                accountNumber: accountNumber,
                transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
                count: transactions.length,
                warning: 'This is a simulated response for educational purposes'
            };

        } catch (error) {
            throw new Error(`Failed to get transactions: ${error.message}`);
        }
    }

    /**
     * Transfer money
     */
    async transfer(fromAccount, toAccount, amount, description) {
        if (!this.token) {
            throw new Error('Not authenticated. Please login first.');
        }

        try {
            console.log('⚠️  [EDUCATIONAL MODE] Simulating money transfer...');
            console.log('📝 Transfer details:');
            console.log('   From:', fromAccount);
            console.log('   To:', toAccount);
            console.log('   Amount:', amount, 'VND');
            console.log('   Description:', description);

            // Validate amount
            if (amount <= 0) {
                throw new Error('Invalid amount');
            }

            // Simulated transfer response
            const transactionId = crypto.MD5(`transfer_${Date.now()}`).toString();

            return {
                transactionId: transactionId,
                fromAccount: fromAccount,
                toAccount: toAccount,
                amount: amount,
                description: description,
                status: 'simulated_success',
                timestamp: new Date().toISOString(),
                warning: 'This is a simulated response for educational purposes. No actual transfer was made.'
            };

        } catch (error) {
            throw new Error(`Transfer failed: ${error.message}`);
        }
    }

    /**
     * Verify account number
     */
    async verifyAccount(accountNumber) {
        if (!this.token) {
            throw new Error('Not authenticated. Please login first.');
        }

        try {
            console.log('⚠️  [EDUCATIONAL MODE] Simulating account verification...');
            console.log('📝 Account:', accountNumber);

            // Simulated verification response
            return {
                accountNumber: accountNumber,
                accountName: 'Simulated Account Holder',
                verified: true,
                warning: 'This is a simulated response for educational purposes'
            };

        } catch (error) {
            throw new Error(`Account verification failed: ${error.message}`);
        }
    }
}

module.exports = ACBApi;
