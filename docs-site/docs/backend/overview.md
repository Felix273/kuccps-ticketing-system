# Backend Overview

The backend is a Node.js + Express 5 REST API that powers the KUCCPS IT Ticketing System.

## Quick Facts

| Aspect | Detail |
|--------|--------|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL 14+ |
| Auth | JWT + bcrypt |
| Port | 5000 (default) |

## What the Backend Does

- Serves the REST API for all frontend operations
- Manages database access through Prisma ORM
- Handles authentication and authorization
- Sends email notifications via SMTP
- Monitors inbound email via IMAP
- Syncs users from Active Directory
- Runs scheduled background jobs

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/server.js` | Application entry point, middleware, route mounting |
| `src/routes/*.js` | API route definitions |
| `src/controllers/*.js` | Request handlers |
| `src/services/*.js` | Business logic and integrations |
| `src/middleware/*.js` | Auth, security, and validation |

## Base URL

```
http://localhost:5000/api
```

## Documentation Sections

- [Server Setup](./server-setup) — Initialization and middleware
- [Middleware](./middleware) — Auth, security, and file upload
- [Controllers](./controllers) — Request handlers
- [Routes](./routes) — API endpoint definitions
- [Services](./services) — Email, AD, and scheduler
- [Security](./security) — Authentication, authorization, and hardening
- [Scheduler](./scheduler) — Background jobs
