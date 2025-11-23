# Unofficial ACB API by MSTRVN.DEV

> ⚠️ **EDUCATIONAL PURPOSE ONLY** - This is an unofficial API wrapper for ACB (Asia Commercial Bank - Vietnam) created for educational and learning purposes. This should NOT be used in production environments.

## 📋 Overview

This project provides an unofficial API interface to interact with ACB (Asia Commercial Bank) services. It demonstrates how banking APIs might work and serves as an educational resource for understanding API integration patterns.

## ⚠️ Important Disclaimer

- This is an **UNOFFICIAL** API and is **NOT affiliated** with Asia Commercial Bank (ACB)
- For **EDUCATIONAL PURPOSES ONLY**
- Do NOT use this in production environments
- Do NOT use real credentials for testing
- The actual ACB API endpoints and authentication methods may differ
- Always use official banking channels for real transactions

## 🚀 Features

- User authentication simulation
- Account balance inquiry
- Transaction history retrieval
- Money transfer operations
- RESTful API design
- JSON response format

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/mstrvndev/unofficialACBapi.git
cd unofficialACBapi
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration (if needed)

## 🎯 Usage

### Starting the Server

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file)

### API Endpoints

#### 1. Root Endpoint
```http
GET /
```

Returns API information and available endpoints.

**Response:**
```json
{
  "message": "Unofficial ACB API - Educational Purpose Only",
  "version": "1.0.0",
  "author": "MSTRVN.DEV",
  "warning": "This is an unofficial API for educational purposes. Do not use in production.",
  "endpoints": {
    "login": "POST /api/login",
    "balance": "GET /api/balance",
    "transactions": "GET /api/transactions",
    "transfer": "POST /api/transfer"
  }
}
```

#### 2. Login
```http
POST /api/login
```

Authenticate user and obtain access token.

**Request Body:**
```json
{
  "username": "your_username",
  "password": "your_password",
  "accountNumber": "your_account_number"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "generated_token",
    "sessionId": "session_id",
    "message": "Login successful (simulated)",
    "warning": "This is a simulated response for educational purposes"
  }
}
```

#### 3. Get Balance
```http
GET /api/balance?token=YOUR_TOKEN&accountNumber=YOUR_ACCOUNT
```

Retrieve account balance.

**Query Parameters:**
- `token` (required): Authentication token from login
- `accountNumber` (required): Account number

**Response:**
```json
{
  "success": true,
  "data": {
    "accountNumber": "123456789",
    "balance": 5000000,
    "availableBalance": 4500000,
    "currency": "VND",
    "accountName": "Simulated Account",
    "timestamp": "2025-11-23T05:15:00.000Z",
    "warning": "This is a simulated response for educational purposes"
  }
}
```

#### 4. Get Transactions
```http
GET /api/transactions?token=YOUR_TOKEN&accountNumber=YOUR_ACCOUNT&fromDate=2025-01-01&toDate=2025-11-23
```

Retrieve transaction history.

**Query Parameters:**
- `token` (required): Authentication token
- `accountNumber` (required): Account number
- `fromDate` (optional): Start date (YYYY-MM-DD)
- `toDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "accountNumber": "123456789",
    "transactions": [
      {
        "id": "transaction_id",
        "date": "2025-11-20T10:30:00.000Z",
        "amount": 500000,
        "type": "credit",
        "description": "Sample transaction 1",
        "balance": 5000000
      }
    ],
    "count": 1,
    "warning": "This is a simulated response for educational purposes"
  }
}
```

#### 5. Transfer Money
```http
POST /api/transfer
```

Transfer money between accounts.

**Request Body:**
```json
{
  "token": "your_token",
  "fromAccount": "source_account",
  "toAccount": "destination_account",
  "amount": 1000000,
  "description": "Transfer description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "transfer_id",
    "fromAccount": "source_account",
    "toAccount": "destination_account",
    "amount": 1000000,
    "description": "Transfer description",
    "status": "simulated_success",
    "timestamp": "2025-11-23T05:15:00.000Z",
    "warning": "This is a simulated response for educational purposes. No actual transfer was made."
  }
}
```

## 📝 Example Usage

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "test_password",
    "accountNumber": "123456789"
  }'

# Get Balance
curl "http://localhost:3000/api/balance?token=YOUR_TOKEN&accountNumber=123456789"

# Get Transactions
curl "http://localhost:3000/api/transactions?token=YOUR_TOKEN&accountNumber=123456789"

# Transfer Money
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN",
    "fromAccount": "123456789",
    "toAccount": "987654321",
    "amount": 1000000,
    "description": "Payment"
  }'
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function example() {
  // Login
  const loginResponse = await axios.post(`${API_URL}/api/login`, {
    username: 'test_user',
    password: 'test_password',
    accountNumber: '123456789'
  });
  
  const token = loginResponse.data.data.token;
  
  // Get Balance
  const balanceResponse = await axios.get(`${API_URL}/api/balance`, {
    params: {
      token: token,
      accountNumber: '123456789'
    }
  });
  
  console.log('Balance:', balanceResponse.data.data.balance);
}

example();
```

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client
- **crypto-js** - Cryptographic functions
- **dotenv** - Environment configuration

## 📁 Project Structure

```
unofficialACBapi/
├── lib/
│   └── acb-api.js          # Core ACB API implementation
├── index.js                 # Express server and routes
├── package.json            # Project dependencies
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
└── README.md               # This file
```

## 🔒 Security Notes

- Never commit real credentials to version control
- Always use environment variables for sensitive data
- This is a simulation - real banking APIs have much more security
- Real banking operations should always use official, secure channels
- Implement proper authentication and authorization in production
- Use HTTPS in production environments
- Rate limiting is implemented (100 requests per 15 minutes per IP)
- Request size limits are set to prevent DoS attacks (10MB)
- CORS can be configured via environment variables
- Keep dependencies up to date

### Rate Limiting

The API implements rate limiting to prevent abuse:
- **Limit**: 100 requests per IP address
- **Window**: 15 minutes
- **Response Headers**: 
  - `RateLimit-Limit`: Maximum number of requests allowed
  - `RateLimit-Remaining`: Number of requests remaining
  - `RateLimit-Reset`: Seconds until the rate limit resets

When rate limit is exceeded, the API returns a `429 Too Many Requests` status with an error message.

## 🤝 Contributing

This is an educational project. If you want to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

Copyright (c) 2025 MSTRVN.DEV

## ⚖️ Legal Notice

This project is not affiliated with, endorsed by, or connected to Asia Commercial Bank (ACB) in any way. It is created solely for educational purposes to demonstrate API development concepts. Users are responsible for ensuring their use of this code complies with all applicable laws and regulations.

## 📞 Contact

- Website: [MSTRVN.DEV](https://mstrvn.dev)
- GitHub: [@mstrvndev](https://github.com/mstrvndev)

## 🎓 Educational Resources

This project demonstrates:
- RESTful API design principles
- Express.js server implementation
- API authentication patterns
- Request/response handling
- Error handling
- Environment configuration
- API documentation

---

**Remember**: This is for educational purposes only. Always use official banking channels for real financial transactions.
