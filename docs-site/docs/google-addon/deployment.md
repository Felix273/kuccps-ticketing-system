# Add-on Deployment

This guide covers deploying the Google Workspace Add-on to production.

## Pre-Deployment Checklist

- [ ] Backend is deployed and accessible via HTTPS
- [ ] `PUBLIC_TICKET_API_KEY` is configured in production backend
- [ ] `REQUIRE_PUBLIC_TICKET_API_KEY=true` is set
- [ ] Google Workspace Add-on account is ready
- [ ] API_URL points to production backend
- [ ] Domain installation is configured

## Step 1: Update API URL

1. Open Apps Script project properties
2. Update `API_URL` to production backend URL:
   ```
   https://api.kuccps.ac.ke/api
   ```

## Step 2: Update API Key

Update `BACKEND_API_KEY` to the production API key.

## Step 3: Create New Deployment

1. In Apps Script IDE, click **Deploy > Manage deployments**
2. Click **New deployment**
3. Select **Add-on** type
4. Enter a version description (e.g., "Production v1.0")
5. Click **Deploy**

## Step 4: Domain Install

1. In Google Admin Console, go to **Apps > Google Workspace > Settings for Apps**
2. Find the add-on and configure **Installation access**
3. Set to **Install for everyone** or specific organizational units
4. Save changes

## Step 5: Verify Installation

1. Open Gmail as a test user
2. Look for the add-on icon in the compose window
3. Create a test ticket
4. Verify it appears in the backend

## Updating the Add-on

After every `Code.gs` change:

1. Click **Deploy > Manage deployments**
2. Click **Edit** on the current deployment
3. Select **New version**
4. Click **Deploy**

## Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| Add-on not visible | Ensure it is deployed as an add-on, not a web app |
| 401 errors | Check `BACKEND_API_KEY` matches backend config |
| CORS errors | Ensure `FRONTEND_URL` or `CORS_ORIGINS` includes the Apps Script domain |
| Network errors | Verify `API_URL` is accessible from the public internet |
