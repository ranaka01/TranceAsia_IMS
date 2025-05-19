# Forgot Password Feature Implementation

This document provides instructions on how to set up and use the "Forgot Password" feature with OTP verification for the Trance Asia Computers Inventory Management System.

## Features

- Email verification for password reset
- Secure 6-digit OTP generation and verification
- 15-minute OTP expiration
- Maximum 3 attempts for OTP verification
- Password complexity validation
- Rate limiting to prevent brute force attacks

## Setup Instructions

### 1. Database Setup

Run the migration script to create the required `password_reset_tokens` table:

```bash
cd backend
node scripts/createPasswordResetTable.js
```

### 2. Email Configuration

1. Create a `.env` file in the `backend` directory based on the `.env.sample` file
2. Configure the email settings:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

**Note for Gmail users:** You need to use an "App Password" instead of your regular password. To generate an App Password:
1. Enable 2-Step Verification on your Google Account
2. Go to your Google Account > Security > App passwords
3. Select "Mail" as the app and "Other" as the device
4. Enter a name (e.g., "Trance Asia IMS")
5. Copy the generated 16-character password and use it as EMAIL_PASS

### 3. Start the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

## How to Use

### For Users

1. Navigate to the login page
2. Click on the "Forgot Password?" link below the login form
3. Enter your registered email address and click "Send OTP"
4. Check your email for the 6-digit OTP code
5. Enter the OTP code in the verification form
6. Set a new password (minimum 8 characters)
7. Log in with your new password

### For Administrators

The system logs all password reset attempts and successful resets. You can monitor these activities in the server logs.

## Security Considerations

- OTPs expire after 15 minutes
- OTPs are invalidated after 3 failed attempts
- OTPs are invalidated after successful password reset
- Passwords must be at least 8 characters long
- All sensitive data is properly hashed and secured
- Rate limiting is implemented to prevent brute force attacks

## Troubleshooting

- **OTP not received**: Check spam folder, verify email address is correct, ensure email configuration is properly set up
- **Invalid OTP error**: Ensure you're entering the most recent OTP, request a new OTP if needed
- **Expired OTP**: Request a new OTP if more than 15 minutes have passed
- **Too many failed attempts**: Request a new OTP after 3 failed attempts

## Technical Implementation

- Backend: Node.js with Express
- Email: Nodemailer
- Database: MySQL
- Frontend: React with Tailwind CSS
- Authentication: JWT
