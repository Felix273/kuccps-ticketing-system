# Deployment Readiness

Use this checklist before moving KUCCPS IT Ticketing from local testing to production.

## Public URL

- Use a named Cloudflare Tunnel or official HTTPS domain.
- Update `API_URL` in Apps Script Script Properties.
- Avoid quick `trycloudflare.com` URLs for production because they change when the tunnel restarts.

## Google Workspace Add-on

- Deploy from the dedicated ticketing/admin Workspace account.
- Store these values in Apps Script Script Properties:
  - `API_URL`
  - `BACKEND_API_KEY`
  - `SUPPORT_EMAIL`
- Run `setupProductionProperties` once after pasting `Code.gs` if properties are empty.
- Create a new deployment version after every `Code.gs` change.
- Domain-install the add-on for KUCCPS users when ready.

## Email

- Use one dedicated support mailbox, for example `itsupport@kuccps.ac.ke`.
- Configure SMTP in the system Email Settings.
- Let the backend send official ticket confirmations, replies, and status updates.
- Test ticket creation, public reply, agent comment, resolution, and closure under the same ticket number.

## Backend

- Run the production checks:

```bash
cd backend
npm run preflight
npx prisma migrate deploy
npx prisma generate
```

- Confirm `.env` has no duplicate keys.
- Rotate `PUBLIC_TICKET_API_KEY` before production.
- Keep `REQUIRE_PUBLIC_TICKET_API_KEY=true`.
- Set `NODE_ENV=production`.

## Active Directory

- Confirm LDAP URL, bind DN, bind password, search base, and search filter.
- Confirm directorate/department mapping before enabling AD-only login.
- Keep at least one tested break-glass admin path during rollout.

## Backups

- Schedule PostgreSQL backups.
- Test a restore before go-live.
- Back up uploaded attachments and knowledge-base files.
