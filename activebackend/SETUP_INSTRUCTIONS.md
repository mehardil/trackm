# Setup Instructions

## 1. Environment Configuration

### Create `.env` file:
Copy `env_example.txt` to `.env` and update the values:

```bash
cp env_example.txt .env
```

### Update `.env` with your values:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_jwt_key_here_change_this_in_production
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# Email Configuration
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
```

## 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## 3. Simple Login System

### Features:
- **No Password Hashing**: Passwords stored as provided
- **User Information Tracking**: Saves login details and last active time
- **Username Conflict Detection**: Checks if username exists in other organizations
- **JWT Tokens**: Secure authentication with user and organization data
- **Login History**: Tracks user activity

### What Gets Saved on Login:
- User ID, username, name, email, role
- Organization ID and name
- Last active timestamp
- Username conflict information

## 4. User Login System

### Login Flow:
1. **User Input**: Username/email + password
2. **User Lookup**: Find user in database with organization info
3. **Conflict Check**: Check if username exists in other organizations
4. **Activity Update**: Update last_active timestamp
5. **JWT Generation**: Create token with user and organization data
6. **Response**: Return token + user details + conflict info

### JWT Token Contents:
```json
{
  "user_id": 123,
  "username": "john.doe",
  "email": "john@example.com",
  "role": "admin",
  "org_id": 456,
  "org_name": "TechCorp",
  "exp": "2025-08-17T22:51:52"
}
```

### Username Conflict Detection:
- **Checks**: If username exists in other organizations
- **Response**: Returns list of conflicting organizations
- **Use Case**: Prevent username confusion across organizations

## 5. API Endpoints

### Authentication:
- `POST /login/login/` - User login with username/email + password
- `GET /login/check-username/{username}` - Check username availability across organizations
- `GET /login/user-info/{user_id}` - Get user login information and history
- `POST /signup/signup/` - User registration with organization creation
- `POST /signup/verify-otp` - Verify OTP to activate organization

### Response Format:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 123,
    "username": "john.doe",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "department": "Administration",
    "status": "active",
    "organization": {
      "id": 456,
      "name": "TechCorp",
      "contact_email": "contact@techcorp.com"
    },
    "username_in_other_orgs": false
  }
}
```

## 6. Database Setup

### Required Tables:
- `users` - User accounts with passwords and organization links
- `organizations` - Organization information
- `organization_otps` - OTP verification for organizations

### User Table Structure:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255), -- Stores password as provided
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    department VARCHAR(255),
    role VARCHAR(50),
    avatar_color VARCHAR(7),
    status VARCHAR(50),
    last_active TIMESTAMP,
    is_agent BOOLEAN
);
```

## 7. Testing

### Test Simple Login:
```bash
python test_simple_login.py
```

### Test Username Availability:
```bash
curl "http://localhost:8000/login/check-username/john.doe"
```

### Test User Info:
```bash
curl "http://localhost:8000/login/user-info/123"
```

## 8. Security Features

### JWT Security:
- **Environment Variables**: JWT secret key stored in `.env`
- **Configurable**: Token expiry and algorithm configurable
- **User Data**: Tokens contain user ID, role, and organization info
- **Verification**: Functions to verify and extract data from tokens

### Username Management:
- **Conflict Detection**: Identifies username conflicts across organizations
- **Organization Isolation**: Users can have same username in different orgs
- **Activity Tracking**: Monitors user login activity

## 9. Security Best Practices

- **Never commit `.env` file** to version control
- **Use strong JWT secret keys** in production
- **Monitor username conflicts** across organizations
- **Use environment-specific configurations** for different deployments
- **Verify JWT tokens** on all protected routes
- **Track user activity** for security monitoring
