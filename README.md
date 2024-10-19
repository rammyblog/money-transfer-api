# Money Transfer API Documentation

This document provides details on the Money Transfer API

## Authentication

### POST `/auth/login`

Authenticate a user and receive a JWT token.

- **Request:**

  ```json
  {
    "username": "johndoe",
    "password": "password123"
  }
  ```

- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
  }
  ```

## Users

### POST `/users`

Create a new user.

- **Request:**

  ```json
  {
    "username": "johndoe",
    "email": "johndoe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "password123"
  }
  ```

- **Response:**

  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "balance": 100.0
  }
  ```

- **Errors:**
  - `409 Conflict`: Username or email already exists.

### GET `/users/:id`

Get user details by ID.

- **Request Parameters:**

  - `id` (number): The ID of the user.

- **Response:**

  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

- **Errors:**
  - `404 Not Found`: User not found.

## Transfers

### POST `/transfers`

Initiate a money transfer between users.

- **Request:**

  ```json
  {
    "toUser": "janedoe",
    "amount": 50.0
  }
  ```

- **Response:**

  ```json
  {
    "id": 1,
    "fromUser": {
      "id": 1,
      "username": "johndoe"
    },
    "toUser": {
      "id": 2,
      "username": "janedoe"
    },
    "amount": 50.0,
    "createdAt": "2024-10-10T10:00:00.000Z"
  }
  ```

- **Errors:**
  - `400 Bad Request`: Insufficient funds or invalid transfer amount.
  - `404 Not Found`: User not found.

### GET `/transfers`

List user's transfers with pagination.

- **Request Query Parameters:**

  - `page` (number): Page number for pagination.
  - `limit` (number): Number of transfers per page.
  - `fromUser` (optional): Filter by sender's username.
  - `toUser` (optional): Filter by recipient's username.

- **Response:**
  ```json
  {
    "transfers": [
      {
        "id": 1,
        "fromUser": {
          "id": 1,
          "username": "johndoe"
        },
        "toUser": {
          "id": 2,
          "username": "janedoe"
        },
        "amount": 50.0,
        "createdAt": "2024-10-10T10:00:00.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

## Error Codes

| Status Code | Description                                                           |
| ----------- | --------------------------------------------------------------------- |
| `400`       | Bad Request: The request could not be processed due to invalid input. |
| `401`       | Unauthorized: The user is not authenticated.                          |
| `403`       | Forbidden: The user does not have permission to access this resource. |
| `404`       | Not Found: The resource could not be found.                           |
| `409`       | Conflict: The resource already exists (e.g., duplicate username).     |

## Authentication & Authorization

All endpoints (except for `/auth/login`) require authentication using a Bearer token (JWT). Include the token in the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

### JWT Example:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Installation

```bash
$ npm install
```

## Running the app

```bash
# Copy the env files
$ cp .env.sample .env

# Run docker for the postgres and redis
$ docker-compose up -d

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing

```bash
$ npm run test
```

## API Documentation

## [Postman API documentation](https://documenter.getpostman.com/view/15213147/2sA3JJAinf)

## License

This project is licensed under the MIT License.
