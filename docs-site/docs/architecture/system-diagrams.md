# Schema Diagram and Data Flow

## Database Schema Diagram (Normalized)

```mermaid
erDiagram
    Department ||--o{ User : contains
    Department ||--o{ Ticket : receives
    Department ||--o{ SlaPolicy : has

    User ||--o{ Ticket : "creates"
    User ||--o{ Ticket : "assigned_to"
    User ||--o{ Comment : writes
    User ||--o{ SavedView : owns
    User ||--o{ CsatResponse : submits
    User ||--|| NotificationPreference : has
    User }|--|| Department : "belongs_to"
    User }o--o{ AccessRole : "has role"
    AccessRole }o--o{ AccessPermission : grants
    UserRole ||--|| User : belongs_to
    UserRole ||--|| AccessRole : belongs_to
    RolePermission ||--|| AccessRole : belongs_to
    RolePermission ||--|| AccessPermission : grants

    Ticket ||--o{ Attachment : has
    Ticket ||--o{ Comment : has
    Ticket ||--o{ TicketHistory : tracks
    Ticket ||--o{ CsatResponse : receives
    Ticket ||--o{ Notification : triggers

    StatusIssue ||--o{ StatusIssueUpdate : has
    StatusIssue }o--o{ StatusSystem : affects
    StatusIssueSystem ||--|| StatusIssue : belongs_to
    StatusIssueSystem ||--|| StatusSystem : references

    CustomForm ||--o{ CustomFormField : contains
    SlaPolicy }|--|| Department : "applies_to"
    SlaPolicy ||--o{ SlaPolicyAudit : audits
    SlaPolicyAudit }|--|| SlaPolicy : references

    Notification ||--|| User : targets
    Notification ||--o{ Ticket : references

    KnowledgeArticle ||--o{ KnowledgeRevision : has
    KnowledgeArticle ||--o{ KnowledgeFeedback : receives
    KnowledgeArticle }o--o{ KnowledgeTag : tagged_with
    KnowledgeArticleTag ||--|| KnowledgeArticle : belongs_to
    KnowledgeArticleTag ||--|| KnowledgeTag : references
    KnowledgeArticle }o--o{ KnowledgeArticle : related_to
    KnowledgeArticleRelation ||--|| KnowledgeArticle : from
    KnowledgeArticleRelation ||--|| KnowledgeArticle : to
    KnowledgeArticleRelatedReference ||--|| KnowledgeArticle : belongs_to

    SystemSettings ||--o{ SystemSettingsAllowedFileType : allows
    SystemSettingsAllowedFileType ||--|| SystemSettings : belongs_to
```

## Data Flow Diagram

```mermaid
flowchart TD
    subgraph Clients
        A[Browser / Web App]
        B[Google Workspace Add-on]
    end

    subgraph Frontend
        C[React + Vite SPA]
    end

    subgraph Backend
        D[Express 5 API]
        E[JWT Auth Middleware]
        F[Rate Limiting / CORS / Security]
        G[Controllers & Services]
    end

    subgraph Background
        H[Email Service - Nodemailer]
        I[IMAP Monitoring]
        J[LDAP / AD Sync]
        K[Scheduler - node-cron]
    end

    subgraph Data
        L[PostgreSQL]
        M[Prisma ORM]
        N[File Storage]
    end

    A --> C
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    G --> M
    G --> H
    G --> I
    G --> J
    G --> K
    M --> L
    G --> N
```

## Key Data Flows

### Ticket Creation
```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database
    participant Email

    User->>Frontend: Submit ticket form
    Frontend->>Backend: POST /api/public/tickets
    Backend->>Backend: Validate API key
    Backend->>Backend: Generate ticket number
    Backend->>Database: Create ticket record
    Database-->>Backend: Ticket created
    Backend->>Email: Send confirmation email
    Backend-->>Frontend: Return ticket details
    Frontend-->>User: Display ticket number
```

### Ticket Update and Notification
```mermaid
sequenceDiagram
    actor Agent
    participant Frontend
    participant Backend
    participant Database
    participant Email

    Agent->>Frontend: Update ticket status
    Frontend->>Backend: PUT /api/tickets/:id
    Backend->>Database: Update ticket + history
    Backend->>Backend: Check notification preferences
    Backend->>Email: Send status change email
    Backend-->>Frontend: Return updated ticket
    Frontend-->>Agent: Show updated status
```

### Email Processing
```mermaid
sequenceDiagram
    participant IMAP
    participant Backend
    participant Database
    participant Email

    IMAP->>Backend: Poll support mailbox
    Backend->>Backend: Parse incoming email
    Backend->>Database: Create/update ticket or comment
    Backend->>Email: Send reply/confirmation
```

### Knowledge Base Operations
```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Search article
    Frontend->>Backend: GET /api/knowledge/search
    Backend->>Database: Query articles + tags
    Database-->>Backend: Article list
    Backend-->>Frontend: Results
    Frontend-->>User: Display articles
```
