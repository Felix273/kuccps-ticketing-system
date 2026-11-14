# KUCCPS IT Ticketing System

Welcome to the official documentation for the **KUCCPS IT Ticketing System**, a comprehensive full-stack support ticketing platform built for the Kenya Universities and Colleges Central Placement Service.

## What is this system?

The KUCCPS IT Ticketing System streamlines IT support operations by enabling users to submit support requests, allowing ICT staff to manage and resolve tickets efficiently, and providing powerful analytics, knowledge base management, and integration with external services like Google Workspace.

## Key Capabilities

- **Ticket Management** — Full lifecycle from creation to resolution with SLA tracking, escalation, attachments, and audit history
- **User & Department Management** — Role-based access control with `user`, `staff`, and `admin` roles, department assignment, and Active Directory sync
- **Dashboard & Analytics** — Real-time charts, SLA compliance monitoring, agent workload tracking, and CSAT reporting
- **Email Integration** — Automated SMTP notifications, optional IMAP monitoring, and professional email templates
- **Knowledge Base** — Self-service articles with search, ratings, and ticket-suggestion engine
- **Google Workspace Add-on** — Create tickets directly from Gmail using a contextual add-on
- **Status Pages** — Public and internal status issue tracking with updates
- **Custom Forms** — Configurable intake forms for different ticket categories
- **Saved Views** — Reusable ticket filters and column configurations

## Who is this for?

| Role | Access |
|------|--------|
| **Admin** | Full system configuration, user management, email templates, LDAP settings |
| **Staff / Agent** | Ticket management, department oversight, knowledge base, dashboard analytics |
| **User** | Public ticket intake, knowledge base access, status page viewing |

## Quick Links

- **Source Code:** [GitHub Repository](https://github.com/Felix273/kuccps-ticketing-system)
- **License:** ISC
- **Developer:** Felix Ngitari

## Documentation Structure

This documentation is organized into the following sections:

1. **Getting Started** — Installation, configuration, and local development setup
2. **Architecture** — System design, data flow, and component interactions
3. **Backend** — Server setup, middleware, controllers, routes, services, and security
4. **Frontend** — Component structure, services, hooks, routing, and styling
5. **Database** — Prisma schema, migrations, seed data, and ORM usage
6. **API Reference** — Complete endpoint documentation for all modules
7. **Google Workspace Add-on** — Add-on setup, deployment, and API integration
8. **Deployment** — Production deployment guides for backend, frontend, and database
9. **Operations** — Maintenance, backup, and monitoring procedures
10. **Troubleshooting** — Common issues and their resolutions
