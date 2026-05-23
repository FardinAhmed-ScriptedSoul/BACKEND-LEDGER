# BACKEND-LEDGER

Bank Transaction System built with Express, MongoDB, JWT authentication, and transaction ledger support.

## Features

- User registration and login with JWT cookies
- Account creation and balance retrieval
- Transaction transfers with idempotency support
- System-only initial funds deposit route
- Token blacklist logout and logout-all session invalidation
- Race-condition test support via configurable delay

## Setup

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file in the project root with the following values:

```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/ledger
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
REFRESH_TOKEN=...
EMAIL_USER=...
TEST_DELAY_MS=0
```

3. Start the application

```bash
npm start
```

## API Documentation

### Base URL

- `http://localhost:4000`

### Health Check

- `GET /health`
- Response: `200 OK`
- Body:
  ```json
  {
    "status": "OK",
    "message": "Server context is healthy"
  }
  ```

### Authentication

#### Register User

- `POST /api/auth/register`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword",
    "name": "John Doe"
  }
  ```
- Success response: `201 Created`
- Response body:
  ```json
  {
    "status": "success",
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "<jwt_token>"
  }
  ```
- Notes: Sets an HTTP-only `token` cookie.

#### Login User

- `POST /api/auth/login`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword"
  }
  ```
- Success response: `200 OK`
- Response body:
  ```json
  {
    "status": "success",
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "<jwt_token>"
  }
  ```
- Notes: Sets an HTTP-only `token` cookie.

#### Logout Current Session

- `POST /api/auth/logout`
- Requires cookie authentication.
- Success response: `200 OK`
- Response body:
  ```json
  {
    "status": "success",
    "message": "Logged out successfully from this device."
  }
  ```

#### Logout and Blacklist Token

- `POST /api/auth/logout/blacklist`
- Requires cookie authentication.
- Success response: `200 OK`
- Response body:
  ```json
  {
    "status": "success",
    "message": "User logged out successfully and token blacklisted."
  }
  ```
- Notes: Invalidates the current token by explicitly blacklisting it.

#### Logout from All Devices

- `POST /api/auth/logout-all`
- Requires cookie authentication.
- Success response: `200 OK`
- Response body:
  ```json
  {
    "status": "success",
    "message": "Logged out from all active devices successfully. Notice email dispatched."
  }
  ```
- Notes: Increments `tokenVersion` to invalidate all existing tokens for the user.

### Account Management

All account routes require authentication via the `token` cookie.

#### Create Account

- `POST /api/accounts`
- Body: none
- Success response: `201 Created`
- Response body:
  ```json
  {
    "status": "success",
    "data": {
      "_id": "...",
      "user": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```

#### Get User Accounts

- `GET /api/accounts`
- Success response: `200 OK`
- Response body:
  ```json
  {
    "accounts": [
      {
        "_id": "...",
        "user": "...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
  ```

#### Get Account Balance

- `GET /api/accounts/balance/:accountId`
- Path parameter:
  - `accountId` - ID of the account to retrieve
- Success response: `200 OK`
- Response body:
  ```json
  {
    "accountId": "...",
    "balance": 12345
  }
  ```

### Transactions

#### Transfer Funds Between Accounts

- `POST /api/transactions`
- Body:
  ```json
  {
    "fromAccountId": "<sourceAccountId>",
    "toAccountId": "<destinationAccountId>",
    "amount": 100,
    "idempotencyKey": "optional-unique-key"
  }
  ```
- Success response: `200 OK` or `201 Created` depending on execution
- Response body:
  ```json
  {
    "message": "...",
    "transaction": { ... }
  }
  ```
- Notes: Use `idempotencyKey` to safely retry a transaction without duplication.

#### Create Initial Funds Transaction (System Only)

- `POST /api/transactions/system/initial-funds`
- Requires system-level auth user token
- Body:
  ```json
  {
    "toAccount": "<accountId>",
    "amount": 1000,
    "idempotencyKey": "optional-unique-key"
  }
  ```
- Success response: `200 OK`
- Response body:
  ```json
  {
    "message": "...",
    "transaction": { ... }
  }
  ```

## Testing

Run the full API test suite:

```bash
npm test
```

## Notes

- `COOKIE_SECURE` is enabled automatically in production mode.
- `TEST_DELAY_MS` can be used to simulate transaction race conditions in tests or local development.
- Production-ready deployment should ensure all required environment variables are set before startup.

