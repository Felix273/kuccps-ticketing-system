# Google Workspace Add-on

The Google Workspace Add-on allows users to create support tickets directly from Gmail using a contextual add-on interface.

## Overview

The add-on is built with **Google Apps Script** and provides:

- **Compose Trigger:** Create tickets from Gmail compose window.
- **Contextual Trigger:** Create tickets from email threads.
- **Form Fields:** Subject, category, priority, and description pre-filled from email context.
- **Ticket Number Display:** Shows the generated ticket number after creation.
- **Email Notification:** Automatically sends a confirmation to the ICT support team.

## Directory Structure

```text
google-addon/
├── Code.gs           # Main Apps Script code
└── appsscript.json   # Add-on manifest
```

## Manifest Configuration

The `appsscript.json` defines the add-on configuration:

```json
{
  "timeZone": "Africa/Nairobi",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "addOns": {
    "common": {
      "name": "KUCCPS IT Support",
      "logoUrl": "https://example.com/logo.png",
      "useLocaleFromApp": true,
      "supportUrl": "https://example.com/support"
    },
    "gmail": {
      "contextualTriggers": [
        {
          "unconditional": {},
          "onTriggerFunction": "onGmailCompose"
        }
      ],
      "composeTrigger": {
        "draftAccess": "METADATA",
        "onTriggerFunction": "onGmailCompose"
      }
    }
  }
}
```

## API Integration

The add-on communicates with the backend through the public ticket API.

### Endpoint

```http
POST /api/public/tickets
```

Or for Google Add-on compatibility:

```http
POST /api/tickets/public
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
  "requesterEmail": "user@example.ac.ke",
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

## Apps Script Properties

Store these values in **Apps Script > Project Settings > Script Properties**:

| Property | Value | Purpose |
|----------|-------|---------|
| `API_URL` | `https://api.example.ac.ke/api` | Backend API base URL |
| `BACKEND_API_KEY` | Your public ticket API key | Authentication |
| `SUPPORT_EMAIL` | `itsupport@kuccps.ac.ke` | Support mailbox |

## Setup Function

Run `setupProductionProperties` once after pasting `Code.gs` if properties are empty:

```javascript
function setupProductionProperties() {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('API_URL', 'https://api.example.ac.ke/api');
  properties.setProperty('BACKEND_API_KEY', 'your-api-key-here');
  properties.setProperty('SUPPORT_EMAIL', 'itsupport@kuccps.ac.ke');
}
```

## Deployment

1. Open the Apps Script project in Google Workspace.
2. Click **Deploy > Test deployments** to test as yourself.
3. Click **Deploy > New deployment**.
4. Select **Add-on** as the deployment type.
5. Configure deployment settings and install for domain.
6. After every `Code.gs` change, create a new deployment version.

## Security

- The add-on uses the `PUBLIC_TICKET_API_KEY` for authentication.
- Set `REQUIRE_PUBLIC_TICKET_API_KEY=true` in production.
- Never expose the API key in client-side code outside the Apps Script environment.
- The backend enforces rate limiting on public ticket endpoints.
