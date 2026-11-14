# Add-on API Integration

This document describes how the Google Workspace Add-on communicates with the backend API.

## Endpoint Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/public/tickets` | Create a new ticket |
| `POST` | `/api/tickets/public` | Alias for Google Add-on compatibility |

## Authentication

All requests must include the `X-API-Key` header:

```http
X-API-Key: <PUBLIC_TICKET_API_KEY>
Content-Type: application/json
```

## Create Ticket Request

```javascript
function createTicket(formData) {
  const apiUrl = PropertiesService.getScriptProperties().getProperty('API_URL');
  const apiKey = PropertiesService.getScriptProperties().getProperty('BACKEND_API_KEY');
  
  const payload = {
    subject: formData.subject,
    description: formData.description,
    category: formData.category,
    priority: formData.priority,
    requesterEmail: Session.getActiveUser().getEmail(),
    requesterName: Session.getActiveUser().getDisplayName()
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-API-Key': apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(`${apiUrl}/public/tickets`, options);
  return JSON.parse(response.getContentText());
}
```

## Create Ticket Response

**Success:**

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

**Error:**

```json
{
  "success": false,
  "message": "Invalid API key"
}
```

## Error Handling

```javascript
function handleResponse(response) {
  const result = JSON.parse(response.getContentText());
  
  if (result.success) {
    return {
      ticketNumber: result.ticket.ticketNumber,
      message: result.message
    };
  } else {
    throw new Error(result.message || 'Unknown error');
  }
}
```

## Rate Limits

The public ticket endpoint is rate-limited:
- **30 requests per 15 minutes** per IP address

## Security Considerations

1. **Never log the API key** in client-side code.
2. **Validate inputs** before sending to the API.
3. **Handle errors gracefully** in the add-on UI.
4. **Use HTTPS** for the backend URL in production.
