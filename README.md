# KUCCPS IT Ticketing System

KUCCPS IT Ticketing System is a full-stack support ticketing platform for the Kenya Universities and Colleges Central Placement Service. It allows users to submit IT support requests, lets ICT staff manage tickets, and provides dashboards, notifications, knowledge base articles, status issues, settings, and Google Workspace Add-on integration.

## Project status

- **Application type:** Full-stack web application
- **Primary users:** KUCCPS staff, ICT support agents, administrators
- **Runtime:** Node.js backend with PostgreSQL and React frontend
- **Default local URLs:**
  - Frontend: `http://localhost:5173` or `http://localhost:5174`
  - Backend: `http://localhost:5000`

## Architecture

```text
Browser / Google Workspace Add-on
        |
        v
React + Vite Frontend
        |
        v
Express API Server
        |
        +--> PostgreSQL through Prisma ORM
        +--> SMTP email service through Nodemailer
        +--> IMAP email monitoring when configured
        +--> Active Directory/LDAP sync when enabled
```

## Repository structure

```text
kuccps-ticketing/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── scripts/
│   │   └── preflight.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── .env
├── google-addon/
│   ├── Code.gs
│   └── appsscript.json
├── docs/
│   └── deployment-readiness.md
├── PROJECT_CHECKLIST.md
├── package.json
└── vite.config.js
```

## Tech stack

### Backend

Located in `backend/`.

- Node.js
- Express 5
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Nodemailer
- IMAP monitoring
- Multer file upload handling
- express-validator dependency available for validation
- node-cron scheduled jobs
- LDAP/Active Directory integration through `ldapauth-fork` and `ldapjs`

### Frontend

Located in `frontend/`.

- React 19
- React Router DOM
- Vite
- Tailwind CSS
- Lucide React icons
- Recharts analytics charts
- React Hot Toast notifications

### Google Workspace Add-on

Located in `google-addon/`.

- Google Apps Script
- Gmail contextual add-on
- Compose trigger for creating tickets directly from Gmail
- Uses backend public ticket API protected by `PUBLIC_TICKET_API_KEY`

## Main features

### Ticket management

- Ticket creation through public intake endpoints
- Unique ticket numbers using the configured prefix and date format
- Ticket status workflow: `Open`, `In Progress`, `Resolved`, `Closed`
- Priority levels: `Low`, `Medium`, `High`, `Critical`
- Category-based ticket grouping
- Department assignment
- Staff/admin assignment
- Ticket comments
- Ticket escalation
- File attachments
- Ticket history tracking
- SLA due dates and overdue detection
- Ticket statistics and dashboard analytics

### User and department management

- Admin-only user creation, update, and deletion
- Staff/admin access to user and department lists
- Role-based access control for `user`, `staff`, and `admin`
- Department creation, update, and deletion
- Active Directory user and directorate sync endpoints
- User department relationship included in API responses

### Authentication and authorization

- JWT bearer-token authentication
- Protected staff/admin routes
- Admin-only management routes
- Token-based profile endpoint
- Client-side token removal on authentication failures

### Email and notifications

- Ticket creation confirmation emails
- Ticket update and resolution emails
- Public reply forwarding through ticket reply handling
- SMTP configuration through system settings
- Optional IMAP monitoring
- In-app notification endpoint for overdue SLA alerts
- Notification preferences per user
- Test email endpoint

### Knowledge base and status pages

- Public knowledge base articles
- Staff/admin article management
- Article search and suggestions
- Article rating
- Knowledge base material upload
- Public and internal status issue endpoints
- Status issue updates

### Operations and analytics

- Dashboard analytics endpoint
- SLA policy management
- CSAT response capture
- Saved views for ticket filtering
- Custom forms for ticket intake workflows

## Backend entry point

The backend server starts in `backend/src/server.js`.

Key responsibilities:

- Loads environment variables with `dotenv/config`
- Creates the Express application
- Applies request ID middleware
- Applies security headers
- Applies CORS configuration
- Applies JSON body parsing
- Applies global and auth route rate limiting
- Mounts API routes
- Provides a `/health` endpoint
- Starts email monitoring when required email settings are configured

