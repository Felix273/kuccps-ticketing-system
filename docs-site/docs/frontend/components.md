# Components

This document describes the key frontend components and their responsibilities.

## Layout Components

### Header

**File:** `frontend/src/components/layout/Header.jsx`

Displays the organization logo, current user information, and logout button. Also handles active tab changes.

### Navigation

**File:** `frontend/src/components/layout/Navigation.jsx`

Renders the tab-based navigation bar with icons and labels. Highlights the active tab.

### StatCard

**File:** `frontend/src/components/layout/StatCard.jsx`

Reusable card component for displaying statistics with icons, labels, and trend indicators.

### NotificationBell

**File:** `frontend/src/components/layout/NotificationBell.jsx`

Displays unread notification count and provides access to the notification dropdown.

## Dashboard Components

### DashboardView

**File:** `frontend/src/components/dashboard/DashboardView.jsx`

The main dashboard container. Fetches and displays:
- Quick statistics cards
- Interactive charts
- SLA compliance badges

### QuickStatsCards

**File:** `frontend/src/components/dashboard/QuickStatsCards.jsx`

Grid of stat cards showing key metrics (total tickets, open, resolved, overdue).

### Charts

Located in `frontend/src/components/dashboard/charts/`:

| Component | Chart Type | Data |
|-----------|-----------|------|
| `TicketTrendsChart.jsx` | Area/Line | Ticket volume over time |
| `VolumeByHourChart.jsx` | Bar | Tickets by hour of day |
| `TopCategoriesChart.jsx` | Bar | Top issue categories |
| `PriorityChart.jsx` | Bar | Priority distribution |
| `StatusPieChart.jsx` | Pie | Status breakdown |
| `ActiveVsResolvedChart.jsx` | Area | Active vs resolved trends |
| `DepartmentStatsChart.jsx` | Bar | Department ticket counts |
| `DepartmentPerformanceChart.jsx` | Bar | Department resolution rates |
| `DepartmentTicketChart.jsx` | Pie | Department ticket distribution |
| `UserWorkloadChart.jsx` | Bar | Agent workload |
| `TopPerformersChart.jsx` | Bar | Top performing agents |
| `EmailDomainChart.jsx` | Bar | Requester email domains |
| `TopRequestersChart.jsx` | Bar | Top ticket requesters |
| `AssignmentChart.jsx` | Pie | Ticket assignment stats |
| `ResponseTimeChart.jsx` | Bar | Average response times |
| `ResolutionRateChart.jsx` | Line | Resolution rate trends |

## Ticket Components

### TicketsView

**File:** `frontend/src/components/tickets/TicketsView.jsx`

Main ticket list container with filters, search, and refresh.

### TicketCard / TicketRow

Display individual tickets in card or table row format.

### TicketDetailModal

Opens a modal showing full ticket details, comments, attachments, and history.

### TicketAssignModal

Modal for assigning or reassigning tickets to staff members.

### TicketFilters

Advanced filtering controls for the ticket list.

### QuickFilters

One-click filter buttons for common views (My Tickets, Overdue, Unassigned).

### SavedFilters

Manage and apply saved ticket filter configurations.

### AdvancedSearchModal

Full-text search across ticket fields.

## Department Components

### DepartmentsView

Main department list and management interface.

### DepartmentCard

Displays department information with ticket counts and actions.

### DepartmentModal

Create/edit department form.

### DepartmentDetailModal

Detailed department view with member list and ticket stats.

### UserTicketsDrawer

Slide-out drawer showing all tickets for a specific user within a department.

## User Components

### UsersView

User list and management interface.

### UserCard

Displays user information with role and actions.

### UserModal

Create/edit user form.

## Knowledge Base Components

### KnowledgeBaseView

Self-service knowledge base with search, categories, and article ratings.

## Admin Components

### AdminPanel

Container for all admin settings sections with tab navigation.

| Component | File | Purpose |
|-----------|------|---------|
| `OrganizationSettings` | `admin/OrganizationSettings.jsx` | Org name, colors, logo |
| `EmailSettings` | `admin/EmailSettings.jsx` | SMTP/IMAP configuration |
| `EmailTemplates` | `admin/EmailTemplates.jsx` | Manage email templates |
| `ActiveDirectorySettings` | `admin/ActiveDirectorySettings.jsx` | LDAP configuration |
| `TicketSettings` | `admin/TicketSettings.jsx` | Default ticket values |
| `CustomFormsSettings` | `admin/CustomFormsSettings.jsx` | Manage custom forms |

## Common Components

### Logo

Renders the organization logo with fallback to text.

### LoadingSpinner

Animated loading indicator.

### ErrorMessage / SuccessMessage

Display operational feedback.
