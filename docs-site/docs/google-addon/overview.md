# Google Workspace Add-on Overview

The Google Workspace Add-on allows KUCCPS staff to create support tickets directly from Gmail.

## Quick Facts

| Aspect | Detail |
|--------|---------|
| Platform | Google Apps Script |
| Type | Gmail contextual add-on |
| Integration | Backend public ticket API |
| Auth | API key (`PUBLIC_TICKET_API_KEY`) |

## What the Add-on Does

- Provides a compose trigger in Gmail to create tickets
- Pre-fills ticket details from email context
- Submits tickets to the backend public API
- Displays the generated ticket number to the user

## Files

| File | Purpose |
|------|---------|
| `Code.gs` | Main Apps Script code |
| `appsscript.json` | Add-on manifest and configuration |

## Documentation Sections

- [Setup](./setup) — Creating and configuring the Apps Script project
- [Deployment](./deployment) — Deploying to production
- [API Integration](./api-integration) — Communicating with the backend
