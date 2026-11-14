# Settings API

Base path: `/api/settings`

## Get Settings

```http
GET /api/settings
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
  "settings": {
    "organizationName": "KUCCPS IT Support",
    "organizationCode": "KUCCPS",
    "primaryColor": "#911414",
    "secondaryColor": "#d20001",
    "supportEmail": "itsupport@kuccps.ac.ke",
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "ldapEnabled": false,
    "darkModeEnabled": false,
    "contrastMode": "normal"
  }
}
```

## Update Settings

```http
PUT /api/settings
```

### Request Body

```json
{
  "organizationName": "KUCCPS IT Support",
  "primaryColor": "#911414",
  "secondaryColor": "#d20001",
  "supportEmail": "itsupport@kuccps.ac.ke",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUser": "user@gmail.com",
  "smtpPassword": "app-password",
  "imapHost": "imap.gmail.com",
  "imapPort": 993,
  "imapUser": "user@gmail.com",
  "imapPassword": "app-password",
  "ldapEnabled": true,
  "ldapUrl": "ldaps://ldap.example.ac.ke:636"
}
```

## Get Public Settings

```http
GET /api/settings/public
```

No authentication required. Returns public branding settings:

```json
{
  "success": true,
  "settings": {
    "organizationName": "KUCCPS IT Support",
    "primaryColor": "#911414",
    "secondaryColor": "#d20001",
    "logoUrl": null,
    "faviconUrl": null,
    "darkModeEnabled": false,
    "contrastMode": "normal"
  }
}
```

## Email Templates

### List Templates

```http
GET /api/settings/email-templates
```

### Get Template

```http
GET /api/settings/email-templates/ticketCreated
```

### Create Template

```http
POST /api/settings/email-templates
```

```json
{
  "type": "ticketCreated",
  "subject": "Ticket Created: {{ticketNumber}}",
  "html": "<p>Your ticket {{ticketNumber}} has been created.</p>"
}
```

### Update Template

```http
PUT /api/settings/email-templates/ticketCreated
```

### Delete Template

```http
DELETE /api/settings/email-templates/ticketCreated
```

### Reset Templates

```http
POST /api/settings/email-templates/reset
```

Resets all templates to their default values.
