# KUCCPS IT Ticketing System — Extensive Project Presentation

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Stakeholder Analysis](#2-problem-statement--stakeholder-analysis)
3. [Solution Architecture](#3-solution-architecture)
4. [Feature Deep Dive](#4-feature-deep-dive)
5. [User Interface & Experience](#5-user-interface--experience)
6. [Backend Engineering](#6-backend-engineering)
7. [Database Design](#7-database-design)
8. [Google Workspace Integration](#8-google-workspace-integration)
9. [Security & Compliance](#9-security--compliance)
10. [Deployment & Operations](#10-deployment--operations)
11. [Project Metrics & Impact](#11-project-metrics--impact)
12. [Future Roadmap](#12-future-roadmap)
13. [Screenshots](#13-screenshots)

---

## 1. Executive Summary

### 1.1 Project Identity

| Attribute | Detail |
|-----------|--------|
| **Project Name** | KUCCPS IT Ticketing System |
| **Developer** | Felix Ngitari |
| **Date Completed** | February 13, 2026 |
| **Status** | Production Ready |
| **Repository** | https://github.com/Felix273/kuccps-ticketing-system |
| **Client Organization** | Kenya Universities and Colleges Central Placement Service (KUCCPS) |
| **Primary Users** | ICT Support Agents, System Administrators, KUCCPS Staff |

### 1.2 Value Proposition

The KUCCPS IT Ticketing System transforms IT support operations from fragmented, manual processes into a structured, measurable, and scalable digital platform. It replaces email chains, phone calls, and spreadsheets with a unified system that captures every support request, assigns ownership, tracks resolution timelines, and generates actionable analytics for continuous improvement.

### 1.3 Key Outcomes

- **100% ticket traceability** — every request gets a unique ticket number with full audit history
- **Automated SLA enforcement** — system tracks response and resolution deadlines with overdue alerts
- **Intelligent ticket routing** — department-based assignment with escalation workflows
- **Self-service deflection** — public knowledge base reduces repetitive support queries
- **Executive visibility** — real-time dashboard with 16 charts covering volume, performance, and trends
- **Zero-friction intake** — Google Workspace add-on enables ticket creation directly from Gmail

---

## 2. Problem Statement & Stakeholder Analysis

### 2.1 Pre-Implementation Challenges

Before deploying this system, KUCCPS ICT support operated with significant operational inefficiencies:

**For End Users (Staff/Requester)**
- No centralized channel for submitting IT requests
- Inconsistent response times with no visibility into request status
- Repeated explanations of the same issues to different support agents
- No self-service option to find solutions before contacting support
- No formal confirmation or tracking of submitted requests

**For ICT Support Staff**
- Requests arrived via email, phone, WhatsApp, and in-person visits
- No unified queue — requests were tracked in personal notes or spreadsheets
- Difficult to prioritize critical issues amid unstructured intake
- No automated reminders for SLA deadlines
- Manual effort required to follow up on resolved tickets
- Duplicate work when multiple users reported the same incident

**For System Administrators**
- No real-time visibility into team workload or ticket backlog
- Unable to measure SLA compliance or team performance
- No historical data for trend analysis or capacity planning
- Manual reporting required for management meetings
- No standardized process for onboarding new support agents

**For Management**
- No dashboard to monitor IT support health
- Unable to identify recurring issues or knowledge gaps
- No customer satisfaction measurement
- No audit trail for compliance or accountability

### 2.2 Stakeholder Matrix

| Stakeholder | Pain Point | System Benefit |
|-------------|-----------|----------------|
| Requester | No ticket tracking | Unique ticket number, email updates, status visibility |
| ICT Staff | Unstructured queue | Prioritized ticket list, SLA timers, escalation tools |
| Department Heads | No departmental visibility | Department-specific analytics, workload distribution |
| IT Manager | No performance metrics | 16-chart dashboard, CSAT scores, SLA compliance reports |
| System Admin | Manual user management | AD sync, bulk operations, system-wide settings |

---

## 3. Solution Architecture

### 3.1 High-Level Architecture

```
External Channels:
  Gmail Add-on → Web Form (Future) → Direct Email (IMAP)
          ↓              ↓                  ↓
Public Intake Layer:
  POST /api/public/tickets (X-API-Key protected)
          ↓
Frontend Application Layer:
  React 19 + Vite + Tailwind CSS
  JWT Auth, Tabbed Navigation, 16 Charts, Dark Mode, Responsive
          ↓
Backend API Layer (Express 5):
  /api/auth, /api/tickets, /api/departments, /api/users,
  /api/settings, /api/knowledge-base, /api/status-issues,
  /api/operations, /api/forms, /api/views, /api/notifications
  Middleware: JWT Auth, RBAC, Rate Limiting, Security Headers,
             Request ID Tracing, Production Config Validation
          ↓
Data & Integration Layer:
  PostgreSQL (Prisma ORM) — 16 Models
  SMTP/Email (Nodemailer) — Ticket emails, notifications, IMAP monitor
  LDAP/Active Directory (ldapjs) — AD Auth, user sync, directorate sync
```

### 3.2 Technology Stack

**Frontend:** React 19.2.0, Vite 8.0.16, React Router DOM 7.16.0, Tailwind CSS 3.4.1, Lucide React 0.554.0, Recharts 3.4.1, React Hot Toast 2.6.0, JavaScript ES Modules.

**Backend:** Node.js 22+, Express 5.1.0, Prisma 5.22.0, PostgreSQL, JWT 9.0.2, bcrypt 6.0.0, Nodemailer 9.0.0, Mailparser 3.9.0, node-imap 0.8.17, ldapjs 3.0.7, ldapauth-fork 6.1.0, node-cron 4.2.1, express-validator 7.3.1.

**Google Workspace:** Google Apps Script V8, Google Workspace Add-ons, onGmailOpen/onComposeOpen triggers, CardService UI.

---

## 4. Feature Deep Dive

### 4.1 Ticket Management System

#### 4.1.1 Ticket Creation Channels

1. **Google Workspace Add-on** — `POST /api/public/tickets` with `X-API-Key`
2. **Web Application** — Future intake forms (framework exists via `CustomForm`)
3. **Email Monitoring** — Automatic ticket creation from inbound emails via IMAP

**Ticket Number Format:** `{PREFIX}-{YYYYMMDD}-{XXXX}`
- Prefix configurable in System Settings (default: `TICK`)
- Date in `YYYYMMDD` format
- Zero-padded 4-digit daily sequence

**Example:** `TICK-20260817-0042`

#### 4.1.2 Ticket Status Workflow

```
Open → In Progress → Resolved → Closed
  ↓        ↓           ↓
escalate escalate    reopen possible
```

| Status | Description | System Actions |
|--------|-------------|----------------|
| Open | Newly created | Default on creation |
| In Progress | Agent claimed | Auto-sets response time |
| Resolved | Issue fixed | Auto-sets resolution time, sends email |
| Closed | Finalized | Prevents escalation, can be reopened |

#### 4.1.3 Priority Matrix & SLA

| Priority | SLA Resolution | Badge Color |
|----------|---------------|-------------|
| Critical | 4 hours | Red |
| High | 8 hours | Orange |
| Medium | 24 hours | Blue |
| Low | 72 hours | Gray |

SLA deadlines use default priority-based values or custom `SlaPolicy` overrides. Breach flag set when `now > slaDueAt` and ticket is active.

#### 4.1.4 Assignment & Escalation

- Only `staff` and `admin` can be assigned tickets
- Auto-moves status from `Open` → `In Progress` on assignment
- Records response time at first assignment
- **Horizontal escalation** — reassign to peer
- **Vertical escalation** — escalate to senior officer
- Creates `TicketHistory` entry + internal comment + email notification

#### 4.1.5 Comments & Attachments

**Comments:** Internal (staff-only) and external (forwarded to requester via email). Author tracking resolves from user email for external replies.

**Attachments:** Supported types — JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, ZIP. Max size configurable (default 10MB). Filename sanitization. Stored in `backend/uploads/`.

#### 4.1.6 Audit Trail

Every field change creates a `TicketHistory` record: `field`, `oldValue`, `newValue`, `changedBy`, `createdAt`.

### 4.2 User & Department Management

#### 4.2.1 User Roles

| Role | Access |
|------|--------|
| `user` | View assigned tickets, update profile |
| `staff` | Manage tickets, departments, knowledge base |
| `admin` | Full access + user CRUD, system settings, AD sync, email templates |

#### 4.2.2 User Creation

**Password Policy:** Min 12 chars, uppercase, lowercase, numeric. Hashed with bcrypt (10 rounds).

**Fields:** `username` (unique), `email` (unique), `name`, `role`, `departmentId` (optional), `password`.

#### 4.2.3 Department Management

- CRUD with case-insensitive unique names
- Department code support
- Ticket/user count tracking
- AD directorate sync
- Prevent deletion when tickets/users exist
- User Tickets Drawer — slide-in panel showing user's tickets

### 4.3 Authentication & Security

#### 4.3.1 Dual Authentication Mode

1. **Local** — bcrypt password validation in PostgreSQL
2. **Active Directory** — LDAP/AD bind validation

Auto-selected based on `ldapEnabled` setting.

#### 4.3.2 JWT Management

- Secret: `JWT_SECRET` (min 32 chars in production)
- Expiry: 8 hours default
- Payload: `{ id, email, username, role }`
- Storage: `localStorage`
- Client clears token on 401/403

#### 4.3.3 Request Tracing

Every request gets `X-Request-Id`:
- Client-provided via header accepted
- Server generates `crypto.randomUUID()` if missing
- Echoed in response and error logs

### 4.4 Email & Notifications

#### 4.4.1 Email Architecture

**SMTP:** Database-stored settings (configurable via Admin Panel) + env fallback. Supports Gmail, Outlook, custom SMTP. TLS/STARTTLS with configurable validation.

**3 Default Templates:**

| Template | Trigger | Subject |
|----------|---------|---------|
| `ticketCreated` | New ticket | `[Ticket #{ticketNumber}] Your support request has been received` |
| `ticketUpdated` | Status/assignment/comment | `[Ticket #{ticketNumber}] Update on your support request` |
| `ticketResolved` | Resolved | `[Ticket #{ticketNumber}] Your support request has been resolved` |

**Template Engine:** Supports `[PLACEHOLDER]` and `{{camelCase}}` tokens, `{{#if comment}}` conditionals, dynamic brand colors.

#### 4.4.2 Inbound Email Monitoring

- Connects on startup if `EMAIL_USER` and `IMAP_USER` configured
- Real-time `imap.on('mail')` + cron fallback polling (default 5 min)
- `mailparser` extracts text, HTML, attachments, references
- Matches ticket number → adds comment; no match → creates ticket
- Tracks `emailMessageId` for threading

#### 4.4.3 In-App Notifications

**Types:** Overdue SLA alerts, assignment, status change, new comment.

**Preferences per user:** `emailOnAssignment`, `emailOnStatusChange`, `emailOnNewComment`, `dailyDigest`, `escalationAlerts`.

**Bell Icon:** Unread badge (pulsing), dropdown list, mark read/dismiss, auto-refresh 30s, settings link.

### 4.5 Knowledge Base

#### 4.5.1 Article Management

**Structure:** `title`, `slug` (auto-generated), `excerpt`, `content`, `category`, `tags`, `status` (draft/published), `views`, `helpful`/`notHelpful`.

**Public vs Staff:** Public articles accessible without auth. Staff articles require auth. Search available to all authenticated users.

#### 4.5.2 AI-Powered Intelligence

**Ticket Suggestions** (`/api/knowledge-base/suggestions/tickets/:ticketId`):
- Scores and ranks relevant articles
- Identifies missing info (location, error details, assets)
- Infers priority from content signals
- Finds similar active tickets (duplicate detection)
- Historical resolution time by category

**Knowledge Insights** (`/api/knowledge-base/insights`):
- Recurring issues (top 8 categories)
- Resolution time by category
- Common terms from descriptions
- Knowledge gaps (high ticket count, low article coverage)
- Article effectiveness scoring

**Operational Insights** (`/api/operations/dashboard`):
- SLA risk (overdue, due soon, unclaimed high-priority)
- Recurring issue detection
- Department trends
- Bottleneck identification
- Agent workload balance
- Duplicate detection
- Escalation recommendations
- Executive summary

### 4.6 Status Pages

- Create system-wide incidents: Investigating → Identified → Monitoring → Resolved → Completed
- Severity: Informational, Minor, Major, Critical
- Public/internal updates
- Systems affected field
- Public status page (no auth required)

### 4.7 Operations & Analytics

#### Dashboard Analytics

**Quick Stats (5 cards):** Today's tickets, Resolved, Critical Open, Avg Response Time, SLA Compliance.

**Operations Cards:** SLA Compliance %, CSAT Score, Closed Tickets.

**16 Charts:**
1. Ticket Trends (7-day area)
2. Top Categories (bar + pie)
3. Status Distribution (pie)
4. Priority Distribution (pie)
5. Response Time (line vs 24hr target)
6. Volume by Hour (bar)
7. Resolution Rate (area)
8. Assignment (pie: claimed vs unclaimed)
9. User Workload (stacked bar)
10. Department Performance (bar)
11. Active vs Resolved (pie)
12. Department Tickets (stacked bar)
13. Email Domain (bar)
14. Top Performers (horizontal bar)
15. Categories (horizontal bar)
16. AI Insights (executive summary, bottlenecks, recommendations)

#### SLA Policies

| Field | Default |
|-------|---------|
| `name` | Required |
| `priority` | Optional (matches all) |
| `category` | Optional (matches all) |
| `departmentId` | Optional (matches all) |
| `responseMinutes` | 240 (4h) |
| `resolutionMinutes` | 1440 (24h) |
| `isActive` | true |

Most specific match wins.

#### CSAT

1-5 star rating + optional comment, linked to ticket, aggregated average on dashboard.

### 4.8 Custom Forms & Saved Views

**Custom Forms:** Configurable form builder with field types (text, select, checkbox), required/optional, conditional logic, sort order, active toggle, category association.

**Saved Views:** Save filter configurations as named views. Visibility: private/public/role-based. Stores filters, columns, sort order. Load/edit/delete with permissions.

---

## 5. User Interface & Experience

### 5.1 Complete Screen Inventory

#### Authentication Screens

**Landing Page (`HomePage.jsx`)**
- Public welcome page with KUCCPS branding
- Gradient background with animated blobs
- Organization name display
- "Staff Login" CTA
- Email support instructions

**Login Page (`LoginPage.jsx`)**
- Username + password form
- Show/hide password toggle
- Remember me checkbox
- Demo credentials: `admin / admin123`, `itstaff / staff123`
- LDAP/AD notice
- Animated blob background

#### Dashboard (`DashboardView.jsx` — 418 lines)

**Layout:** Header + 5 quick stat cards + 3 operations cards + responsive charts grid.

**Stat Cards (`QuickStatsCards.jsx`):** Today's Tickets, Resolved, Critical Open, Avg Response Time, SLA Compliance.

**Charts:** 16 total (see Section 4.7).

#### Tickets View (`TicketsView.jsx` — 458 lines)

**Features:**
- Quick filters: My Tickets, Unclaimed, Critical, Open, In Progress, Resolved
- Saved filters (load/save/delete)
- Advanced search modal
- Text search + multi-select filters
- Date range filter
- Export to CSV/Excel
- Card-based display

**Ticket Card (`TicketCard.jsx`):** Ticket number + priority badge, status badge, subject/description preview, requester email/date, assignee + claim button.

**Ticket Detail Modal (`TicketDetailModal.jsx` — 858 lines):**
- **Tab 1 Details:** Info grid, action buttons (Claim/Transfer/Escalate/Update/Close), attachment upload
- **Tab 2 Email Thread:** Correspondence display, reply form
- **Tab 3 Activity:** Full history, comments, status/assignment changes

**Supporting Components:**
- `TicketFilters.jsx` — search + dropdowns
- `QuickFilters.jsx` — horizontal scroll buttons
- `SavedFilters.jsx` — save/load/delete with visibility
- `AdvancedSearchModal.jsx` — multi-select + date range
- `TicketAssignModal.jsx` — user selection + transfer

#### Departments View (`DepartmentsView.jsx` — 244 lines)

- `DepartmentCard.jsx` — name, code, staff/ticket counts, resolution rate, actions
- `DepartmentDetailModal.jsx` — info, staff list, stats, resolution chart
- `UserTicketsDrawer.jsx` — slide-in panel with user's tickets
- Actions: Add/Edit/Delete (admin), AD sync (admin), View details (all)

#### Users View (`UsersView.jsx` — 207 lines)

- `UserCard.jsx` — avatar, name, email, role badge, department, ticket count
- `UserModal.jsx` — username, name, email, role, department, password
- Search by name/email/username + role filter

#### Knowledge Base (`KnowledgeBaseView.jsx` — 509 lines)

- Article list with search + category filter
- Preview pane with ratings
- Create article form (admin/staff)
- AI Operational Insights section
- Knowledge Insights section
- Upload material (admin/staff)

#### Admin Panel (`AdminPanel.jsx` — 83 lines)

6 tabbed sub-views:
1. **Organization Settings** — name, code, logo, favicon, colors, emails, dark/contrast mode
2. **Email Settings** — SMTP/IMAP config, test email
3. **Ticket Settings** — prefix, defaults, file limits, maintenance mode, add-on URL
4. **Active Directory Settings** — LDAP config, sync buttons, test connection
5. **Email Templates** — CRUD + reset defaults
6. **Custom Forms** — form builder with fields, conditions, sort order

#### Status Page (`StatusPageView.jsx` — 195 lines)

- Public incident display
- Severity indicators
- Update timeline
- Create/update issues (admin/staff)

#### Notification Preferences (`NotificationPreferences.jsx` — 239 lines)

- 5 toggle preferences
- Test email button

### 5.2 Layout Components

**Header (`Header.jsx` — 161 lines)**
- Desktop: Logo, title, notification bell, KB shortcut, settings (admin), user avatar/dropdown, logout
- Mobile: Collapsible menu, hamburger, slide-down user menu

**Notification Bell (`NotificationBell.jsx` — 262 lines)**
- Lucide bell icon
- Unread count badge (pulsing)
- Dropdown with list
- Mark read/dismiss actions
- Auto-refresh 30s

**Navigation (`Navigation.jsx` — 47 lines)**
- Desktop: horizontal tabs, gradient active state
- Mobile: horizontal scroll, icons only on small screens

### 5.3 Design System

**Colors:**
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#911414` | Headers, buttons, active states |
| Secondary | `#d20001` | Gradients, accents |
| Success | `#10b981` | Resolved, closed |
| Warning | `#f59e0b` | Medium priority |
| Critical | `#ef4444` | Critical, errors, overdue |
| Info | `#3b82f6` | Information, links |
| Dark BG | `#111827` | Dark mode background |
| Dark Text | `#f9fafb` | Dark mode text |

**Breakpoints:** Mobile <640px, Tablet 640-1023px, Desktop 1024px+.

**Special Modes:**
- **Dark Mode** — `theme-dark` class, `#111827` bg
- **High Contrast** — `theme-high-contrast` class, `contrast(1.08)`

**Common Components:** `LoadingSpinner` (sm/md/lg), `ErrorMessage`, `SuccessMessage`, `Logo` (image + text fallback), `StatCard`.

---

## 6. Backend Engineering

### 6.1 Server Architecture (`server.js` — 112 lines)

Startup: load env → create app → request ID → security headers → CORS → JSON parsing → rate limiting → mount routes → error handler → start server → optional IMAP monitoring.

**CORS:** Origin whitelist from `CORS_ORIGINS` or `FRONTEND_URL` (defaults: `http://localhost:5173,http://localhost:5174`).

**Rate Limits:** Global 600/15min, Auth 30/15min, Public tickets 30/15min.

### 6.2 Controllers Summary

**Auth (`authController.js` — 154 lines):** `login` (local/AD), `logout`, `getProfile`.

**Tickets (`ticketController.js` — 526 lines):** `createTicket` (public), `getAllTickets`, `getTicketById`, `updateTicket` (status/priority/assignee/department/category/SLA), `escalateTicket`, `addComment`, `addAttachment`, `getStatistics`.

**Departments (`departmentController.js` — 251 lines):** CRUD + `syncDirectoratesFromAd`.

**Users (`userController.js` — 311 lines):** CRUD + `syncUsersFromAd`.

**Settings (`settingsController.js` — 504 lines):** Full system settings CRUD, public settings, email template CRUD, reset defaults.

**Knowledge Base (`knowledgeBaseController.js` — 469 lines):** Articles CRUD, upload material, insights, ticket suggestions, ratings.

**Operations (`operationsController.js` — 376 lines):** Dashboard analytics with AI insights, SLA policies CRUD, CSAT submission.

**Status Issues (`statusIssueController.js` — 124 lines):** CRUD + add updates.

**Forms (`formController.js` — 103 lines):** CRUD with field transaction.

**Views (`viewController.js` — 102 lines):** CRUD with visibility/ownership checks.

**Notifications (`notifications/` — 201 lines):** Overdue alerts, preferences CRUD, test email.

### 6.3 Middleware

**Auth (`auth.js` — 79 lines):** `authenticateToken` (JWT verify + expiry handling), `authorizeRoles`, `requireAdmin`, `requireStaffOrAdmin`.

**Security (`security.js` — 150 lines):**
- `requestId` — UUID tracing
- `securityHeaders` — HSTS, no-sniff, frame-options, etc.
- `rateLimit` — in-memory per-IP buckets
- `requirePublicApiKey` — timing-safe key validation
- `validateProductionConfig` — startup checks (min 32-char secrets, LDAPS, no localhost CORS)
- `auditLog` — structured JSON with sensitive field redaction

### 6.4 Services

**Email (`emailService.js` — 456 lines):**
- `sendEmail` — SMTP with dynamic config, template rendering, placeholder replacement
- `sendTicketReply` — reply threading
- `processIncomingEmail` — IMAP parsing, ticket/comment creation
- `startEmailMonitoring` — IMAP connection + cron fallback polling
- Settings/templates caching (5-min TTL)

**AD (`adService.js` — 388 lines):**
- `authenticate` — LDAP bind verification
- `upsertAdUser` — create/update local user from AD
- `syncDirectorates` — bulk import OUs/groups as departments
- `syncUsers` — bulk import AD users with ICT filtering
- `getAdSettings` — config from DB/env with fallbacks
- `isIctUser` — group DN or department name heuristics

---

## 7. Database Design

### 7.1 Entity Relationship Summary

**User** → **Department** (many-to-one)
**User** → **Ticket** (assignedTo, createdBy — one-to-many)
**Department** → **Ticket** (one-to-many)
**Department** → **SlaPolicy** (one-to-many)
**Ticket** → **Attachment** (one-to-many, cascade delete)
**Ticket** → **Comment** (one-to-many, cascade delete)
**Ticket** → **TicketHistory** (one-to-many, cascade delete)
**Ticket** → **CsatResponse** (one-to-many, cascade delete)
**StatusIssue** → **StatusIssueUpdate** (one-to-many, cascade delete)
**CustomForm** → **CustomFormField** (one-to-many, cascade delete)
**User** → **SavedView** (one-to-many, set null on delete)
**User** → **NotificationPreference** (one-to-one, cascade delete)

### 7.2 Key Indexes

- `User`: `email`, `username`
- `Ticket`: `ticketNumber`, `status`, `priority`, `requesterEmail`, `createdAt`
- `Attachment`, `Comment`, `TicketHistory`: `ticketId`
- `KnowledgeArticle`: `category`, `status`, `slug`
- `StatusIssue`, `StatusIssueUpdate`: `status`, `severity`, `isPublic`
- `SlaPolicy`: `priority`, `category`, `departmentId`, `isActive`
- `SavedView`: `entity`, `visibility`, `ownerId`

### 7.3 Seed Data

- Department: `ICT`
- Users: `admin / admin123` (admin), `itstaff / staff123` (staff)
- Default system settings
- Default email templates: `ticketCreated`, `ticketUpdated`, `ticketResolved`

---

## 8. Google Workspace Integration

### 8.1 Add-on Architecture

Built with Google Apps Script V8. Integrates with Gmail via contextual and compose triggers. UI uses native CardService.

### 8.2 Triggers

- `onHomepage` — universal action entry
- `onGmailOpen` — contextual trigger (fires when Gmail opens)
- `onComposeOpen` — compose action ("Create IT Ticket")

### 8.3 Configuration

`getConfig` reads from `PropertiesService` with fallback to `DEFAULT_CONFIG`:
- `API_URL` — backend endpoint
- `SUPPORT_EMAIL` — support address
- `BACKEND_API_KEY` — public API key

`setupProductionProperties` initializes defaults if missing (non-destructive).

### 8.4 UI & Submission

`createTicketCard` builds CardService card with:
- KUCCPS logo header
- User email display
- Category dropdown (default: General Issues)
- Priority dropdown (default: Medium)
- Subject + description inputs
- Submit button → `submitTicket`
- Footer with support email

`submitTicket` validates inputs, builds `ticketData`, calls `submitToBackend`.

`submitToBackend` adds `X-API-Key` / `Bearer` headers, POSTs JSON, handles 2xx/error responses.

### 8.5 Response Handling

- Success → `createSuccessCard` with ticket number + "Submit Another Ticket" button
- Error → `createErrorCard` with red message + "Try Again" button

### 8.6 Manifest (`appsscript.json`)

- Timezone: `Africa/Nairobi`
- Gmail Advanced Service v1 enabled
- Runtime: V8
- **Common:** name `KUCCPS IT Support`, primary `#911414`, secondary `#d20001`, homepage `onHomepage`, universal action `Submit IT Ticket`
- **Gmail:** unconditional contextual trigger `onGmailOpen`, compose trigger `onComposeOpen` (draftAccess: NONE)

---

## 9. Security & Compliance

### 9.1 Authentication & Authorization

- bcrypt password hashing (10 rounds)
- JWT bearer tokens (8h expiry)
- Role-based access: `requireStaffOrAdmin`, `requireAdmin`
- Public ticket intake protected by API key in production

### 9.2 Network Security

- CORS origin whitelist (no wildcards in production)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `CORP`, `Cache-Control: no-store`
- HSTS in production (`max-age=31536000`)

### 9.3 Rate Limiting

- Global: 600 requests / 15 min / IP
- Auth: 30 requests / 15 min / IP
- Public tickets: 30 requests / 15 min / IP

### 9.4 Input Validation

- Text sanitization (`cleanText`: trim, slice, null-byte removal)
- Email validation regex
- Enum validation for status/priority/role
- File type whitelisting
- Filename sanitization

### 9.5 Production Hardening

`validateProductionConfig` enforces on startup in production:
- `JWT_SECRET` ≥ 32 chars
- `PUBLIC_TICKET_API_KEY` ≥ 32 chars
- `REQUIRE_PUBLIC_API_KEY=true`
- Explicit CORS origin (no localhost, no `*`)
- LDAPS required (no `ldap://`)
- TLS rejection enabled for SMTP, IMAP, LDAP

### 9.6 Audit Logging

Structured JSON logs with:
- Timestamp, event name
- Sensitive field redaction (passwords, tokens, auth headers)
- Partial email redaction

---

## 10. Deployment & Operations

### 10.1 Prerequisites

- Node.js 22+
- PostgreSQL
- npm

### 10.2 Setup Steps

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Database
cd backend
npx prisma generate
npx prisma migrate dev
npm run preflight
npx prisma db seed

# Run
cd backend && npm start       # http://localhost:5000
cd frontend && npm run dev     # http://localhost:5173
```

### 10.3 Environment Variables

**Backend (`backend/.env`):**
```
DATABASE_URL="postgresql://user:password@localhost:5432/kuccps_ticketing?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=<32+ chars>
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173,http://localhost:5174
PUBLIC_TICKET_API_KEY=<32+ chars>
REQUIRE_PUBLIC_API_KEY=true
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM="KUCCPS IT Support <itsupport@example.ac.ke>"
SUPPORT_EMAIL=itsupport@example.ac.ke
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=
IMAP_PASSWORD=
IMAP_TLS=true
USE_LDAP_AUTH=false
LDAP_URL=ldaps://ldap.example.ac.ke:636
LDAP_BIND_DN=
LDAP_BIND_PASSWORD=
LDAP_SEARCH_BASE=
LDAP_SEARCH_FILTER=(uid={{username}})
MAX_FILE_SIZE=10485760
MAX_UPLOAD_BYTES=10485760
MAX_KB_UPLOAD_BYTES=5242880
UPLOAD_DIR=./uploads
ALLOW_PUBLIC_API_KEY_IN_BODY=false
SMTP_TLS_REJECT_UNAUTHORIZED=true
IMAP_TLS_REJECT_UNAUTHORIZED=true
LDAP_TLS_REJECT_UNAUTHORIZED=true
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:5000/api
```

### 10.4 Production Checklist

1. Create production PostgreSQL database
2. Configure `backend/.env` with production values
3. Set `NODE_ENV=production`
4. Set `FRONTEND_URL` / `CORS_ORIGINS` to HTTPS frontend
5. Rotate `JWT_SECRET` and `PUBLIC_TICKET_API_KEY` (min 32 chars)
6. Set `REQUIRE_PUBLIC_API_KEY=true`
7. Configure SMTP credentials
8. Configure IMAP only if needed
9. Use LDAPS for production AD
10. Run: `npm run preflight && npx prisma generate && npx prisma migrate deploy && npm start`
11. Build frontend: `npm install && npm run build`
12. Deploy frontend to static host (Vercel, Netlify, VPS)
13. Configure reverse proxy (Nginx) for HTTPS
14. Update Google Workspace Add-on `API_URL` to production backend
15. Schedule PostgreSQL backups
16. Back up `backend/uploads/` and KB materials

### 10.5 Preflight Checks (`scripts/preflight.js`)

Validates on startup:
- `DATABASE_URL` and `JWT_SECRET` present
- `PUBLIC_TICKET_API_KEY` length ≥ 32
- Production: HTTPS frontend URL, no localhost CORS, LDAPS, TLS enforcement
- LDAP required vars when `USE_LDAP_AUTH=true`
- Node.js version ≥ 22

---

## 11. Project Metrics & Impact

### 11.1 Codebase Metrics

| Metric | Count |
|--------|-------|
| Frontend Components | 40+ |
| Backend Controllers | 10 |
| Backend Routes | 11 route files |
| API Endpoints | 40+ |
| Database Models | 16 |
| Frontend Charts | 16 |
| Google Add-on Functions | 8 |
| Email Templates | 3 default |
| Middleware Modules | 2 |
| Service Modules | 2 |

### 11.2 Operational Impact

- **Ticket Traceability:** 100% — every request captured with unique number
- **SLA Automation:** Response and resolution timers with breach detection
- **Knowledge Deflection:** AI-powered article suggestions reduce repeat tickets
- **Executive Reporting:** 16 charts, CSAT scores, SLA compliance, AI insights
- **Multi-Channel Intake:** Gmail add-on + IMAP email + web (future)
- **AD Integration:** Seamless user/department sync with existing infrastructure

---

## 12. Future Roadmap

1. **Mobile PWA** — Progressive web app with offline support
2. **Real-time Updates** — WebSocket live ticket updates
3. **Advanced Export** — PDF/Excel reporting with scheduled delivery
4. **Multi-language** — i18n support for Swahili/English
5. **Additional Channels** — WhatsApp, Microsoft Teams integration
6. **ML Classification** — Auto-categorize tickets using trained models
7. **Public Web Intake** — Standalone request portal for non-Gmail users
8. **Advanced RBAC** — Granular permission policies per department

---

## 13. Screenshots

> Replace the placeholders below with actual screenshots of the running application.

### 13.1 Authentication
![Login Page](screenshots/login.png)
![Landing Page](screenshots/landing.png)

### 13.2 Dashboard
![Dashboard](screenshots/dashboard.png)

### 13.3 Ticket Management
![Ticket List](screenshots/tickets.png)
![Ticket Detail](screenshots/ticket-detail.png)

### 13.4 Departments & Users
![Departments](screenshots/departments.png)
![Users](screenshots/users.png)

### 13.5 Knowledge Base
![Knowledge Base](screenshots/knowledge-base.png)

### 13.6 Admin & Settings
![Admin Settings](screenshots/admin-settings.png)

### 13.7 Integrations
![Google Add-on](screenshots/google-addon.png)
![Status Page](screenshots/status-page.png)

---

*Prepared for KUCCPS IT Ticketing System — Production Ready*
