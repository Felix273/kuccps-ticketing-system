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
HOST=127.0.0.1
NODE_ENV=development
```

### JWT Authentication

```env
JWT_SECRET=<unique-random-value>
JWT_EXPIRES_IN=8h
```

- Generate a unique random `JWT_SECRET` with at least 32 characters for production; for
  example, `openssl rand -hex 32`. Do not use the example placeholder as a value.

### CORS

```env
FRONTEND_URL=http://localhost:5173,http://localhost:5174
```

For local development, both Vite ports are allowed. In production, use HTTPS URLs.

### Public Ticket API Key

```env
PUBLIC_TICKET_API_KEY=<different-unique-random-value>
REQUIRE_PUBLIC_TICKET_API_KEY=true
```

- Used by the Google Workspace Add-on to create tickets.
- Generate a different, unique random value of at least 32 characters in production.

### SMTP / Outbound Email

```env
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM="KUCCPS IT Support <itsupport@example.ac.ke>"
SUPPORT_EMAIL=itsupport@example.ac.ke
```

For resolved-ticket satisfaction links, set `PUBLIC_APP_URL` to the public frontend
origin (for example `https://ticketing.example.ac.ke`). The email links contain signed,
30-day feedback tokens and must open the frontend, not the backend API. In production,
do not use a localhost URL.

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
MAX_UPLOAD_BYTES=10485760
MAX_KB_UPLOAD_BYTES=15728640
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

### Initial Administrator

For a new database without an administrator, set these only for the initial seed:

```env
BOOTSTRAP_ADMIN_USERNAME=
BOOTSTRAP_ADMIN_EMAIL=
BOOTSTRAP_ADMIN_NAME=
BOOTSTRAP_ADMIN_PASSWORD=
```

The bootstrap password must be at least 16 characters and contain uppercase, lowercase,
and numeric characters. Remove it from the service environment after the account is created.

## Frontend Configuration

Create a `.env` file in the `frontend/` directory.

```env
VITE_API_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_URL=/api
```

Use `/api` with a same-origin reverse proxy, or an HTTPS API URL such as
`https://api.example.ac.ke/api`. This is a build-time public setting, not a secret.

## Environment Variable Reference

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | — |
| `PORT` | Backend server port | No | `5000` |
| `HOST` | Backend bind address | No | `0.0.0.0` in development, `127.0.0.1` in production |
| `NODE_ENV` | Runtime environment | No | `development` |
| `JWT_SECRET` | JWT signing secret | Yes | — |
| `JWT_EXPIRES_IN` | Token expiration | No | `8h` |
| `FRONTEND_URL` | Allowed CORS origins | No | `http://localhost:5173,http://localhost:5174` |
| `CORS_ORIGINS` | Explicit allowed browser origins | Production | — |
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
| `UPLOAD_DIR` | Upload storage path | No | `./uploads` |
| `MAX_UPLOAD_BYTES` | Maximum ticket attachment size in bytes | No | `10485760` |
| `MAX_KB_UPLOAD_BYTES` | Maximum knowledge material size in bytes | No | `15728640` |
| `BOOTSTRAP_ADMIN_USERNAME` | Initial administrator username | New database only | — |
| `BOOTSTRAP_ADMIN_EMAIL` | Initial administrator email | New database only | — |
| `BOOTSTRAP_ADMIN_NAME` | Initial administrator display name | New database only | — |
| `BOOTSTRAP_ADMIN_PASSWORD` | Initial administrator password | New database only | — |
| `VITE_API_URL` | Frontend API base URL | Yes | — |
| `ALLOW_PUBLIC_API_KEY_IN_BODY` | Allow non-production API keys in request bodies | No | `false` |

## Configuration Best Practices

1. **Never commit `.env` files** — they are gitignored by default.
2. **Rotate secrets before production** — generate new `JWT_SECRET` and `PUBLIC_TICKET_API_KEY`.
3. **Use HTTPS in production** — update `FRONTEND_URL` and `VITE_API_URL` accordingly.
4. **Use LDAPS, not LDAP** — plain LDAP sends credentials in cleartext.
5. **Configure production CORS explicitly** — avoid wildcard origins.
