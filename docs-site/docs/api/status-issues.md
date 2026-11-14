# Status Issues API

Base path: `/api/status-issues`

## Public Status Issues

### List Public Issues

```http
GET /api/status-issues/public
```

### Response

```json
{
  "success": true,
  "issues": [
    {
      "id": "uuid",
      "title": "Email Service Outage",
      "description": "Email delivery is delayed...",
      "status": "Investigating",
      "severity": "Error",
      "systems": "Email",
      "isPublic": true,
      "startedAt": "2026-08-14T08:00:00.000Z",
      "updates": [
        {
          "id": "uuid",
          "message": "We are investigating the issue.",
          "status": "Investigating",
          "isPublic": true,
          "createdAt": "2026-08-14T08:30:00.000Z"
        }
      ]
    }
  ]
}
```

## Staff/Admin Issues

### List Issues

```http
GET /api/status-issues
```

### Create Issue

```http
POST /api/status-issues
```

```json
{
  "title": "Email Service Outage",
  "description": "Email delivery is delayed for all users.",
  "status": "Investigating",
  "severity": "Error",
  "systems": "Email, SMTP",
  "isPublic": true
}
```

### Update Issue

```http
PUT /api/status-issues/:id
```

```json
{
  "status": "Resolved",
  "severity": "Error",
  "isPublic": true
}
```

### Add Update

```http
POST /api/status-issues/:id/updates
```

```json
{
  "message": "Service has been restored.",
  "status": "Resolved",
  "isPublic": true
}
```