CORS is configured from `CORS_ORIGINS`, `FRONTEND_URL`, or local defaults. For local development, both Vite ports are allowed:

```env
FRONTEND_URL=http://localhost:5173,http://localhost:5174
```

## Frontend entry point

The frontend renders in `frontend/src/main.jsx` and routes between authenticated views in `frontend/src/App.jsx`.

Main application tabs:

- Dashboard
- Tickets
- Departments
- Users
- Knowledge Base
- Admin

The frontend applies public branding settings from the backend during startup, including organization name, brand colors, favicon, dark mode, and high-contrast mode.

## Backend route reference

### Authentication: `/api/auth`

Defined in `backend/src/routes/auth.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/login` | Public | Authenticate a user and return a JWT token |
| POST | `/logout` | Public | Logout endpoint for client-side token cleanup |
| GET | `/profile` | JWT | Return the current authenticated user |

### Tickets: `/api/tickets`

Defined in `backend/src/routes/tickets.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/public/tickets` | Public API key | Create a ticket for Google Add-on/public intake |
| POST | `/` | Staff/Admin | Disabled; returns 403 |
| GET | `/` | Staff/Admin | List all tickets |
| GET | `/statistics` | Staff/Admin | Return ticket statistics |
| GET | `/:id` | Staff/Admin | Get one ticket with comments, attachments, and history |
| PUT | `/:id` | Staff/Admin | Update ticket status, priority, assignee, department, category, SLA |
| POST | `/:id/escalate` | Staff/Admin | Escalate a ticket to another staff/admin user |
| POST | `/:id/comments` | Staff/Admin | Add a ticket comment |
| POST | `/:id/attachments` | Staff/Admin | Upload a ticket attachment |

The protected `POST /api/tickets` route is intentionally disabled so staff do not manually create tickets from the admin UI. Ticket creation is handled through public intake endpoints.

### Users: `/api/users`

Defined in `backend/src/routes/users.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Staff/Admin | List users |
| POST | `/sync/ad` | Admin | Sync users from Active Directory |
| POST | `/` | Admin | Create a user |
| PUT | `/:id` | Admin | Update a user |
| DELETE | `/:id` | Admin | Delete a user |

### Departments: `/api/departments`

Defined in `backend/src/routes/departments.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Staff/Admin | List departments |
| GET | `/:id` | Staff/Admin | Get one department |
| POST | `/sync/ad` | Admin | Sync directorates from Active Directory |
| POST | `/` | Admin | Create a department |
| PUT | `/:id` | Admin | Update a department |
| DELETE | `/:id` | Admin | Delete a department |

### Settings: `/api/settings`

Defined in `backend/src/routes/settings.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Admin | Get system settings |
| PUT | `/` | Admin | Update system settings |
| GET | `/public` | Public | Get public branding/settings |
| GET | `/email-templates` | Admin | List email templates |
| GET | `/email-templates/:type` | Admin | Get one email template |
| POST | `/email-templates` | Admin | Create an email template |
| PUT | `/email-templates/:type` | Admin | Update an email template |
| DELETE | `/email-templates/:type` | Admin | Delete an email template |
| POST | `/email-templates/reset` | Admin | Reset templates to defaults |

### Knowledge base: `/api/knowledge-base`

Defined in `backend/src/routes/knowledgeBase.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/public/articles` | Public | List public articles |
| GET | `/public/articles/:idOrSlug` | Public | Get one public article |
| GET | `/articles` | Staff/Admin | List articles |
| GET | `/insights` | Staff/Admin | Get knowledge base insights |
| GET | `/suggestions/tickets/:ticketId` | Staff/Admin | Get article suggestions for a ticket |
| GET | `/articles/:idOrSlug` | Staff/Admin | Get one article |
| POST | `/articles` | Staff/Admin | Create an article |
| PUT | `/articles/:id` | Staff/Admin | Update an article |
| DELETE | `/articles/:id` | Staff/Admin | Delete an article |
| POST | `/articles/:id/rate` | Public | Rate an article helpful/not helpful |
| POST | `/materials/upload` | Staff/Admin | Upload article material |

### Status issues: `/api/status-issues`

Defined in `backend/src/routes/statusIssues.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/public` | Public | List public status issues |
| GET | `/` | Staff/Admin | List status issues |
| POST | `/` | Staff/Admin | Create a status issue |
| PUT | `/:id` | Staff/Admin | Update a status issue |
| POST | `/:id/updates` | Staff/Admin | Add a status issue update |

### Operations: `/api/operations`

Defined in `backend/src/routes/operations.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/dashboard` | Staff/Admin | Get dashboard analytics |
| GET | `/sla-policies` | Staff/Admin | List SLA policies |
| POST | `/sla-policies` | Admin | Create an SLA policy |
| PUT | `/sla-policies/:id` | Admin | Update an SLA policy |
| POST | `/csat` | JWT | Submit a CSAT response |

### Notifications: `/api/notifications`

Defined in `backend/src/routes/notifications.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | JWT | Get overdue-ticket notifications |
| PUT | `/read/all` | JWT | Mark notifications as read |
| PUT | `/:id/read` | JWT | Mark one notification as read |
| DELETE | `/:id` | JWT | Dismiss one notification |
| GET | `/preferences` | JWT | Get notification preferences |
| PUT | `/preferences` | JWT | Save notification preferences |
| POST | `/test` | JWT | Send a test notification email |

