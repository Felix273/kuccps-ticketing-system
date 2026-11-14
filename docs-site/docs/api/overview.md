# API Overview

All API endpoints are prefixed with `/api`. Responses are JSON.

## Base URL

```
http://localhost:5000/api
```

## Response Format

Standard response envelope:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

## Authentication

### JWT Bearer Token

Protected routes require a JWT token in the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

### Public API Key

Public ticket endpoints require an API key:

```http
X-API-Key: <PUBLIC_TICKET_API_KEY>
```

Or as a bearer token depending on server configuration.

## Rate Limiting

| Scope | Window | Max Requests |
|-------|--------|-------------|
| Global | 15 minutes | 600 |
| Auth | 15 minutes | 30 |
| Public tickets | 15 minutes | 30 |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 413 | Payload Too Large |
| 415 | Unsupported Media Type |
| 429 | Too Many Requests |
| 500 | Server Error |

## Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

## Pagination

List endpoints support pagination via query parameters:

```
GET /api/tickets?page=1&limit=20
```

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

## Filtering

Many list endpoints support filtering:

```
GET /api/tickets?status=Open&priority=High&departmentId=uuid
```

## Sorting

```
GET /api/tickets?sortBy=createdAt&sortOrder=desc
```
