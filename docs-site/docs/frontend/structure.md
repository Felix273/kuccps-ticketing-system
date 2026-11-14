# Frontend Structure

The frontend source code is organized into a clear hierarchy of directories.

## Directory Layout

```text
frontend/
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Root component + routing
│   ├── index.css                   # Tailwind directives + global styles
│   ├── App.css                     # App-specific styles
│   ├── assets/                     # Static assets
│   │   └── react.svg
│   ├── components/                 # React components
│   │   ├── auth/                   # Authentication pages
│   │   ├── layout/                 # Shared layout
│   │   ├── dashboard/              # Dashboard and charts
│   │   ├── tickets/                # Ticket management
│   │   ├── departments/            # Department management
│   │   ├── users/                  # User management
│   │   ├── knowledgebase/          # Knowledge base
│   │   ├── admin/                  # Admin settings
│   │   ├── settings/               # User preferences
│   │   ├── status/                 # Status pages
│   │   └── common/                 # Shared UI components
│   ├── services/                   # API client modules
│   ├── hooks/                      # Custom React hooks
│   ├── utils/                      # Utilities and constants
│   └── styles/                     # Additional CSS
├── public/
│   └── vite.svg
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## Module Responsibilities

### components/

Contains all presentational and container components. Organized by feature domain:

- **auth:** Login and landing pages
- **layout:** Header, navigation, stat cards, notification bell
- **dashboard:** Dashboard view, quick stats, chart components
- **tickets:** Ticket list, detail modal, assignment, filters, search
- **departments:** Department cards, modals, user tickets drawer
- **users:** User cards, user modal
- **knowledgebase:** Knowledge base view
- **admin:** Admin panel with all settings sections
- **settings:** Notification preferences
- **status:** Public status page
- **common:** Logo, loading spinner, error/success messages

### services/

Each service module encapsulates API communication for a specific domain:

- **api.js:** Central fetch client with JWT header injection and auth redirect
- **authService.js:** Login, logout, profile operations
- **ticketService.js:** Ticket CRUD, comments, attachments, escalation
- **userService.js:** User management
- **departmentService.js:** Department CRUD
- **settingsService.js:** System settings and email templates
- **knowledgeBaseService.js:** KB articles and ratings
- **operationsService.js:** Dashboard analytics and SLA policies
- **statusIssueService.js:** Status issues
- **formService.js:** Custom forms
- **viewService.js:** Saved views
- **notificationService.js:** Notifications and preferences

### hooks/

Custom hooks wrap service calls and provide loading/error states:

- **useAuth.js:** Authentication state helpers
- **useTickets.js:** Ticket fetching with pagination
- **useUsers.js:** User fetching
- **useDepartments.js:** Department fetching
- **useStatistics.js:** Dashboard statistics fetching

### utils/

Utility functions and constants:

- **constants.js:** Application constants (categories, priorities, statuses)
- **exportUtils.js:** CSV/Excel export functionality
- **analytics.js:** Analytics helper functions
