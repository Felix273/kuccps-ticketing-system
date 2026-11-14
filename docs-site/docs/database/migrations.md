# Migrations

Prisma Migrate manages database schema changes through versioned migration files.

## Migration Files

Migrations are stored in `backend/prisma/migrations/` with timestamp-based naming:

```text
backend/prisma/migrations/
├── 20250101000000_init/
│   └── migration.sql
├── 20250102000000_add_email_templates/
│   └── migration.sql
└── ...
```

## Creating Migrations

```bash
cd backend
npx prisma migrate dev --name descriptive_change_name
```

This command:
1. Saves the migration SQL to `migrations/`
2. Applies the migration to your local database
3. Regenerates the Prisma Client

## Migration SQL

Migration files contain raw SQL that transforms the schema:

```sql
-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
```

## Applying Migrations

### Development

```bash
cd backend
npx prisma migrate dev
```

### Production

```bash
cd backend
npx prisma migrate deploy
```

> **Important:** Never use `prisma migrate dev` in production. It creates new migration files, which should only happen during development.

## Resetting the Database

```bash
cd backend
npx prisma migrate reset
```

This drops the database, recreates it, applies all migrations, and runs the seed script. Use with caution in production.

## Migration Best Practices

1. **Meaningful names:** Use descriptive migration names.
2. **Review SQL:** Always review generated SQL before applying.
3. **Test locally:** Verify migrations work on a copy of production data.
4. **Backup first:** Always backup before running migrations in production.
5. **Idempotent scripts:** Ensure migrations can be re-run if needed.
