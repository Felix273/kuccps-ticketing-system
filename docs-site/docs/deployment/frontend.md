# Frontend Deployment

This guide covers deploying the React frontend to production.

## Build Process

```bash
cd frontend
npm install
npm run build
```

The build output is in `frontend/dist/`.

## Deployment Options

| Platform | Pros | Cons |
|----------|------|------|
| **Vercel** | Zero-config, preview deployments, edge network | Requires Git integration |
| **Netlify** | Drag-and-drop, form handling, edge functions | Similar to Vercel |
| **Cloudflare Pages** | Free tier, global CDN, Pages Functions | Smaller ecosystem |
| **Nginx (VPS)** | Full control, cost-effective | Manual setup |

## Vercel Deployment

1. Push your code to GitHub
2. Create a new project on Vercel
3. Import the repository
4. Set the **Root Directory** to `frontend/`
5. Add environment variable:
   ```
   VITE_API_URL=https://api.kuccps.ac.ke/api
   ```
6. Click **Deploy**

## Netlify Deployment

1. Build the project: `npm run build`
2. Drag the `dist/` folder to Netlify
3. Or connect Git repository and configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Set environment variable `VITE_API_URL`

## Nginx (VPS)

```nginx
server {
    listen 80;
    server_name ticketing.kuccps.ac.ke;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ticketing.kuccps.ac.ke;

    ssl_certificate /etc/letsencrypt/live/ticketing.kuccps.ac.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ticketing.kuccps.ac.ke/privkey.pem;

    root /var/www/ticketing/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables in Production

Set `VITE_API_URL` to the production backend URL:

```env
VITE_API_URL=https://api.kuccps.ac.ke/api
```

> **Important:** Variables prefixed with `VITE_` are exposed to the browser. Never store secrets in frontend environment variables.

## SPA Routing

The frontend is a single-page application. Configure your server to serve `index.html` for all routes:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This ensures client-side routing works correctly.

## Caching

Static assets should be cached aggressively:

```nginx
location ~* \.(js|css|png|jpg|svg|ico|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

`index.html` should not be cached to ensure updates are served immediately.
