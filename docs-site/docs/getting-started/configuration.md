# Configuration

The KUCCPS IT Ticketing System uses environment variables for configuration. Never commit real credentials to version control.

## Backend Configuration

Create a `.env` file in the `backend/` directory.

### Database

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name?schema=public"
```

### Server

```env
PORT=5000
NODE_ENV=development
```

### JWT Authentication

```env
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=7d
```

- `JWT_SECRET` must be at least 32 characters in production.

### CORS

```env
FRONTEND_URL=http://localhost:5173,http://localhost:5174
```

For local development, both Vite ports are allowed. In production, use HTTPS URLs.

### Public Ticket API Key

```env
PUBLIC_TICKET_API_KEY=change-this-to-a-long-random-secret
REQUIRE_PUBLIC_TICKET_API_KEY=true
```

- Used by the Google Workspace Add-on to create tickets.
- Must be at least 32 characters in production.

### SMTP / Outbound Email

```env
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM="KUCCPS IT Support <itsupport@example.ac.ke>"
SUPPORT_EMAIL=itsupport@example.ac.ke
```

### IMAP / Inbound Email Monitoring

```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=
IMAP_PASSWORD=
IMAP_TLS=true
```

Email monitoring is disabled unless `EMAIL_USER` and `IMAP_USER` are configured.

### LDAP / Active Directory

```env
USE_LDAP_AUTH=false
LDAP_URL=ldaps://ldap.example.ac.ke:636
LDAP_BIND_DN=
LDAP_BIND_PASSWORD=
LDAP_SEARCH_BASE=
LDAP_SEARCH_FILTER=(uid={{username}})
```

- Use `ldaps://` (LDAPS) in production, never plain `ldap://`.

### File Uploads

```env
MAX_FILE_SIZE=10485760
MAX_UPLOAD_BYTES=10485760
MAX_KB_UPLOAD_BYTES=5242880
UPLOAD_DIR=./uploads
```

### Production Hardening

```env
ALLOW_PUBLIC_API_KEY_IN_BODY=false
SMTP_TLS_REJECT_UNAUTHORIZED=true
IMAP_TLS_REJECT_UNAUTHORIZED=true
LDAP_TLS_REJECT_UNAUTHORIZED=true
JSON_BODY_LIMIT=1mb
```

## Frontend Configuration

Create a `.env` file in the `frontend/` directory.

```env
VITE_API_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_URL=https://api.example.ac.ke/api
```

## Environment Variable Reference

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | — |
| `PORT` | Backend server port | No | `5000` |
| `NODE_ENV` | Runtime environment | No | `development` |
| `JWT_SECRET` | JWT signing secret | Yes | — |
| `JWT_EXPIRES_IN` | Token expiration | No | `7d` |
| `FRONTEND_URL` | Allowed CORS origins | No | `http://localhost:5173,http://localhost:5174` |
| `PUBLIC_TICKET_API_KEY` | Google Add-on API key | Yes | — |
| `REQUIRE_PUBLIC_TICKET_API_KEY` | Enforce API key check | No | `true` |
| `EMAIL_SERVICE` | SMTP provider | No | `gmail` |
| `EMAIL_USER` | SMTP username | Conditional | — |
| `EMAIL_PASSWORD` | SMTP password | Conditional | — |
| `EMAIL_FROM` | Sender display name | No | `KUCCPS IT Support` |
| `SUPPORT_EMAIL` | Support mailbox | No | `itsupport@kuccps.ac.ke` |
| `IMAP_HOST` | IMAP server host | Conditional | `imap.gmail.com` |
| `IMAP_PORT` | IMAP server port | Conditional | `993` |
| `IMAP_USER` | IMAP username | Conditional | — |
| `IMAP_PASSWORD` | IMAP password | Conditional | — |
| `USE_LDAP_AUTH` | Enable LDAP login | No | `false` |
| `LDAP_URL` | LDAP server URL | Conditional | — |
| `MAX_FILE_SIZE` | Max upload size in bytes | No | `10485760` |
| `UPLOAD_DIR` | Upload storage path | No | `./uploads` |
| `VITE_API_URL` | Frontend API base URL | Yes | — |

## Configuration Best Practices

1. **Never commit `.env` files** — they are gitignored by default.
2. **Rotate secrets before production** — generate new `JWT_SECRET` and `PUBLIC_TICKET_API_KEY`.
3. **Use HTTPS in production** — update `FRONTEND_URL` and `VITE_API_URL` accordingly.
4. **Use LDAPS, not LDAP** — plain LDAP sends credentials in cleartext.
5. **Configure production CORS explicitly** — avoid wildcard origins.
