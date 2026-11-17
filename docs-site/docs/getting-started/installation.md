# Installation

This guide walks you through installing the KUCCPS IT Ticketing System on your local machine for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Minimum Version | Recommended |
|-------------|-----------------|-------------|
| Node.js | 20.19+ (22.12+ for Vite 8) | 22.12+ |
| npm | 9.x | 10.x |
| PostgreSQL | 14.x | 16.x |
| Git | 2.x | Latest |

## Step 1: Clone the Repository

```bash
git clone https://github.com/Felix273/kuccps-ticketing-system.git
cd kuccps-ticketing
```

## Step 2: Install Backend Dependencies

```bash
cd backend
npm ci
cd ..
```

## Step 3: Install Frontend Dependencies

```bash
cd frontend
npm ci
cd ..
```

## Step 5: Verify Installation

```bash
# Verify Node.js version
node --version

# Verify npm version
npm --version

# Verify PostgreSQL is running
psql --version
```

## Project Structure After Installation

```text
kuccps-ticketing/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── scripts/
│   │   └── preflight.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
├── docs-site/          # Docusaurus documentation
├── google-addon/
│   ├── Code.gs
│   └── appsscript.json
└── PROJECT_PRESENTATION.md
```

## Next Steps

After installation, proceed to [Configuration](./configuration) to set up your environment variables and database.
