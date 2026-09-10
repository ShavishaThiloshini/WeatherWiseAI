# WeatherWise AI Backend API Documentation

## Authentication Endpoints

### 1. User Registration

Create a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "string (required, 1-120 characters)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 8 characters, must contain uppercase, lowercase, and number)"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": "string (UUID)",
    "name": "string",
    "email": "string"
  },
  "token": "string (JWT)"
}
```

**Error Responses:**

- **400 Bad Request** - Validation errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message"
  }
}
```

- **409 Conflict** - Email already exists
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "A user with this email already exists"
  }
}
```

### 2. User Login

Authenticate with existing credentials.

**Endpoint:** `POST /api/v1/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string (required, valid email format)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "string (UUID)",
    "name": "string",
    "email": "string"
  },
  "token": "string (JWT)"
}
```

**Error Responses:**

- **400 Bad Request** - Validation errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email and password are required"
  }
}
```

- **401 Unauthorized** - Invalid credentials
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

## Authentication Middleware

### Protected Routes

All protected endpoints require a valid JWT token in the Authorization header.

**Header Format:**
```
Authorization: Bearer <token>
```

**Error Responses:**

- **401 Unauthorized** - Missing or invalid token
```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "A valid Bearer token is required"
  }
}
```

- **401 Unauthorized** - Invalid token
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The access token is invalid"
  }
}
```

- **401 Unauthorized** - Expired token
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "The access token has expired"
  }
}
```

## JWT Token Structure

The JWT token contains the following payload:

```json
{
  "sub": "user_id (UUID)",
  "email": "user_email",
  "name": "user_name",
  "iat": "issued_at_timestamp",
  "exp": "expiration_timestamp"
}
```

## Environment Variables

The backend requires the following environment variables:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=mysql://weatherwise:password@localhost:3306/weatherwise
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Security Notes

1. **Password Security:** Passwords are hashed using bcrypt with a salt factor of 10 before storage.
2. **Token Security:** JWT tokens are signed using the JWT_SECRET environment variable.
3. **Password Requirements:** Passwords must be at least 8 characters and contain uppercase, lowercase, and numeric characters.
4. **Email Validation:** Email addresses are validated for format and normalized to lowercase.
5. **No Sensitive Data Exposure:** Passwords and password hashes are never included in API responses.

## Frontend Integration Guide

### Registration Flow

1. Collect user input (name, email, password)
2. Validate input on client side
3. Send POST request to `/api/v1/auth/register`
4. Handle success response - store token and user data
5. Handle validation errors - display to user
6. Handle duplicate email error - prompt user to try different email

### Login Flow

1. Collect user input (email, password)
2. Validate input on client side
3. Send POST request to `/api/v1/auth/login`
4. Handle success response - store token and user data
5. Handle invalid credentials error - prompt user to retry

### Token Usage

1. Store the JWT token securely (consider secure storage mechanisms)
2. Include the token in the Authorization header for all protected requests
3. Handle token expiration errors - redirect to login screen
4. Handle invalid token errors - clear stored token and redirect to login

### Error Handling

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Input validation failed
- `EMAIL_ALREADY_EXISTS` - Duplicate email during registration
- `INVALID_CREDENTIALS` - Wrong email or password
- `AUTH_REQUIRED` - Missing authentication token
- `INVALID_TOKEN` - Malformed or invalid token
- `TOKEN_EXPIRED` - Token has expired
- `FORBIDDEN` - Insufficient permissions (for role-based access)

## Testing

The authentication endpoints have been tested with the following scenarios:

### Registration Tests
- ✅ Valid registration succeeds
- ✅ Missing fields are rejected
- ✅ Invalid email format is rejected
- ✅ Weak password is rejected
- ✅ Duplicate email is rejected
- ✅ Password is hashed (verified through bcrypt comparison)

### Login Tests
- ✅ Valid credentials succeed
- ✅ Incorrect password is rejected
- ✅ Unknown email is rejected
- ✅ Empty fields are rejected
- ✅ Valid token is generated

### Middleware Tests
- ✅ Valid token is accepted
- ✅ Missing token is rejected
- ✅ Invalid token is rejected
- ✅ Expired token is rejected (via error handling)

## Future Enhancements

While the current implementation provides a solid authentication foundation, future enhancements may include:

1. **Refresh Token Flow:** Implement refresh tokens for better security
2. **Password Reset:** Add forgot password functionality
3. **Email Verification:** Add email verification for new accounts
4. **Rate Limiting:** Add rate limiting to prevent brute force attacks
5. **Role-Based Access:** Implement role-based authorization using the `requireRole` middleware
6. **Account Status:** Add account status (active/inactive/suspended) checks