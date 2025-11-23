require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const ACBApi = require('./lib/acb-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting middleware - prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Middleware with request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware - configure allowed origins via environment variable
app.use((req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Unofficial ACB API - Educational Purpose Only',
        version: '1.0.0',
        author: 'MSTRVN.DEV',
        warning: 'This is an unofficial API for educational purposes. Do not use in production.',
        endpoints: {
            login: 'POST /api/login',
            balance: 'GET /api/balance',
            transactions: 'GET /api/transactions',
            transfer: 'POST /api/transfer'
        }
    });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, accountNumber } = req.body;
        
        if (!username || !password || !accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: username, password, accountNumber'
            });
        }

        const api = new ACBApi();
        const result = await api.login(username, password, accountNumber);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get balance
app.get('/api/balance', async (req, res) => {
    try {
        const { token, accountNumber } = req.query;
        
        if (!token || !accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: token, accountNumber'
            });
        }

        const api = new ACBApi(token);
        const balance = await api.getBalance(accountNumber);
        
        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const { token, accountNumber, fromDate, toDate } = req.query;
        
        if (!token || !accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: token, accountNumber'
            });
        }

        const api = new ACBApi(token);
        const transactions = await api.getTransactions(
            accountNumber,
            fromDate || null,
            toDate || null
        );
        
        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Transfer money
app.post('/api/transfer', async (req, res) => {
    try {
        const { token, fromAccount, toAccount, amount, description } = req.body;
        
        if (!token || !fromAccount || !toAccount || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: token, fromAccount, toAccount, amount'
            });
        }

        const api = new ACBApi(token);
        const result = await api.transfer(
            fromAccount,
            toAccount,
            amount,
            description || ''
        );
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ACB API Server running on port ${PORT}`);
    console.log(`⚠️  WARNING: This is an unofficial API for educational purposes only`);
    console.log(`📚 Visit http://localhost:${PORT} for API documentation`);
});

module.exports = app;
