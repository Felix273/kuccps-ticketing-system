# Installation

This guide walks you through installing the KUCCPS IT Ticketing System on your local machine for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Minimum Version | Recommended |
|-------------|-----------------|-------------|
| Node.js | 20.x | 22.x |
| npm | 9.x | 10.x |
| PostgreSQL | 14.x | 16.x |
| Git | 2.x | Latest |

## Step 1: Clone the Repository

```bash
git clone https://github.com/Felix273/kuccps-ticketing-system.git
cd kuccps-ticketing
```

## Step 2: Install Root Dependencies

```bash
npm install
```

This installs shared development dependencies like Vite, ESLint, and Tailwind CSS.

## Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

## Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
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
├── package.json
└── vite.config.js
```

## Next Steps

After installation, proceed to [Configuration](./configuration) to set up your environment variables and database.
