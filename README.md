# Unofficial ACB API

## English
Unofficial ACB (Asia Commercial Bank) API - A Node.js library for interacting with ACB banking services programmatically. This project provides functions to authenticate, retrieve account information, and fetch transaction history from ACB bank accounts.

## Tiếng Việt
API ACB không chính thức - Thư viện Node.js để tương tác với các dịch vụ ngân hàng ACB. Dự án này cung cấp các chức năng xác thực, lấy thông tin tài khoản và truy vấn lịch sử giao dịch từ tài khoản ngân hàng ACB.

---

## Installation / Cài đặt

### Prerequisites / Yêu cầu
- Node.js (v14 or higher / v14 trở lên)
- Python 3.x (for captcha solver / cho captcha solver)

### Step 1: Clone the repository / Bước 1: Clone repository
```bash
git clone https://github.com/mstrvndev/unofficialACBapi.git
cd unofficialACBapi
```

### Step 2: Install Node.js dependencies / Bước 2: Cài đặt các gói Node.js
```bash
npm install
```

### Step 3: Download and setup Captcha Solver / Bước 3: Tải và cài đặt Captcha Solver

**English:**
1. Download the Captcha Solver from: [Google Drive](https://drive.google.com/file/d/1JKXHw32Y2eeRNLJ7VEEwu5FKU7X1PSt3/view?usp=sharing)
2. Extract the zip file
3. Install Python dependencies:
```bash
cd acb_captcha
pip install -r requirements.txt
```
4. Run the captcha solver server:
```bash
python app.py
```

**Tiếng Việt:**
1. Tải Captcha Solver từ: [Google Drive](https://drive.google.com/file/d/1JKXHw32Y2eeRNLJ7VEEwu5FKU7X1PSt3/view?usp=sharing)
2. Giải nén file zip
3. Cài đặt các gói Python:
```bash
cd acb_captcha
pip install -r requirements.txt
```
4. Chạy server captcha solver:
```bash
python app.py
```

### Step 4: Configure / Bước 4: Cấu hình
Edit `config/constants.js` with your ACB credentials / Chỉnh sửa `config/constants.js` với thông tin đăng nhập ACB của bạn.

### Step 5: Run / Bước 5: Chạy
```bash
node main.js
```

---

## Project Structure / Cấu trúc dự án

```
unofficialACBapi/
 main.js                 # Main entry point / Điểm vào chính
 lib/
    index.js            # Library exports / Xuất thư viện
    ACBLoginAutomation.js   # Login automation / Tự động đăng nhập
    CookieManager.js    # Cookie management / Quản lý cookie
    FlaskCaptchaSolver.js   # Captcha solver client / Client giải captcha
    httpAgents.js       # HTTP agents / Các agent HTTP
 config/
    constants.js        # Configuration constants / Các hằng số cấu hình
 package.json
```

---

## Dependencies / Phụ thuộc

- [axios](https://www.npmjs.com/package/axios) - HTTP client
- [cheerio](https://www.npmjs.com/package/cheerio) - HTML parsing / Phân tích HTML

---

## Disclaimer / Tuyên bố miễn trừ trách nhiệm

**English:** This is an unofficial API and is not affiliated with or endorsed by ACB Bank. Use at your own risk.

**Tiếng Việt:** Đây là API không chính thức và không liên kết hay được xác nhận bởi Ngân hàng ACB. Sử dụng theo rủi ro của riêng bạn.

## License
MIT
