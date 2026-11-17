# Development Setup

This guide covers setting up the development environment, running the application, and preparing the database.

## Prerequisites Check

```bash
# Check Node.js (v20.19+ or v22.12+ required; use v22.12+ for production)
node --version

# Check npm (v9+ required)
npm --version

# Check PostgreSQL (v14+ required)
psql --version
```

## Step 1: Prepare the Database

Start PostgreSQL and create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kuccps_ticketing;
\q
```

## Step 2: Configure Environment Variables

Follow the [Configuration](./configuration) guide to set up:
- `backend/.env` — database URL, JWT secret, API key
- `frontend/.env` — API base URL

## Step 3: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This generates the Prisma Client based on `schema.prisma`.

## Step 4: Run Database Migrations

```bash
cd backend
npx prisma migrate dev
```

For production:

```bash
cd backend
npx prisma migrate deploy
```

## Step 5: Run Preflight Checks

```bash
cd backend
npm run preflight
```

The preflight script validates required configuration and the production runtime version.
It does not connect to PostgreSQL; successful Prisma migration and seed commands verify
database connectivity.

## Step 6: Seed the Database

```bash
cd backend
npx prisma db seed
```

This creates:

| Entity | Details |
|--------|---------|
| Department | ICT department |
| Admin user | Created only when bootstrap admin environment variables are set and no admin exists |
| Default settings | Organization name, colors, SMTP defaults |
| Email templates | Ticket lifecycle templates |

> The login page's demo-account shortcuts are available only in the Vite development build.
> Create the administrator using the bootstrap environment variables; there are no default
> production credentials.

## Step 7: Start the Backend

```bash
cd backend
npm start
```

The API starts on `http://localhost:5000`.

Verify it is running:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "KUCCPS Ticketing System API is running"
}
```

## Step 8: Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend starts on `http://localhost:5173` or `http://localhost:5174`.

## Step 9: Access the Application

Open `http://localhost:5173` in your browser and log in with the administrator account
configured through `BOOTSTRAP_ADMIN_*` before seeding.

## Available Scripts

| Command | Directory | Purpose |
|---------|-----------|---------|
| `npm start` | `backend/` | Start Express server |
| `npm run dev` | `frontend/` | Start Vite dev server |
| `npm run build` | `frontend/` | Build for production |
| `npm run preview` | `frontend/` | Preview production build |
| `npm run lint` | `frontend/` | Run ESLint |
| `npx prisma studio` | `backend/` | Open Prisma database browser |
| `npx prisma migrate dev` | `backend/` | Create and apply migrations |
| `npx prisma db seed` | `backend/` | Seed database with default data |

## Hot Reloading

- **Backend:** Changes to `server.js` and route files require a server restart.
- **Frontend:** Vite provides instant hot module replacement (HMR) for React components.

## Database Browser

Use Prisma Studio to view and edit data:

```bash
cd backend
npx prisma studio
```

This opens a web UI at `http://localhost:5555`.
