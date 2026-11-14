# Views API

Base path: `/api/views`

Saved views allow users to save and reuse ticket filter configurations.

## Get Views

```http
GET /api/views
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Response

```json
{
  "success": true,
  "views": [
    {
      "id": "uuid",
      "name": "My Open Tickets",
      "entity": "tickets",
      "filters": {
        "status": "Open",
        "assignedToId": "current-user-uuid"
      },
      "columns": ["ticketNumber", "subject", "status", "priority", "createdAt"],
      "sortBy": "createdAt",
      "sortOrder": "desc",
      "visibility": "private",
      "role": null,
      "ownerId": "uuid",
      "createdAt": "2026-08-14T09:00:00.000Z",
      "updatedAt": "2026-08-14T09:00:00.000Z"
    }
  ]
}
```

## Create View

```http
POST /api/views
```

```json
{
  "name": "Critical Hardware Issues",
  "entity": "tickets",
  "filters": {
    "priority": "Critical",
    "category": "Hardware"
  },
  "columns": ["ticketNumber", "subject", "status", "assignedTo", "createdAt"],
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "visibility": "private"
}
```

### Visibility Options

| Value | Scope |
|-------|-------|
| `private` | Owner only |
| `shared` | All staff |
| `global` | All users (including public) |

## Update View

```http
PUT /api/views/:id
```

```json
{
  "name": "Updated View Name",
  "filters": {
    "status": "Open",
    "priority": "High"
  },
  "sortBy": "priority",
  "sortOrder": "asc"
}
```

## Delete View

```http
DELETE /api/views/:id
```

## View Structure

```json
{
  "id": "uuid",
  "name": "string",
  "entity": "string",
  "filters": {
    "status": "string | string[]",
    "priority": "string | string[]",
    "category": "string | string[]",
    "departmentId": "string | string[]",
    "assignedToId": "string | string[]",
    "createdById": "string | string[]",
    "dateFrom": "ISO date string",
    "dateTo": "ISO date string",
    "search": "string"
  },
  "columns": ["string"],
  "sortBy": "string",
  "sortOrder": "asc | desc",
  "visibility": "private | shared | global",
  "role": "string | null",
  "ownerId": "string | null"
}
```
