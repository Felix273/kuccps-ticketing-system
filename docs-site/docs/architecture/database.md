# Database Architecture

The database layer uses PostgreSQL with Prisma ORM for type-safe access and migration management.

## Technology Stack

| Component | Choice | Purpose |
|-----------|--------|---------|
| Database | PostgreSQL 14+ | Primary data store |
| ORM | Prisma 5 | Type-safe queries and migrations |
| Migrations | Prisma Migrate | Schema versioning |
| Seed | Prisma Seed | Initial data population |

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Ticket : "creates"
    User ||--o{ Ticket : "assigned_to"
    User ||--o{ Comment : "writes"
    User ||--o{ SavedView : "owns"
    User ||--o{ CsatResponse : "submits"
    User ||--|| NotificationPreference : "has"
    User }|--|| Department : "belongs_to"

    Department ||--o{ Ticket : "receives"
    Department ||--o{ User : "contains"
    Department ||--o{ SlaPolicy : "has"

    Ticket ||--o{ Attachment : "has"
    Ticket ||--o{ Comment : "has"
    Ticket ||--o{ TicketHistory : "tracks"
    Ticket ||--o{ CsatResponse : "receives"

    StatusIssue ||--o{ StatusIssueUpdate : "has"

    CustomForm ||--o{ CustomFormField : "contains"

    SlaPolicy }|--|| Department : "applies_to"

    User {
        string id PK
        string email UK
        string name
        string username UK
        string password
        string departmentId FK
        string role
        boolean ldapSync
        string ldapDn
        datetime createdAt
        datetime updatedAt
    }

    Department {
        string id PK
        string name UK
        string code
        datetime createdAt
        datetime updatedAt
    }

    Ticket {
        string id PK
        string ticketNumber UK
        string subject
        string description
        string emailContent
        string category
        string priority
        string status
        string requesterEmail
        string requesterName
        string departmentId FK
        string assignedToId FK
        string createdById FK
        string emailMessageId UK
        int responseTime
        int resolutionTime
        datetime slaDueAt
        boolean slaBreached
        datetime createdAt
        datetime updatedAt
        datetime resolvedAt
        datetime closedAt
    }

    Attachment {
        string id PK
        string ticketId FK
        string filename
        string filepath
        string mimetype
        int size
        datetime createdAt
    }

    Comment {
        string id PK
        string ticketId FK
        string userId FK
        string content
        boolean isInternal
        datetime createdAt
        datetime updatedAt
    }

    TicketHistory {
        string id PK
        string ticketId FK
        string field
        string oldValue
        string newValue
        string changedBy
        datetime createdAt
    }

    SystemSettings {
        string id PK
        string organizationName
        string organizationCode
        string logoUrl
        string faviconUrl
        string primaryColor
        string secondaryColor
        string supportEmail
        string noreplyEmail
        string emailFromName
        string smtpHost
        int smtpPort
        boolean smtpSecure
        string smtpUser
        string smtpPassword
        string imapHost
        int imapPort
        string imapUser
        string imapPassword
        boolean imapEnabled
        int imapPollInterval
        boolean ldapEnabled
        string ldapUrl
        string ldapBaseDn
        string ticketNumberPrefix
        string ticketNumberFormat
        string defaultPriority
        string defaultCategory
        string defaultStatus
        string googleAddonApiUrl
        boolean googleAddonEnabled
        int maxFileSize
        string allowedFileTypes
        boolean maintenanceMode
        string maintenanceMessage
        boolean darkModeEnabled
        string contrastMode
        datetime createdAt
        datetime updatedAt
    }

    EmailTemplate {
        string id PK
        string type UK
        string subject
        string html
        datetime createdAt
        datetime updatedAt
    }

    SavedView {
        string id PK
        string name
        string entity
        json filters
        json columns
        string sortBy
        string sortOrder
        string visibility
        string role
        string ownerId FK
        datetime createdAt
        datetime updatedAt
    }

    KnowledgeArticle {
        string id PK
        string title
        string slug UK
        string excerpt
        string content
        string category
        string tags
        string status
        int views
        int helpful
        int notHelpful
        string createdBy
        datetime createdAt
        datetime updatedAt
    }

    StatusIssue {
        string id PK
        string title
        string description
        string status
        string severity
        string systems
        boolean isPublic
        datetime startedAt
        datetime resolvedAt
        datetime createdAt
        datetime updatedAt
    }

    StatusIssueUpdate {
        string id PK
        string issueId FK
        string message
        string status
        boolean isPublic
        string createdBy
        datetime createdAt
    }

    CustomForm {
        string id PK
        string name
        string category
        string description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    CustomFormField {
        string id PK
        string formId FK
        string label
        string key
        string type
        boolean required
        json options
        json conditions
        int sortOrder
        datetime createdAt
        datetime updatedAt
    }

    SlaPolicy {
        string id PK
        string name
        string priority
        string category
        string departmentId FK
        int responseMinutes
        int resolutionMinutes
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    CsatResponse {
        string id PK
        string ticketId FK
        string userId FK
        int rating
        string comment
        datetime createdAt
    }

    NotificationPreference {
        string id PK
        string userId FK UK
        boolean emailOnAssignment
        boolean emailOnStatusChange
        boolean emailOnNewComment
        boolean dailyDigest
        boolean escalationAlerts
        datetime createdAt
        datetime updatedAt
    }

    EmailConfig {
        string id PK
        string provider
        string email UK
        boolean isActive
        datetime lastChecked
        datetime createdAt
        datetime updatedAt
    }
```

## Key Design Patterns

1. **Cascading Deletes:** Attachments, comments, history, and CSAT responses are deleted when their parent ticket is deleted.
2. **Soft References:** `TicketHistory.changedBy` and `KnowledgeArticle.createdBy` store user identifiers as strings, not foreign keys, preserving history even if users are deleted.
3. **JSON Fields:** `SavedView.filters`, `CustomFormField.options`, and `CustomFormField.conditions` use PostgreSQL JSON for flexible schema.
4. **Indexing:** Key fields like `email`, `username`, `ticketNumber`, `status`, `priority`, and `createdAt` are indexed for query performance.
5. **UUIDs:** All primary keys use UUIDs generated by the database for security and scalability.
