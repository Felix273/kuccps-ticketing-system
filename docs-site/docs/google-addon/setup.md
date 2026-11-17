# Add-on Setup

This guide covers setting up the Google Workspace Add-on for development and testing.

## Prerequisites

- A Google Workspace account with access to Apps Script
- The backend deployed and accessible from the internet
- A `PUBLIC_TICKET_API_KEY` configured on the backend

## Step 1: Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Rename the project to `KUCCPS IT Support Add-on`

## Step 2: Paste Code

1. Open `Code.gs` in the Apps Script editor
2. Paste the contents of `google-addon/Code.gs`
3. Open `appsscript.json` and paste the contents of `google-addon/appsscript.json`

## Step 3: Configure Script Properties

1. In the Apps Script IDE, click **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. Add the following properties:

| Property | Value | Description |
|----------|-------|-------------|
| `API_URL` | `https://api.example.ac.ke/api` | HTTPS backend API base URL |
| `BACKEND_API_KEY` | Same value as backend `PUBLIC_TICKET_API_KEY` | Authentication key; store only in Script Properties |
| `SUPPORT_EMAIL` | `itsupport@kuccps.ac.ke` | Support email address |

The add-on appends `/public/tickets` to `API_URL`. For production, use the public HTTPS
API base ending in `/api`. Never put the API key in `Code.gs` or a frontend `VITE_*`
variable.

## Step 4: Confirm Script Properties

Set `API_URL`, `BACKEND_API_KEY`, and `SUPPORT_EMAIL` under **Project Settings → Script
Properties**. The optional `setupProductionProperties` helper only fills a missing support
email; it does not set the endpoint or key.

## Step 5: Test Deployment

1. Click **Deploy > Test deployments**
2. Select **Install** to test as yourself
3. Open Gmail and look for the add-on icon in the compose window or email thread

## Step 6: Create Production Deployment

1. Click **Deploy > New deployment**
2. Select **Add-on** as the deployment type
3. Configure deployment settings
4. Click **Install** to install for your domain

## Local Testing with an HTTPS Tunnel

The add-on rejects non-HTTPS API URLs. For local testing, use an approved HTTPS tunnel to
expose the local backend:

```bash
# Using ngrok
ngrok http 5000

# Using cloudflared
cloudflared tunnel --url http://localhost:5000
```

Set `API_URL` to the tunnel's backend API base plus `/api`, for example
`https://<tunnel-host>/api`. Use a short-lived development API key, never the production key.

> **Warning:** Do not use temporary tunnel URLs for production. Use a named Cloudflare Tunnel or official HTTPS domain.

## Debugging

- Use **View > Logs** in Apps Script to see console output.
- Use `Logger.log()` statements in `Code.gs` for debugging.
- Check backend logs for API request details.