### Custom forms: `/api/forms`

Defined in `backend/src/routes/forms.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/public` | Public | List active public forms |
| GET | `/` | Staff/Admin | List forms |
| POST | `/` | Admin | Create a form |
| PUT | `/:id` | Admin | Update a form |
| DELETE | `/:id` | Admin | Delete a form |

### Saved views: `/api/views`

Defined in `backend/src/routes/views.js`.

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Staff/Admin | List saved views |
| POST | `/` | Staff/Admin | Create a saved view |
| PUT | `/:id` | Staff/Admin | Update a saved view |
| DELETE | `/:id` | Staff/Admin | Delete a saved view |

## Prisma data model

The database schema is defined in `backend/prisma/schema.prisma`.

Main models:

| Model | Purpose |
| --- | --- |
| `User` | Application users, roles, LDAP sync metadata, department relationship |
| `Department` | Departments/directorates used for tickets, users, and SLA policies |
| `Ticket` | Support tickets with status, priority, category, requester, department, assignee, SLA fields |
| `Attachment` | Files attached to tickets |
| `Comment` | Staff/internal comments on tickets |
| `TicketHistory` | Audit trail of ticket field changes |
| `EmailConfig` | Email configuration records |
| `SystemSettings` | Branding, SMTP/IMAP, LDAP, ticket defaults, UI settings |
| `EmailTemplate` | Email templates for ticket lifecycle events |
| `SavedView` | Saved ticket views and filters |
| `KnowledgeArticle` | Knowledge base articles |
| `StatusIssue` | Public/internal status incidents |
| `StatusIssueUpdate` | Updates for status incidents |
| `CustomForm` | Custom intake forms |
| `CustomFormField` | Fields belonging to custom forms |
| `SlaPolicy` | SLA response/resolution policies |
| `CsatResponse` | Customer satisfaction responses |
| `NotificationPreference` | Per-user notification preferences |

## Frontend structure

### Components

Located in `frontend/src/components/`.

| Area | Main components |
| --- | --- |
| Auth | `HomePage`, `LoginPage` |
| Layout | `Header`, `Navigation`, `StatCard`, `NotificationBell` |
| Dashboard | `DashboardView`, charts, quick stats cards |
| Tickets | `TicketsView`, `TicketCard`, `TicketDetailModal`, filters, assignment modal |
| Departments | `DepartmentsView`, department modals |
| Users | `UsersView`, `UserModal` |
| Knowledge base | `KnowledgeBaseView` |
| Admin | `AdminPanel`, organization settings, email settings, notification preferences, email templates, active directory settings, ticket settings, custom forms settings |

### Services

Located in `frontend/src/services/`.

