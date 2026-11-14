# Services

The frontend service layer provides a clean abstraction over the backend API.

## Central API Client

**File:** `frontend/src/services/api.js`

### Responsibilities

- Centralizes all HTTP requests
- Injects JWT token into request headers
- Handles authentication errors (401/403)
- Parses JSON responses
- Redirects to login on auth failure

### Usage

```javascript
import { api } from '../services/api';

const response = await api.get('/tickets');
const data = await response.json();
```

### Configuration

The API base URL is read from `VITE_API_URL`:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## Service Modules

### authService.js

Handles authentication operations:

| Function | Method | Endpoint |
|----------|--------|----------|
| `login(username, password)` | POST | `/auth/login` |
| `logout()` | POST | `/auth/logout` |
| `getProfile()` | GET | `/auth/profile` |
| `getCurrentUser()` | — | Reads from localStorage |

### ticketService.js

Ticket operations:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchTickets()` | GET | `/tickets` |
| `fetchTicket(id)` | GET | `/tickets/:id` |
| `updateTicket(id, data)` | PUT | `/tickets/:id` |
| `escalateTicket(id, userId)` | POST | `/tickets/:id/escalate` |
| `addComment(id, content, isInternal)` | POST | `/tickets/:id/comments` |
| `uploadAttachment(id, file)` | POST | `/tickets/:id/attachments` |

### userService.js

User management:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchUsers()` | GET | `/users` |
| `createUser(data)` | POST | `/users` |
| `updateUser(id, data)` | PUT | `/users/:id` |
| `deleteUser(id)` | DELETE | `/users/:id` |
| `syncAD()` | POST | `/users/sync/ad` |

### departmentService.js

Department management:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchDepartments()` | GET | `/departments` |
| `fetchDepartment(id)` | GET | `/departments/:id` |
| `createDepartment(data)` | POST | `/departments` |
| `updateDepartment(id, data)` | PUT | `/departments/:id` |
| `deleteDepartment(id)` | DELETE | `/departments/:id` |
| `syncAD()` | POST | `/departments/sync/ad` |

### settingsService.js

System settings:

| Function | Method | Endpoint |
|----------|--------|----------|
| `getSettings()` | GET | `/settings` |
| `updateSettings(data)` | PUT | `/settings` |
| `getPublicSettings()` | GET | `/settings/public` |
| `fetchEmailTemplates()` | GET | `/settings/email-templates` |
| `updateEmailTemplate(type, data)` | PUT | `/settings/email-templates/:type` |

### knowledgeBaseService.js

Knowledge base:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchPublicArticles()` | GET | `/knowledge-base/public/articles` |
| `fetchArticles()` | GET | `/knowledge-base/articles` |
| `fetchArticle(idOrSlug)` | GET | `/knowledge-base/articles/:idOrSlug` |
| `createArticle(data)` | POST | `/knowledge-base/articles` |
| `updateArticle(id, data)` | PUT | `/knowledge-base/articles/:id` |
| `deleteArticle(id)` | DELETE | `/knowledge-base/articles/:id` |
| `rateArticle(id, helpful)` | POST | `/knowledge-base/articles/:id/rate` |

### operationsService.js

Analytics and operations:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchDashboard()` | GET | `/operations/dashboard` |
| `fetchSlaPolicies()` | GET | `/operations/sla-policies` |
| `createSlaPolicy(data)` | POST | `/operations/sla-policies` |
| `updateSlaPolicy(id, data)` | PUT | `/operations/sla-policies/:id` |
| `submitCsat(data)` | POST | `/operations/csat` |

### statusIssueService.js

Status issues:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchPublicIssues()` | GET | `/status-issues/public` |
| `fetchIssues()` | GET | `/status-issues` |
| `createIssue(data)` | POST | `/status-issues` |
| `updateIssue(id, data)` | PUT | `/status-issues/:id` |

### formService.js

Custom forms:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchPublicForms()` | GET | `/forms/public` |
| `fetchForms()` | GET | `/forms` |
| `createForm(data)` | POST | `/forms` |
| `updateForm(id, data)` | PUT | `/forms/:id` |
| `deleteForm(id)` | DELETE | `/forms/:id` |

### viewService.js

Saved views:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchViews()` | GET | `/views` |
| `createView(data)` | POST | `/views` |
| `updateView(id, data)` | PUT | `/views/:id` |
| `deleteView(id)` | DELETE | `/views/:id` |

### notificationService.js

Notifications:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchNotifications()` | GET | `/notifications` |
| `markAllRead()` | PUT | `/notifications/read/all` |
| `markRead(id)` | PUT | `/notifications/:id/read` |
| `dismiss(id)` | DELETE | `/notifications/:id` |
| `fetchPreferences()` | GET | `/notifications/preferences` |
| `updatePreferences(data)` | PUT | `/notifications/preferences` |
| `sendTestEmail()` | POST | `/notifications/test` |
