# Users API

Base path: `/api/users`

## Get Users

```http
GET /api/users
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Response

```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "System Administrator",
      "username": "admin",
      "role": "admin",
      "ldapSync": false,
      "departmentId": "uuid",
      "department": {
        "id": "uuid",
        "name": "ICT"
      },
      "createdAt": "2026-08-14T09:00:00.000Z"
    }
  ]
}
```

## Create User

```http
POST /api/users
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Request Body

```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "username": "newuser",
  "password": "securePassword123",
  "role": "staff",
  "departmentId": "uuid"
}
```

### Response

```json
{
  "success": true,
  "message": "User created successfully",
  "user": { /* user object */ }
}
```

## Update User

```http
PUT /api/users/:id
```

### Request Body

```json
{
  "name": "Updated Name",
  "role": "admin",
  "departmentId": "uuid",
  "password": "newPassword123"
}
```

> Note: Password is optional. If provided, it will be hashed and updated.

## Delete User

```http
DELETE /api/users/:id
```

### Response

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Sync from Active Directory

```http
POST /api/users/sync/ad
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

> Admin only.

### Response

```json
{
  "success": true,
  "message": "Users synced from Active Directory",
  "synced": 15
}
```
