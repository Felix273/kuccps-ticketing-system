---
title: Team Action Items — Status
---

# Team Action Items: Status

Status of each item in *Key Points and Action Items* after the implementation work, with the team's decisions and the research items' conclusions.

**Legend:** ✅ done · ⏸ deferred by the team · ✖ removed by the team · 📄 assessment

## 1. Ticket lifecycle and status management

| Item | Status | Notes |
| --- | --- | --- |
| Resolved vs Closed | ✅ | Resolving closes the ticket immediately; it does not wait for a rating. See [Ticket Lifecycle](ticket-lifecycle.md). |
| Closed tickets in the graph | ✅ | Dashboard counts and charts are calculated on the server. A resolved ticket moves straight into Closed. |
| On Hold | ✅ | A reason is required and emailed to the requester. The SLA clock pauses, and deadlines are moved back on resume. |

## 2. User feedback and satisfaction

| Item | Status | Notes |
| --- | --- | --- |
| Feedback form after resolution | ✅ | Rating buttons in the resolution email and in the Gmail add-on. Comments are saved. |
| Built-in rating vs external tool | ✅ | Built in; no external tool needed. |
| Resolution rating record for officers | ✅ | Effectiveness (1–5), whether reusable, and recommendations, captured when resolving. |
| Knowledge tip after resolution | ✅ | The officer can attach a published knowledge-base article; its summary is included in the resolution email. |
| How feedback is presented | ✅ | Customer Feedback panel: weekly trend, response rate, per-officer and per-category averages, low ratings to follow up. |

## 3. SLA, timers and automatic escalation

| Item | Status | Notes |
| --- | --- | --- |
| Service Charter as the basis | ✅ | Categories are now the Charter services, so Charter timelines apply. Previously no category matched, so tickets had no SLA. |
| Timelines per category/priority | ✅ | Editable in *Settings → SLA Timelines*. |
| Automatic escalation | ✅ | Warning at 75% (configurable); escalation at the deadline, for all priorities. |
| Who receives escalations | ✅ | Administrators, the assigned officer, and the configured escalation email addresses. |
| Email the expected timeframe; update on change | ✅ | In the acknowledgement and every relevant update. |

## 4. Officer scheduling

✖ **Removed by the team.**

## 5. Activity log and audit trail

✅ Every lifecycle event is recorded with the officer's name, a timestamp and a note, and the Audit Trail tab now shows it. Previously the tab showed three placeholder entries.

## 6. Internal notes

✅ They are stored in the `Comment` table (`isInternal = true`) and visible only to ICT staff. They serve as both officer coordination and part of the permanent ticket record. See [Ticket Lifecycle → Internal notes](ticket-lifecycle.md#internal-notes).

## 7. Knowledge base

| Item | Status | Notes |
| --- | --- | --- |
| Upload documents, images, screenshots, guides, raw data | ✅ | **Upload Document** in the Knowledge Base: PDF, Word, text, Markdown, CSV/JSON, logs, PNG/JPG/WebP, up to 15 MB. |
| Who can contribute | ✅ | ICT officers and administrators. Requesters cannot contribute directly; they can rate articles. |
| Approval and moderation | ✅ | Officers' articles and uploads go to the administrator **Review Queue**; administrators' contributions publish directly. Reusable resolutions create drafts in the same queue. |

## 8. Dashboard and reporting

✅ Clickable cards, status graph, and server-side aggregates.

## 9. Communication and notifications

✅ Emails are sent for received, assigned, investigating, escalated, on hold, resumed, resolved/closed and reopened. Each includes the expected resolution time where relevant and states whether the requester needs to act. See the table in [Ticket Lifecycle](ticket-lifecycle.md#what-the-requester-is-told).

## 10. WhatsApp chatbot — 📄 assessment

**Recommendation: do not build it now.**

- **Technically feasible:** the notification layer could take a WhatsApp channel, using the Meta WhatsApp Business Platform or Twilio.
- **Prerequisites the system doesn't have:** requester phone numbers and opt-in consent, a dedicated business number, Meta business verification, and pre-approved message templates.
- **Cost:** charged per conversation or message, so costs grow with ticket volume.
- **Email already works:** the email channel and the Gmail add-on already cover ticket creation, status updates and feedback for an internal staff helpdesk.
- **If a mobile channel is needed later:** SMS through a local provider such as Africa's Talking is more predictable in cost and needs no Meta verification.

## 11. System configuration and access

| Item | Status | Notes |
| --- | --- | --- |
| Remove User Management | ⏸ | Deferred until Active Directory is fully configured. Users are read-only today; editing is disabled. |
| Settings and RBAC revamp | ✅ | Four plain-language roles (Administrator, ICT Manager, ICT Officer, Viewer) with task-based permissions enforced everywhere. Settings cut to what the system uses. See [Roles, Access and Settings](roles-and-settings.md). |
| Admin setup from Active Directory | ⏸ | Deferred until AD is configured. Admins are currently the local bootstrap account and those assigned in Access Control. |
| AD relationship review | ⏸ | Part of the AD configuration work. |
| Dedicated ICT test mailbox | ✅ system side | **Email Test Mode** redirects all outgoing email to a test address. ICT still needs to create the mailbox. |

## 12. Technical documentation

✅ Done. This page and [Ticket Lifecycle](ticket-lifecycle.md) document the new behaviour.

## 13. PostgreSQL → MySQL — 📄 assessment

**Recommendation: stay on PostgreSQL.** The benefit is organisational uniformity, but the migration risk and rework are significant and the system gains nothing functionally.

| Criterion | Finding |
| --- | --- |
| Compatibility | Prisma supports MySQL, but the system uses PostgreSQL-specific features: native enums, case-insensitive search (`mode: 'insensitive'`), `ON CONFLICT` upserts (rate limiting), `FILTER` aggregates and time-zone conversion (dashboards and reports), and `make_interval`. These would need rewriting and retesting. |
| Migration complexity | High. All 22 migrations would have to be regenerated for MySQL, raw SQL rewritten, data exported and imported with enum and timestamp conversion, and every feature regression-tested. |
| Data integrity | PostgreSQL's transactional DDL and strict typing protect migrations and data. A MySQL move risks collation, case-sensitivity and timestamp-precision differences, for example in duplicate detection and unique emails. |
| Performance | Neither database would be a bottleneck at KUCCPS helpdesk volumes. |
| Security | Equivalent when configured properly (TLS, least-privilege accounts). Credentials are already encrypted at the application level. |
| Backup and recovery | Both are mature (`pg_dump`/PITR vs `mysqldump`/binlog). The existing runbooks are written for PostgreSQL. |
| Organisational expertise | This is the main argument for MySQL. Mitigation: the existing backup runbook plus a short PostgreSQL operations hand-over for ICT. |
| Long-term maintenance | Staying avoids a second set of database-specific code paths. |
| Downtime | A cut-over would need a maintenance window plus a freeze period for verification. |

**Proceed only if** an organisational standard mandates MySQL. In that case, plan it as a separate project: regenerate migrations, rewrite the raw queries listed above, run a full regression on a staging copy of production data, then do a single cut-over with a rollback plan.

## Notes on earlier answers in the action-items document

Two answers in the original document described the system inaccurately and should not be carried into documentation:

- **Closing without feedback:** the document said tickets could not be closed until feedback was submitted. No such check ever existed. The agreed behaviour is now that resolving closes immediately.
- **Dashboard charts:** the document listed several dashboard charts and line numbers (for example `ActiveVsResolvedChart` and `ResolutionRateChart`) that are not in the dashboard.
