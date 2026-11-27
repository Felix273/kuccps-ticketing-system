---
title: Roles, Access and Settings
---

# Roles, Access and Settings

## Roles

Every person has one role. Roles bundle **permissions**, and each permission is a real task. The API enforces every permission; the interface only shows what the role allows.

| Role | Who it is for | What they can do |
| --- | --- | --- |
| **Administrator** | System owners | Everything, including roles, access and every setting. This role is fixed. |
| **ICT Manager** | Head of ICT / service desk lead | Everything an officer can do, plus assign and reassign tickets, reopen closed tickets, export, publish and approve knowledge articles, read the access audit log, and manage Service Desk settings (ticket rules, escalation, SLA timelines). |
| **ICT Officer** | Service desk officers | View and work on tickets (claim, reply, internal notes, attachments, hold, resolve), escalate, contribute knowledge articles (sent for review), view dashboards and the directory, and update the service status page. |
| **Viewer** | Management, audit | Read-only: tickets, dashboards and reports, the directory and the access audit log. |
| **Requester** | Staff who raise tickets | No access to this system. They raise tickets by email or the Gmail add-on. This role is fixed. |

Administrators can adjust the Manager, Officer and Viewer permission sets, or create **custom roles** (for example "Network Team") in *Settings → Roles & Access*.

## Permissions

| Area | Permission | Allows |
| --- | --- | --- |
| Tickets | View tickets | Queue, ticket details and conversations |
| | Work on tickets | Claim, reply, internal notes, attachments, hold, resolve |
| | Assign tickets | Assign or reassign tickets to other officers |
| | Escalate tickets | Escalate to another officer |
| | Reopen tickets | Reopen closed tickets |
| | Export tickets | Download ticket lists as CSV |
| Knowledge base | Contribute articles | Propose articles and upload documents (reviewed before publishing) |
| | Publish & manage articles | Approve, edit, archive, delete; see search gaps |
| Oversight | View dashboards & reports | Dashboard, analytics, customer feedback |
| | View directory | Officers, users and directorates |
| | Manage service status | Publish and update service status issues |
| | View access audit log | Who changed roles and permissions |
| Settings | Organization settings | Name, email identity, email colours |
| | Email settings | Outgoing/incoming mail, test mode, email templates |
| | Service desk settings | Ticket defaults, escalation, attachments, SLA timelines |
| | Active Directory settings | Directory connection and synchronisation |
| | Manage roles & access | Assign roles, edit role permissions. Administrator only. |

### Rules that always apply

- People without any permission (Requesters) cannot sign in.
- You cannot change your own role, and the last Administrator cannot be removed.
- **Manage roles & access** can only belong to the Administrator role.
- Tickets can only be assigned or escalated to people who can work on tickets. A Viewer cannot be assigned.
- Claiming a ticket for yourself needs *Work on tickets*; assigning it to someone else needs *Assign tickets*.
- Articles from people without *Publish* always go to the review queue.
- Active Directory sync keeps a role an administrator chose (for example ICT Manager or Viewer). It only changes the role when the directory moves the person into a different category.
- Every role or permission change is recorded in the **Access Audit Log**.

## Settings

Only settings that the system actually uses are shown, in six areas:

| Area | Contents | Permission |
| --- | --- | --- |
| Organization | Organization name, sender name, support and reply-to addresses, email colours | Organization settings |
| Email | Outgoing mail (SMTP), incoming mail (IMAP; changes apply on the next reconnect or restart), test mode, email templates | Email settings |
| Service Desk | Ticket prefix and defaults, SLA warning threshold, reply window, escalation recipients, attachment types and size, SLA timelines | Service desk settings |
| Active Directory | Directory connection and synchronisation | Active Directory settings |
| Roles & Access | Team members' roles, role permissions, custom roles | Manage roles & access |
| Access Audit Log | History of role and permission changes | View access audit log |

**Removed because nothing in the system used them:** maintenance mode, Google add-on URL and toggle, dark mode and contrast mode, organization code, logo and favicon URLs, ticket-number format, and the Custom Forms builder.

Personal **email alert preferences** are under *Alerts* in the sidebar and are available to every signed-in user.