| Service | Purpose |
| --- | --- |
| `api.js` | Central fetch client, JWT header handling, JSON parsing, auth redirect |
| `authService.js` | Login, logout, profile, current-user helpers |
| `ticketService.js` | Ticket list, detail, update, assignment, escalation, comments, attachments |
| `userService.js` | User CRUD |
| `departmentService.js` | Department CRUD |
| `settingsService.js` | System settings and email templates |
| `knowledgeBaseService.js` | Knowledge base articles and ratings |
| `operationsService.js` | Dashboard analytics, SLA policies, CSAT |
| `statusIssueService.js` | Status issues |
| `formService.js` | Custom forms |
| `viewService.js` | Saved views |
| `notificationService.js` | Notifications and preferences |

### Hooks

Located in `frontend/src/hooks/`.

| Hook | Purpose |
| --- | --- |
| `useAuth.js` | Authentication state helpers |
| `useTickets.js` | Ticket fetching |
| `useUsers.js` | User fetching |
| `useDepartments.js` | Department fetching |
| `useStatistics.js` | Dashboard statistics fetching |

## Environment variables

`.env` files are ignored by Git. Never commit real credentials.

### Backend environment variables

Example `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database_name?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173,http://localhost:5174

# Public ticket API key for Google Add-on
PUBLIC_TICKET_API_KEY=change-this-to-a-long-random-secret
REQUIRE_PUBLIC_TICKET_API_KEY=true

# SMTP / outbound email
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM="KUCCPS IT Support <itsupport@example.ac.ke>"
SUPPORT_EMAIL=itsupport@example.ac.ke

# IMAP / inbound email monitoring
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=
IMAP_PASSWORD=
IMAP_TLS=true

# LDAP / Active Directory
USE_LDAP_AUTH=false
LDAP_URL=ldaps://ldap.example.ac.ke:636
LDAP_BIND_DN=
LDAP_BIND_PASSWORD=
LDAP_SEARCH_BASE=
LDAP_SEARCH_FILTER=(uid={{username}})

# Uploads
MAX_FILE_SIZE=10485760
MAX_UPLOAD_BYTES=10485760
MAX_KB_UPLOAD_BYTES=5242880
UPLOAD_DIR=./uploads

# Optional production hardening
ALLOW_PUBLIC_API_KEY_IN_BODY=false
SMTP_TLS_REJECT_UNAUTHORIZED=true
IMAP_TLS_REJECT_UNAUTHORIZED=true
LDAP_TLS_REJECT_UNAUTHORIZED=true
```

Production notes:

- `JWT_SECRET` should be at least 32 characters.
- `PUBLIC_TICKET_API_KEY` should be at least 32 characters.
- `NODE_ENV=production` enables stricter validation in `backend/src/middleware/security.js`.
- Production frontend URLs should use HTTPS.
- Do not use wildcard CORS origins in production.
- Use LDAPS, not LDAP, in production.

### Frontend environment variables

Example `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Production example:

```env
VITE_API_URL=https://api.example.ac.ke/api
```

## Local development setup

### Prerequisites

- Node.js 22 or newer is recommended.
- PostgreSQL.
- npm.
- A populated `backend/.env`.
- A populated `frontend/.env`.

### Install dependencies

```bash
npm install
cd backend
npm install
cd ../frontend
npm install
```

### Prepare the database

From the backend directory:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run preflight
npx prisma db seed
```

The seed script creates:

- ICT department
- Admin user: `admin / admin123`
- Staff user: `itstaff / staff123`
- Default system settings
- Default email templates

Change default passwords before using the system beyond local testing.

### Run the backend

From the backend directory:

```bash
npm start
```

The API starts on `http://localhost:5000`.

### Run the frontend

From the frontend directory:

```bash
npm run dev
```

The frontend starts on `http://localhost:5173` or `http://localhost:5174`.

### Build the frontend

```bash
cd frontend
npm run build
npm run preview
```

### Lint the frontend

```bash
cd frontend
npm run lint
```

## API conventions

Most API responses use this shape:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Some endpoints return resource-specific keys such as `user`, `users`, `ticket`, `tickets`, `statistics`, `settings`, or `preferences`.

