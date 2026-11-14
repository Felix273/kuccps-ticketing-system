# Operations API

Base path: `/api/operations`

## Dashboard Analytics

```http
GET /api/operations/dashboard
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Response

```json
{
  "success": true,
  "statistics": {
    "totalTickets": 150,
    "openTickets": 45,
    "inProgressTickets": 30,
    "resolvedTickets": 70,
    "closedTickets": 5,
    "criticalTickets": 3,
    "overdueTickets": 8,
    "avgResponseTime": 120,
    "avgResolutionTime": 480,
    "slaComplianceRate": 0.92,
    "ticketsByCategory": {
      "Hardware": 30,
      "Software": 50,
      "Network": 25,
      "Access": 20,
      "General Issues": 25
    },
    "ticketsByPriority": {
      "Low": 40,
      "Medium": 70,
      "High": 30,
      "Critical": 10
    },
    "ticketsByStatus": {
      "Open": 45,
      "In Progress": 30,
      "Resolved": 70,
      "Closed": 5
    },
    "ticketsByHour": [
      { "hour": "09:00", "count": 12 },
      { "hour": "10:00", "count": 18 }
    ],
    "departmentStats": [
      { "name": "ICT", "count": 60 },
      { "name": "HR", "count": 30 }
    ],
    "topPerformers": [
      { "name": "Jane Smith", "resolved": 25, "avgTime": 180 }
    ]
  }
}
```

## SLA Policies

### List Policies

```http
GET /api/operations/sla-policies
```

### Create Policy

```http
POST /api/operations/sla-policies
```

```json
{
  "name": "Standard SLA",
  "priority": "Medium",
  "category": "Software",
  "departmentId": "uuid",
  "responseMinutes": 240,
  "resolutionMinutes": 1440,
  "isActive": true
}
```

### Update Policy

```http
PUT /api/operations/sla-policies/:id
```

## CSAT Response

```http
POST /api/operations/csat
```

### Headers

```http
Authorization: Bearer <jwt-token>
```

### Request Body

```json
{
  "ticketId": "uuid",
  "rating": 5,
  "comment": "Excellent support!"
}
```

### Response

```json
{
  "success": true,
  "message": "CSAT response submitted",
  "csat": { /* csat object */ }
}
```
