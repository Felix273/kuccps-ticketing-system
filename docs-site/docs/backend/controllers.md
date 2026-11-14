# Controllers

Controllers handle HTTP requests, validate input, call service layer functions, and return JSON responses.

## Response Format

Most API responses follow this standard shape:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Some endpoints return resource-specific keys such as `user`, `users`, `ticket`, `tickets`, `statistics`, `settings`, or `preferences`.

## Authentication Controller

**File:** `backend/src/controllers/authController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `login` | `POST /api/auth/login` | Authenticate user, return JWT |
| `logout` | `POST /api/auth/logout` | Client-side token cleanup |
| `getProfile` | `GET /api/auth/profile` | Return current user |

## Ticket Controller

**File:** `backend/src/controllers/ticketController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getTickets` | `GET /api/tickets` | List all tickets with filtering |
| `getTicket` | `GET /api/tickets/:id` | Get single ticket with relations |
| `updateTicket` | `PUT /api/tickets/:id` | Update ticket fields |
| `escalateTicket` | `POST /api/tickets/:id/escalate` | Escalate to another user |
| `addComment` | `POST /api/tickets/:id/comments` | Add staff comment |
| `uploadAttachment` | `POST /api/tickets/:id/attachments` | Upload file attachment |

## User Controller

**File:** `backend/src/controllers/userController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getUsers` | `GET /api/users` | List all users |
| `syncAD` | `POST /api/users/sync/ad` | Sync from Active Directory |
| `createUser` | `POST /api/users` | Create new user (admin) |
| `updateUser` | `PUT /api/users/:id` | Update user (admin) |
| `deleteUser` | `DELETE /api/users/:id` | Delete user (admin) |

## Department Controller

**File:** `backend/src/controllers/departmentController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getDepartments` | `GET /api/departments` | List all departments |
| `getDepartment` | `GET /api/departments/:id` | Get single department |
| `syncAD` | `POST /api/departments/sync/ad` | Sync directorates from AD |
| `createDepartment` | `POST /api/departments` | Create department (admin) |
| `updateDepartment` | `PUT /api/departments/:id` | Update department (admin) |
| `deleteDepartment` | `DELETE /api/departments/:id` | Delete department (admin) |

## Settings Controller

**File:** `backend/src/controllers/settingsController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getSettings` | `GET /api/settings` | Get system settings (admin) |
| `updateSettings` | `PUT /api/settings` | Update system settings (admin) |
| `getPublicSettings` | `GET /api/settings/public` | Get public branding settings |
| `getEmailTemplates` | `GET /api/settings/email-templates` | List email templates (admin) |
| `getEmailTemplate` | `GET /api/settings/email-templates/:type` | Get one template (admin) |
| `createEmailTemplate` | `POST /api/settings/email-templates` | Create template (admin) |
| `updateEmailTemplate` | `PUT /api/settings/email-templates/:type` | Update template (admin) |
| `deleteEmailTemplate` | `DELETE /api/settings/email-templates/:type` | Delete template (admin) |
| `resetEmailTemplates` | `POST /api/settings/email-templates/reset` | Reset to defaults (admin) |

## Knowledge Base Controller

**File:** `backend/src/controllers/knowledgeBaseController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getPublicArticles` | `GET /api/knowledge-base/public/articles` | List public articles |
| `getPublicArticle` | `GET /api/knowledge-base/public/articles/:idOrSlug` | Get public article |
| `getArticles` | `GET /api/knowledge-base/articles` | List all articles (staff/admin) |
| `getInsights` | `GET /api/knowledge-base/insights` | Get KB insights (staff/admin) |
| `getSuggestions` | `GET /api/knowledge-base/suggestions/tickets/:ticketId` | Get article suggestions |
| `createArticle` | `POST /api/knowledge-base/articles` | Create article (staff/admin) |
| `updateArticle` | `PUT /api/knowledge-base/articles/:id` | Update article (staff/admin) |
| `deleteArticle` | `DELETE /api/knowledge-base/articles/:id` | Delete article (staff/admin) |
| `rateArticle` | `POST /api/knowledge-base/articles/:id/rate` | Rate article (public) |
| `uploadMaterial` | `POST /api/knowledge-base/materials/upload` | Upload material (staff/admin) |

## Status Issue Controller

**File:** `backend/src/controllers/statusIssueController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getPublicIssues` | `GET /api/status-issues/public` | List public status issues |
| `getIssues` | `GET /api/status-issues` | List all issues (staff/admin) |
| `createIssue` | `POST /api/status-issues` | Create issue (staff/admin) |
| `updateIssue` | `PUT /api/status-issues/:id` | Update issue (staff/admin) |
| `addUpdate` | `POST /api/status-issues/:id/updates` | Add status update (staff/admin) |

## Operations Controller

**File:** `backend/src/controllers/operationsController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getDashboard` | `GET /api/operations/dashboard` | Get dashboard analytics |
| `getSlaPolicies` | `GET /api/operations/sla-policies` | List SLA policies |
| `createSlaPolicy` | `POST /api/operations/sla-policies` | Create SLA policy (admin) |
| `updateSlaPolicy` | `PUT /api/operations/sla-policies/:id` | Update SLA policy (admin) |
| `submitCsat` | `POST /api/operations/csat` | Submit CSAT response (JWT) |

## Form Controller

**File:** `backend/src/controllers/formController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getPublicForms` | `GET /api/forms/public` | List active public forms |
| `getForms` | `GET /api/forms` | List forms (staff/admin) |
| `createForm` | `POST /api/forms` | Create form (admin) |
| `updateForm` | `PUT /api/forms/:id` | Update form (admin) |
| `deleteForm` | `DELETE /api/forms/:id` | Delete form (admin) |

## View Controller

**File:** `backend/src/controllers/viewController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getViews` | `GET /api/views` | List saved views |
| `createView` | `POST /api/views` | Create saved view |
| `updateView` | `PUT /api/views/:id` | Update saved view |
| `deleteView` | `DELETE /api/views/:id` | Delete saved view |
