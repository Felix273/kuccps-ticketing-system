# Production Checklist

Complete checklist for moving the KUCCPS IT Ticketing System from local testing to production.

## Before Deployment

- [ ] Create production PostgreSQL database
- [ ] Rotate `JWT_SECRET` to a strong random value (32+ characters)
- [ ] Rotate `PUBLIC_TICKET_API_KEY` to a strong random value (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` and `CORS_ORIGINS` to production HTTPS URLs
- [ ] Set `REQUIRE_PUBLIC_TICKET_API_KEY=true`
- [ ] Configure production SMTP credentials
- [ ] Configure IMAP only if inbound monitoring is required
- [ ] Set `LDAP_URL` to `ldaps://` (never `ldap://`)
- [ ] Configure file upload directory with appropriate permissions
- [ ] Set `ALLOW_PUBLIC_API_KEY_IN_BODY=false`
- [ ] Set TLS rejection flags to `true` for SMTP, IMAP, LDAP
- [ ] Update `SUPPORT_EMAIL` and `EMAIL_FROM` to production addresses

## Backend Deployment

- [ ] Run preflight checks: `npm run preflight`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Apply migrations: `npx prisma migrate deploy`
- [ ] Configure process manager (PM2, systemd, or Docker)
- [ ] Configure log rotation
- [ ] Set up health check monitoring (`/health`)
- [ ] Configure reverse proxy (Nginx or Cloudflare Tunnel)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall to allow only necessary ports
- [ ] Test health endpoint from external network

## Frontend Deployment

- [ ] Set `VITE_API_URL` to production backend URL
- [ ] Build frontend: `npm run build`
- [ ] Deploy to Vercel, Netlify, or static host
- [ ] Configure custom domain with HTTPS
- [ ] Test all routes and navigation
- [ ] Verify API calls work correctly
- [ ] Test on mobile devices

## Database

- [ ] Schedule automated daily backups
- [ ] Test restore procedure on a copy of production data
- [ ] Configure connection pooling if needed
- [ ] Set up database monitoring
- [ ] Document backup and restore procedures

## Email

- [ ] Test ticket creation email
- [ ] Test ticket update email
- [ ] Test ticket resolution email
- [ ] Verify sender domain has SPF/DKIM/DMARC records
- [ ] Monitor bounce and spam rates
- [ ] Test IMAP monitoring if enabled

## Google Workspace Add-on

- [ ] Update `API_URL` to production backend
- [ ] Update `BACKEND_API_KEY` to production key
- [ ] Create new deployment version in Apps Script
- [ ] Domain-install the add-on
- [ ] Test ticket creation from Gmail
- [ ] Verify ticket numbers are created correctly

## Active Directory

- [ ] Confirm LDAP URL, bind DN, bind password
- [ ] Confirm search base and filter
- [ ] Test user sync: `POST /api/users/sync/ad`
- [ ] Test directorate sync: `POST /api/departments/sync/ad`
- Test LDAP login
- [ ] Keep break-glass admin path available

## Security

- [ ] Verify CORS only allows production origins
- [ ] Verify rate limiting is active
- [ ] Verify security headers are present
- [ ] Run security audit on dependencies: `npm audit`
- [ ] Review `.gitignore` to ensure `.env` is not committed
- [ ] Verify file upload restrictions
- [ ] Test authentication failure handling

## Monitoring

- [ ] Set up uptime monitoring for `/health`
- [ ] Configure error logging (e.g., Sentry, Logflare)
- [ ] Set up database query monitoring
- [ ] Configure alerting for high error rates
- [ ] Monitor disk space for uploads

## Documentation

- [ ] Update this checklist with final values
- [ ] Document production URLs and credentials (securely)
- [ ] Share emergency contact information
- [ ] Document rollback procedure

## Go-Live

- [ ] Announce maintenance window if applicable
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Run database migrations
- [ ] Verify health check passes
- [ ] Test core user flows end-to-end
- [ ] Monitor logs for errors
- [ ] Announce system is live

## Post-Deployment

- [ ] Create initial departments
- [ ] Add staff and admin users
- [ ] Configure email templates
- [ ] Configure SLA policies
- [ ] Set up notification preferences
- [ ] Train users on the system
- [ ] Monitor for issues for 48 hours
