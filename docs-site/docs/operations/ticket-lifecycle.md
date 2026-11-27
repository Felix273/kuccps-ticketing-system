---
title: Ticket Lifecycle, SLA and Escalation
---

# Ticket Lifecycle, SLA and Escalation

This page is the reference for how a ticket moves from receipt to closure, how Service Charter timelines are applied, when tickets escalate automatically, what requesters are told, and what the activity log records.

## Statuses

| Status | Meaning | SLA clock |
| --- | --- | --- |
| **Open** | Received, not yet being worked on | Running |
| **In Progress** | Claimed by an ICT officer and under investigation | Running |
| **On Hold** | Blocked by something outside the officer's control (waiting for the requester, a supplier, a third party) | **Paused** |
| **Closed** | Resolved by an officer. This is the final state | Stopped |

> **Resolved vs Closed (team decision).** Resolving a ticket closes it immediately. The ticket does not wait for the requester to confirm or rate the service. The requester still receives a satisfaction-rating link, and their rating is recorded against the closed ticket.
> Tickets left in the old `Resolved` state were closed by the database migration on upgrade.

### Resolving

The officer clicks **Resolve & Close** and completes the resolution record:

- **How the issue was resolved.** Required, at least 10 characters. This text is emailed to the requester.
- **How effective the solution was.** Optional, 1–5.
- **Whether the solution can be reused.** If ticked, a knowledge-base draft is created from the ticket and goes to the administrator review queue.
- **Additional information or recommendations.** Optional.
- **Knowledge tip for the requester.** Optional. A published knowledge-base article whose summary is included in the resolution email so the requester can avoid or fix the issue next time.

### Reopening

- Reopening (ICT Manager or Administrator) returns the ticket to the officer who handled it, as **In Progress**, and alerts them. A ticket that never had an officer goes back to the queue and the service desk is alerted.
- A reopened ticket gets a **fresh Service Charter deadline** from the moment it is reopened, so it is not instantly overdue or escalated.

- Reopening is done from the ticket window by anyone holding the **Reopen tickets** permission (ICT Manager and Administrator by default).
- A requester replying to a closed ticket does **not** reopen it: within the reply window (default **14 days**, set in *Settings → Tickets*) the reply is added to the ticket conversation and activity log, and the assigned officer (or the administrators, if unassigned) is alerted to review it and reopen if needed.
- A reply after the reply window opens a **new** ticket instead.

### On Hold

- A **reason is required**. It is emailed to the requester and should say clearly what, if anything, is needed from them.
- While on hold, the SLA clock is paused: the ticket is not counted as overdue and is not escalated.
- When work resumes, the response and resolution deadlines are moved back by the time spent on hold, and the requester is emailed the updated expected resolution time.
- Total time on hold is kept on the ticket and excluded from its resolution time.

## Categories and Service Charter timelines

Ticket categories are the services in the ICT Service Delivery Charter. Each category has an SLA timeline that can be edited in **Settings → Service Desk → SLA timelines**. Timelines stated in hours run around the clock (calendar hours); timelines stated in days count working days only, excluding weekends and Kenyan public holidays.

| Category | Charter timeline |
| --- | --- |
| Equipment Issuance | Immediately to 24 hours (calendar hours) |
| Hardware Support | Immediately to 24 hours (calendar hours) |
| Software Support | Immediately to 48 hours (calendar hours) |
| Provision of Information | Immediately to 7 days (working days) |
| Incident/Problem Resolution | Per the urgency matrix (Very High → Very Low) |
| Software Development | As per specification |
| Information Inquiry | Immediately to 3 days (working days) |

Network, email, access and other operational faults are filed under **Incident/Problem Resolution**, where the priority (urgency) sets the response and resolution targets. Older category names (for example "Hardware Issues") are mapped automatically. The web app, the Google Workspace add-on and email intake all use this one list.

## Automatic escalation

The SLA monitor runs every 15 minutes, for **all priorities**:

1. **Warning.** When a ticket has used the warning threshold of its resolution time (default **75%**, set in *Settings → Tickets*), the assigned officer is alerted in-app and by email. If nobody has claimed the ticket, all administrators are alerted.
2. **Escalation.** When the resolution deadline passes (plus the escalation grace period configured for the SLA, if any):
   - the ticket is escalated to **all administrators**, the **assigned officer**, and the **escalation email recipients** set in *Settings → Tickets*;
   - the ticket is flagged as an SLA breach;
   - the requester is told it has been escalated for priority attention.

