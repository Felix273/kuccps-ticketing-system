# Notifications API

Base path: `/api/notifications`

All notification endpoints require JWT authentication.

## Get Notifications

```http
GET /api/notifications
```

### Response

```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "sla_breach",
      "title": "SLA Breach Alert",
      "message": "Ticket TICK20260814-0001 has breached its SLA.",
      "isRead": false,
      "ticketId": "uuid",
      "ticketNumber": "TICK20260814-0001",
      "createdAt": "2026-08-14T09:00:00.000Z"
    }
  ]
}
```

## Mark All as Read

```http
PUT /api/notifications/read/all
```

### Response

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## Mark One as Read

```http
PUT /api/notifications/:id/read
```

## Dismiss Notification

```http
DELETE /api/notifications/:id
```

## Get Preferences

```http
GET /api/notifications/preferences
```

### Response

```json
{
  "success": true,
  "preferences": {
    "emailOnAssignment": true,
    "emailOnStatusChange": true,
    "emailOnNewComment": true,
    "dailyDigest": false,
    "escalationAlerts": true
  }
}
```

## Update Preferences

```http
PUT /api/notifications/preferences
```

```json
{
  "emailOnAssignment": true,
  "emailOnStatusChange": false,
  "emailOnNewComment": true,
  "dailyDigest": true,
  "escalationAlerts": true
}
```

## Send Test Email

```http
POST /api/notifications/test
```

Sends a test notification email to the current user's email address.

```json
{
  "success": true,
  "message": "Test email sent"
}
```
