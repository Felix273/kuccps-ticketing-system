# Tickets API

Base path: `/api/tickets` (staff/admin) and `/api/public/tickets` (public)

## Get Tickets

```http
GET /api/tickets
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |
| `category` | string | Filter by category |
| `departmentId` | string | Filter by department |
| `assignedToId` | string | Filter by assignee |
| `search` | string | Search in subject/description |
| `sortBy` | string | Sort field |
| `sortOrder` | string | `asc` or `desc` |

### Response

```json
{
  "success": true,
  "tickets": [
    {
      "id": "uuid",
      "ticketNumber": "TICK20260814-0001",
      "subject": "Cannot access printer",
      "status": "Open",
      "priority": "Medium",
      "category": "Hardware",
      "requesterEmail": "user@example.com",
      "department": { "id": "uuid", "name": "ICT" },
      "assignedTo": { "id": "uuid", "name": "John Doe" },
      "createdAt": "2026-08-14T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

## Get Ticket

```http
GET /api/tickets/:id
```

### Response

```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "ticketNumber": "TICK20260814-0001",
    "subject": "Cannot access printer",
    "description": "The printer on the 3rd floor...",
    "status": "Open",
    "priority": "Medium",
    "category": "Hardware",
    "requesterEmail": "user@example.com",
    "requesterName": "John Doe",
    "slaDueAt": "2026-08-14T17:00:00.000Z",
    "slaBreached": false,
    "department": { "id": "uuid", "name": "ICT" },
    "assignedTo": { "id": "uuid", "name": "Jane Smith" },
    "createdBy": { "id": "uuid", "name": "John Doe" },
    "attachments": [
      { "id": "uuid", "filename": "error.png", "mimetype": "image/png" }
    ],
    "comments": [
      {
        "id": "uuid",
        "content": "Investigating...",
        "isInternal": false,
        "user": { "id": "uuid", "name": "Jane Smith" },
        "createdAt": "2026-08-14T09:30:00.000Z"
      }
    ],
    "history": [
      {
        "id": "uuid",
        "field": "status",
        "oldValue": "Open",
        "newValue": "In Progress",
        "createdAt": "2026-08-14T09:30:00.000Z"
      }
    ],
    "createdAt": "2026-08-14T09:00:00.000Z",
    "updatedAt": "2026-08-14T09:30:00.000Z"
  }
}
```

## Update Ticket

```http
PUT /api/tickets/:id
```

### Request Body

```json
{
  "status": "In Progress",
  "priority": "High",
  "assignedToId": "uuid",
  "departmentId": "uuid",
  "category": "Network",
  "slaDueAt": "2026-08-14T17:00:00.000Z"
}
```

### Response

```json
{
  "success": true,
  "message": "Ticket updated successfully",
  "ticket": { /* updated ticket object */ }
}
```

### Ticket lifecycle

- **Open**: newly received and awaiting work.
- **In Progress**: an officer is actively working on the request.
- **On Hold**: work is waiting on information, a dependency, a third party, or another blocker. It remains unresolved, visible in the backlog, and continues to age against its SLA. Resume it to **In Progress** (or **Open**) when work can continue.
- **Resolved**: support believes the issue is fixed. The requester is sent a satisfaction rating link; the optional comment can be left blank.
- **Closed**: a resolved ticket is finalized. It is counted as **Closed**, not **Resolved**, in status summaries and the ticket-list segments. Reopen either completed status to return it to **Open**.

The supported transitions are `Open -> In Progress | On Hold | Resolved`, `In Progress -> Open | On Hold | Resolved`, `On Hold -> Open | In Progress | Resolved`, `Resolved -> Open | Closed`, and `Closed -> Open`.

## Escalate Ticket

```http
POST /api/tickets/:id/escalate
```

### Request Body

```json
{
  "escalateToId": "uuid",
  "reason": "Requires senior network engineer"
}
```

## Add Comment

```http
POST /api/tickets/:id/comments
```

### Request Body

```json
{
  "content": "Working on this issue",
  "isInternal": false
}
```

## Upload Attachment

```http
POST /api/tickets/:id/attachments
Content-Type: multipart/form-data
```

### Form Data

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The file to upload |

### Response

```json
{
  "success": true,
  "message": "Attachment uploaded",
  "attachment": {
    "id": "uuid",
    "filename": "screenshot.png",
    "mimetype": "image/png",
    "size": 204800,
    "createdAt": "2026-08-14T09:00:00.000Z"
  }
}
```

## Create Public Ticket

```http
POST /api/public/tickets
```

### Headers

```http
X-API-Key: <PUBLIC_TICKET_API_KEY>
Content-Type: application/json
```

### Request Body

```json
{
  "subject": "Cannot access printer",
  "description": "The printer on the 3rd floor is not responding.",
  "category": "Hardware",
  "priority": "Medium",
  "requesterEmail": "user@example.com",
  "requesterName": "John Doe"
}
```

### Response

```json
{
  "success": true,
  "message": "Ticket created successfully",
  "ticket": {
    "id": "uuid",
    "ticketNumber": "TICK20260814-0001",
    "subject": "Cannot access printer",
    "status": "Open",
    "createdAt": "2026-08-14T09:00:00.000Z"
  }
}
```