Protected API requests require:

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

Public ticket intake endpoints require:

```http
X-API-Key: <PUBLIC_TICKET_API_KEY>
```

or a bearer token containing the public API key, depending on server configuration.

## Security model

- Passwords are hashed with bcrypt.
- JWTs are issued by the login endpoint and verified by protected routes.
- Staff/admin routes are protected by `requireStaffOrAdmin`.
- Admin routes are protected by `requireAdmin`.
- CORS is restricted to configured frontend origins.
- Security headers include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Resource-Policy`, and `Cache-Control`.
- Rate limiting is applied globally and to sensitive routes such as authentication and public ticket intake.
- Public ticket intake requires a configured API key in production.
- Production validation rejects unsafe LDAP, CORS, and public API key settings.

## Deployment checklist

1. Create a production PostgreSQL database.
2. Copy backend `.env` to the production server and replace all local values.
3. Set `NODE_ENV=production`.
4. Set `FRONTEND_URL` or `CORS_ORIGINS` to the production HTTPS frontend URL.
5. Rotate `JWT_SECRET` and `PUBLIC_TICKET_API_KEY`.
6. Set `REQUIRE_PUBLIC_TICKET_API_KEY=true`.
7. Configure SMTP credentials.
8. Configure IMAP only if inbound email monitoring is required.
9. Use LDAPS for production Active Directory connections.
10. Run:

```bash
cd backend
npm run preflight
npx prisma generate
npx prisma migrate deploy
npm start
```

11. Build the frontend:

```bash
cd frontend
npm install
npm run build
```

12. Deploy the frontend build to Vercel, Netlify, a VPS, or another static host.
13. Configure a reverse proxy such as Nginx for HTTPS.
14. Update Google Workspace Add-on `API_URL` to the production backend URL.
15. Schedule PostgreSQL backups.
16. Back up uploaded attachments and knowledge base material storage.

See `docs/deployment-readiness.md` for additional production readiness notes.

## Troubleshooting

### CORS preflight fails

If the browser reports:

```text
No 'Access-Control-Allow-Origin' header is present
```

check that the backend environment includes the current frontend origin:

```env
FRONTEND_URL=http://localhost:5173,http://localhost:5174
```

Restart the backend after changing `.env`.

### Port 5000 is already in use

Stop the existing Node process or change `PORT` in `backend/.env`.

### Prisma client is missing

Run:

```bash
cd backend
npx prisma generate
```

### Database schema is out of sync

Run:

```bash
cd backend
npx prisma migrate dev
```

For production:

```bash
cd backend
npx prisma migrate deploy
```

### Email sending fails

Check:

- SMTP host, port, username, and password
- `SUPPORT_EMAIL`
- `EMAIL_FROM`
- TLS settings
- Mail provider app password requirements
- Server firewall/proxy access to SMTP/IMAP hosts

### Google Add-on cannot create tickets

Check:

- `PUBLIC_TICKET_API_KEY` matches the key configured in Apps Script.
- `VITE_API_URL` or Apps Script `API_URL` points to the correct backend.
- The backend endpoint is reachable from the public internet.
- `REQUIRE_PUBLIC_TICKET_API_KEY=true` is set in production.

## Maintenance tasks

### Daily

- Review open and overdue tickets.
- Check failed email sends.
- Review critical tickets and SLA breaches.

### Weekly

- Back up the database.
- Review knowledge base article usefulness.
- Review user and department changes.
- Review status issue history.

### Monthly

- Rotate secrets where appropriate.
- Update dependencies after testing.
- Review audit logs.
- Test restore procedures.
- Review SLA policy performance.

## Current operational notes

- Manual staff ticket creation through `POST /api/tickets` is intentionally disabled.
- Tickets are intended to be created through public intake endpoints such as the Google Workspace Add-on.
- Email monitoring is disabled unless `EMAIL_USER` and `IMAP_USER` are configured.
- Default seeded credentials are for local development only and should be changed before production use.
- Production should use HTTPS, explicit CORS origins, LDAPS, strong secrets, and scheduled database backups.
