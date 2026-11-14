# Reverse Proxy

A reverse proxy sits between the internet and your application, handling HTTPS, routing, and security.

## Nginx Configuration

### Full Configuration

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ticketing.kuccps.ac.ke;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ticketing.kuccps.ac.ke;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ticketing.kuccps.ac.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ticketing.kuccps.ac.ke/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Frontend
    root /var/www/ticketing/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA routing - serve index.html for all non-API routes
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store";
    }

    # API proxy
    location /api {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints with stricter rate limiting
    location /api/auth {
        limit_req zone=auth burst=5 nodelay;

        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

## SSL Certificates

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d ticketing.kuccps.ac.ke

# Auto-renewal
sudo certbot renew --dry-run
```

## Cloudflare Tunnel (Alternative)

Instead of exposing your server directly, use Cloudflare Tunnel:

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Create named tunnel
cloudflared tunnel create kuccps-ticketing

# Configure tunnel
cloudflared tunnel route dns kuccps-ticketing ticketing.kuccps.ac.ke

# Run tunnel
cloudflared tunnel run kuccps-ticketing
```

Benefits:
- No open ports on your server
- DDoS protection
- Free SSL certificates
- No need to manage firewall rules

## Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```
