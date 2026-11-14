# Database Overview

The database layer uses PostgreSQL with Prisma ORM for type-safe access, migrations, and seeding.

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | PostgreSQL | Primary data store |
| ORM | Prisma 5 | Type-safe database access |
| Migrations | Prisma Migrate | Schema version control |
| Seeding | Prisma Seed | Initial data population |
| Browser | Prisma Studio | Visual database browser |

## Connection

The database connection is configured via `DATABASE_URL` in `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kuccps_ticketing?schema=public"
```

Prisma connects to the database using this URL and manages connection pooling automatically.

## Prisma Client

The Prisma Client is generated from the schema:

```bash
cd backend
npx prisma generate
```

The generated client provides a type-safe API:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tickets = await prisma.ticket.findMany({
  where: { status: 'Open' },
  include: { assignedTo: true, department: true }
});
```

## Migrations

Migrations are managed through Prisma Migrate:

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name description_of_change

# Apply migrations in development
cd backend
npx prisma migrate dev

# Apply migrations in production
cd backend
npx prisma migrate deploy
```

## Seeding

Seed data is defined in `backend/prisma/seed.js`:

```bash
cd backend
npx prisma db seed
```

The seed script creates default data for local development.

## Prisma Studio

Prisma Studio provides a visual interface for browsing and editing data:

```bash
cd backend
npx prisma studio
```

This opens a web UI at `http://localhost:5555`.
