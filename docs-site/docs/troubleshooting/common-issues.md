# Common Issues

This guide covers common issues encountered when running or deploying the KUCCPS IT Ticketing System.

## Issue Categories

- [CORS Issues](./cors)
- [Database Issues](./database)
- [Email Issues](./email)
- [Authentication Issues](./authentication)
- [Deployment Issues](./deployment)

## Quick Diagnostics

### Check Backend Health

```bash
curl http://localhost:5000/health
```

### Check Frontend Build

```bash
cd frontend
npm run build
npm run preview
```

### Check Database Connection

```bash
cd backend
npx prisma studio
```

### Check Logs

```bash
# Backend logs
cd backend
node src/server.js

# PM2 logs
pm2 logs kuccps-backend

# Docker logs
docker logs kuccps-backend
```

### Check Environment Variables

```bash
# Backend
cd backend
node -e "require('dotenv').config(); console.log(process.env)"

# Frontend
cd frontend
node -e "console.log(import.meta.env)"
```

## Diagnostic Checklist

When troubleshooting, verify:

1. [ ] Backend is running on expected port
2. [ ] Frontend `VITE_API_URL` points to correct backend URL
3. [ ] `DATABASE_URL` is correct and database is accessible
4. [ ] `JWT_SECRET` is set and unchanged
5. [ ] CORS `FRONTEND_URL` includes the current frontend origin
6. [ ] SSL certificates are valid (production)
7. [ ] Firewall allows necessary ports
8. [ ] PostgreSQL is running and accepting connections
9. [ ] No `.env` file typos or missing values
10. [ ] Prisma Client is generated: `npx prisma generate`
