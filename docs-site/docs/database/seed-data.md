# Seed Data

The seed script populates the database with default data for local development and testing.

## Running the Seed Script

```bash
cd backend
npx prisma db seed
```

## Seed Contents

The seed script creates the following data:

### Department

| Field | Value |
|-------|-------|
| `name` | ICT |
| `code` | ICT |

### Administrator account

The seed creates an administrator only when the database has no administrator. Configure
`BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, and
`BOOTSTRAP_ADMIN_PASSWORD` in the environment before seeding a new production database.
The password must be at least 16 characters and include uppercase, lowercase, and numeric
characters. The seed does not create a default staff account.

### System Settings

Default settings are created if none exist:

| Setting | Default Value |
|---------|---------------|
| `organizationName` | KUCCPS IT Support |
| `organizationCode` | KUCCPS |
| `primaryColor` | #911414 |
| `secondaryColor` | #d20001 |
| `supportEmail` | itsupport@kuccps.ac.ke |
| `noreplyEmail` | noreply@kuccps.ac.ke |
| `emailFromName` | KUCCPS IT Support |
| `ticketNumberPrefix` | TICK |
| `ticketNumberFormat` | YYYYMMDD-XXXX |
| `defaultPriority` | Medium |
| `defaultCategory` | General Issues |
| `defaultStatus` | Open |
| `maxFileSize` | 10485760 |
| `allowedFileTypes` | jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip |
| `darkModeEnabled` | false |
| `contrastMode` | normal |

### Email Templates

Default email templates are created for:

- **ticketCreated:** Ticket creation confirmation
- **ticketUpdated:** Ticket status/priority change notification
- **ticketResolved:** Resolution notification and CSAT request

## Seed Script Location

**File:** `backend/prisma/seed.js`

The seed script is defined in `backend/package.json`:

```json
{
  "prisma": {
    "seed": "node ./prisma/seed.js"
  }
}
```

## Customizing Seed Data

To customize seed data, edit `backend/prisma/seed.js`. You can add additional users, departments, or settings as needed for your environment.

## Production Considerations

- Review and back up the production database before seeding.
- Seed a fresh database once, with bootstrap credentials provided through a protected environment.
- Remove the bootstrap password from the deployment environment after the initial administrator exists.
- The seed uses upserts for default data and does not replace existing administrator accounts.
