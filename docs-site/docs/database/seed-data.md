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

### Users

| Username | Password | Name | Role | Department |
|----------|----------|------|------|-----------|
| `admin` | `admin123` | System Administrator | `admin` | ICT |
| `itstaff` | `staff123` | IT Staff | `staff` | ICT |

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

- **Never run `db seed` in production** — it will create duplicate records or overwrite existing data.
- **Change default passwords immediately** after seeding.
- **Use environment-specific seed scripts** for staging and production if needed.
