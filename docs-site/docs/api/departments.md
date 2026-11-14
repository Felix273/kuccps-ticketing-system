# Departments API

Base path: `/api/departments`

## Get Departments

```http
GET /api/departments
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Response

```json
{
  "success": true,
  "departments": [
    {
      "id": "uuid",
      "name": "ICT",
      "code": "ICT",
      "createdAt": "2026-08-14T09:00:00.000Z",
      "updatedAt": "2026-08-14T09:00:00.000Z"
    }
  ]
}
```

## Get Department

```http
GET /api/departments/:id
```

### Response

```json
{
  "success": true,
  "department": {
    "id": "uuid",
    "name": "ICT",
    "code": "ICT",
    "users": [
      { "id": "uuid", "name": "John Doe", "role": "staff" }
    ],
    "slaPolicies": [
      { "id": "uuid", "name": "Standard SLA", "isActive": true }
    ],
    "createdAt": "2026-08-14T09:00:00.000Z",
    "updatedAt": "2026-08-14T09:00:00.000Z"
  }
}
```

## Create Department

```http
POST /api/departments
```

### Request Body

```json
{
  "name": "Human Resources",
  "code": "HR"
}
```

## Update Department

```http
PUT /api/departments/:id
```

### Request Body

```json
{
  "name": "Human Resources",
  "code": "HR"
}
```

## Delete Department

```http
DELETE /api/departments/:id
```

### Response

```json
{
  "success": true,
  "message": "Department deleted successfully"
}
```

## Sync from Active Directory

```http
POST /api/departments/sync/ad
```

> Admin only.

### Response

```json
{
  "success": true,
  "message": "Directorates synced from Active Directory",
  "synced": 8
}
```
