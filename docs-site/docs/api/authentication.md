# Authentication API

Base path: `/api/auth`

## Login

```http
POST /api/auth/login
```

### Request

```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Response

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "System Administrator",
    "username": "admin",
    "role": "admin",
    "departmentId": "uuid",
    "department": {
      "id": "uuid",
      "name": "ICT"
    }
  }
}
```

## Logout

```http
POST /api/auth/logout
```

No request body required. Primarily for client-side token cleanup.

## Profile

```http
GET /api/auth/profile
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Response

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "System Administrator",
    "username": "admin",
    "role": "admin",
    "departmentId": "uuid",
    "department": {
      "id": "uuid",
      "name": "ICT"
    }
  }
}
```
