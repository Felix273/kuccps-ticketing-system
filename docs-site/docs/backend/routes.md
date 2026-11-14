# Routes

Routes define the URL structure and map HTTP methods to controller functions.

## Route Organization

Routes are organized by domain module. Each route file imports its corresponding controller and applies middleware.

### Public Ticket Routes

**File:** `backend/src/routes/publicTickets.js`

```javascript
const express = require('express');
const router = express.Router();
const { createPublicTicket } = require('../controllers/ticketController');

router.post('/', createPublicTicket);

module.exports = router;
```

### Authentication Routes

**File:** `backend/src/routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/profile', require('../middleware/auth').authenticate, authController.getProfile);

module.exports = router;
```

### Ticket Routes

**File:** `backend/src/routes/tickets.js`

```javascript
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { requireStaffOrAdmin } = require('../middleware/auth');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, requireStaffOrAdmin, ticketController.getTickets);
router.get('/:id', authenticate, requireStaffOrAdmin, ticketController.getTicket);
router.put('/:id', authenticate, requireStaffOrAdmin, ticketController.updateTicket);
router.post('/:id/escalate', authenticate, requireStaffOrAdmin, ticketController.escalateTicket);
router.post('/:id/comments', authenticate, requireStaffOrAdmin, ticketController.addComment);
router.post('/:id/attachments', authenticate, requireStaffOrAdmin, 
  upload.single('file'), ticketController.uploadAttachment);

module.exports = router;
```

### Mounting Order in server.js

Routes are mounted in `backend/src/server.js`:

```javascript
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'auth' }), authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/views', require('./routes/views'));
app.use('/api/knowledge-base', require('./routes/knowledgeBase'));
app.use('/api/status-issues', require('./routes/statusIssues'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/operations', require('./routes/operations'));
app.use('/api/public/tickets', rateLimit(...), publicTicketRoutes);
app.use('/api/tickets/public', rateLimit(...), publicTicketRoutes);
app.use('/api/tickets', ticketRoutes);
```

> **Important:** Public ticket routes must be mounted before the general `/api/tickets` route to avoid path conflicts.

## Route Patterns

| Pattern | Example | Purpose |
|---------|---------|---------|
| `GET /` | `GET /api/tickets` | List resources |
| `GET /:id` | `GET /api/tickets/123` | Get single resource |
| `POST /` | `POST /api/tickets` | Create resource |
| `PUT /:id` | `PUT /api/tickets/123` | Update resource |
| `DELETE /:id` | `DELETE /api/tickets/123` | Delete resource |
| `POST /:id/action` | `POST /api/tickets/123/escalate` | Resource-specific action |
