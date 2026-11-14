# Backend Deployment

This guide covers deploying the Node.js/Express backend to production.

## Platform Options

| Platform | Pros | Cons |
|----------|------|------|
| **Railway** | Easy deployment, PostgreSQL included, auto-scaling | Higher cost at scale |
| **Render** | Free tier, easy setup | Cold starts on free tier |
| **VPS (Ubuntu)** | Full control, cost-effective | Manual setup and maintenance |
| **Docker** | Consistent environment, portable | Requires container knowledge |
| **AWS EC2 / GCP** | Scalable, enterprise-grade | Complex setup |

## Environment Variables

Set all environment variables in your deployment platform's dashboard:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/kuccps_ticketing
JWT_SECRET=<strong-secret-here>
PUBLIC_TICKET_API_KEY=<strong-key-here>
REQUIRE_PUBLIC_TICKET_API_KEY=true
FRONTEND_URL=https://ticketing.kuccps.ac.ke
CORS_ORIGINS=https://ticketing.kuccps.ac.ke
EMAIL_SERVICE=gmail
EMAIL_USER=itsupport@kuccps.ac.ke
EMAIL_PASSWORD=<app-password>
SUPPORT_EMAIL=itsupport@kuccps.ac.ke
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=itsupport@kuccps.ac.ke
IMAP_PASSWORD=<app-password>
```

## Railway Deployment

1. Create a new project on Railway
2. Connect your GitHub repository
3. Select the `backend` directory as the root
4. Add PostgreSQL plugin
5. Set environment variables
6. Deploy

Railway automatically runs `npm install` and `npm start`.

## Docker Deployment

Create a `Dockerfile` in `backend/`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t kuccps-backend ./backend
docker run -p 5000:5000 --env-file backend/.env kuccps-backend
```

## PM2 (VPS)

For process management on a VPS:

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name kuccps-backend
pm2 save
pm2 startup
```

## Health Checks

Configure your platform to check `/health`:

```bash
curl https://api.kuccps.ac.ke/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "KUCCPS Ticketing System API is running"
}
```

## Logs

In production, logs should include request IDs for tracing:

```javascript
console.error('Unhandled request error:', { requestId: req.id, message: err.message });
```

Redirect logs to a file or logging service (e.g., Papertrail, Logflare).