Each stage happens once per ticket and is written to the activity log. On Hold tickets are skipped.

Officers can also escalate manually (horizontally to a peer, or vertically to a senior officer). The target officer and the requester are both emailed.

## What the requester is told

| Event | Email content |
| --- | --- |
| Ticket received | Acknowledgement with the **expected resolution date** from the Service Charter |
| Assigned / claimed | Officer's name, that it is being investigated, the expected resolution date |
| On hold | The reason and what is needed from them; the timer is paused |
| Resumed | Work has resumed, with the updated expected resolution date |
| Escalated (manual or automatic) | That it has been escalated; no action required |
| Resolved and closed | The resolution, an optional knowledge tip, how to reopen (reply), and the rating buttons |
| Reopened | That it is being worked on again, with the expected date |

Every email states whether any action is required from the requester.

## What ICT officers are told

Every alert appears in the bell. It is also emailed when the officer's matching setting is on (*Alerts* in the sidebar):

| Event | Who | Email setting |
| --- | --- | --- |
| New ticket in the queue (email, add-on, or reopened without an officer) | Everyone who can work tickets | New Tickets |
| Ticket assigned to you | The officer | Ticket Assignments |
| Someone else changed the status of your ticket | The ticket's officer | Status Changes |
| Requester replied, or a colleague commented | The ticket's officer (managers if unassigned) | Replies & Comments |
| Requester replied to a closed ticket | The ticket's officer (administrators if unassigned) | Replies & Comments |
| Escalated to you; SLA 75% warning; SLA exceeded | Target officer / assigned officer / administrators | Escalations & SLA Alerts |
| Low customer rating (2 stars or below) | Resolving officer, assigned officer, managers and administrators | Escalations & SLA Alerts |
| Daily summary of open and overdue tickets (weekdays 07:30) | Officers who opt in | Daily Digest |
| Knowledge article waiting for review | Knowledge publishers | In-app only |

The escalation email recipients in *Settings → Service Desk* (for example the Head of ICT) are always emailed when a ticket exceeds its SLA.

## Activity log

Each ticket's **Audit Trail** tab shows its full history, oldest first. Every entry records who acted (officer name, requester, or *SLA monitor*), when, and any note. Events recorded:

- created (web, add-on or email)
- claimed, assigned, reassigned or unassigned
- status changes: investigation started, placed on hold (with reason), resumed (with time on hold), resolved (with resolution notes), closed, reopened
- manual escalation (horizontal or vertical, with reason)
- automatic SLA warning and SLA escalation
- priority, category and directorate changes
- attachments
- customer rating and feedback comment

The resolution record (notes, effectiveness, reusable, recommendations, time on hold) is shown under the timeline.

## Internal notes

Internal notes are stored in the `Comment` table with `isInternal = true`, alongside the ticket's email conversation.

- **Who can see them:** they are visible only to ICT staff and administrators in the ticket window, and are never emailed to the requester.
- **Purpose:** they are for coordination between officers, and they also form part of the ticket's permanent record. They are kept with the ticket and appear in the conversation with their author and time.

## Customer feedback reporting

The dashboard's **Customer Feedback** panel shows:

- the average rating by week (last 12 weeks);
- the 90-day response rate: rated tickets as a share of closed tickets;
- average rating and number of low ratings (2 stars or below) per officer, and averages per category;
- the latest low ratings with comments, linked to their tickets for follow-up.

## Go-live mail setup

Local and test environments point at a test mail server (SMTP `127.0.0.1:3025`, IMAP `127.0.0.1:3143`). Before go-live, in **Settings → Email → Mail delivery**:

1. Enter the KUCCPS support mailbox's **SMTP** host, port, TLS setting, username and password.
2. Enter the same mailbox's **IMAP** host, port, username and password, and keep **Enable Email Monitoring** ticked.
3. Save, then open **Alerts** in the sidebar, click **Send Test Email**, and confirm it arrives in a real inbox.
4. Send an email to the support mailbox from a staff account and confirm a ticket is created and the acknowledgement arrives.
5. Make sure **Test Mode** is off, so requesters receive their emails.

Passwords are stored encrypted and never shown again after saving.

## Testing email safely

In **Settings → Email**, enable **Test Mode** and enter the ICT test mailbox. While enabled, every outgoing email (requester updates, escalations, officer notifications) goes to the test mailbox. The subject shows who it would have been sent to.
