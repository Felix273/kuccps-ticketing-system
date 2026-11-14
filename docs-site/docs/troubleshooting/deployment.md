# Deployment Issues

This guide covers common deployment-related issues.

## Symptoms

- 502 Bad Gateway
- 503 Service Unavailable
- Health check fails
- Frontend shows blank page
- API calls return CORS errors in production

## 502/503 Errors

**Symptom:** Reverse proxy returns 502 or 503

**Resolution:**

1. Verify backend is running:
   ```bash
   curl http://localhost:5000/health
   ```

2. Check backend process:
   ```bash
   # PM2
   pm2 status
   pm2 logs kuccps-backend
   
   # Docker
   docker ps
   docker logs kuccps-backend
   ```

3. Verify Nginx proxy configuration:
   ```bash
   nginx -t
   sudo systemctl reload nginx
   ```

## Health Check Failures

**Symptom:** `/health` returns non-200 status

**Resolution:**

1. Check database connectivity
2. Verify `DATABASE_URL` is correct
3. Check for Prisma connection pool exhaustion
4. Review application logs for startup errors

## Blank Frontend Page

**Symptom:** Frontend loads but shows blank page

**Resolution:**

1. Check browser console for JavaScript errors
2. Verify `VITE_API_URL` is correct
3. Check that `index.html` is served correctly
4. Verify SPA routing configuration in Nginx:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

## SSL Certificate Issues

**Symptom:** `ERR_SSL_PROTOCOL_ERROR` or certificate warnings

**Resolution:**

1. Verify certificate files exist:
   ```bash
   ls -la /etc/letsencrypt/live/ticketing.kuccps.ac.ke/
   ```

2. Check certificate expiry:
   ```bash
   openssl x509 -in /etc/letsencrypt/live/ticketing.kuccps.ac.ke/cert.pem -noout -dates
   ```

3. Renew certificate:
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

## Process Management Issues

### PM2 Crashes

**Resolution:**

```bash
pm2 restart kuccps-backend
pm2 logs kuccps-backend --lines 100
```

### Docker Container Exits

**Resolution:**

```bash
docker logs kuccps-backend
docker ps -a
```

Check for:
- Missing environment variables
- Port conflicts
- Database connection failures

## Cloudflare Tunnel Issues

**Symptom:** Tunnel connection drops

**Resolution:**

1. Verify tunnel is running:
   ```bash
   cloudflared tunnel info kuccps-ticketing
   ```

2. Check tunnel routes:
   ```bash
   cloudflared tunnel route dns list
   ```

3. Restart tunnel:
   ```bash
   cloudflared tunnel run kuccps-ticketing
   ```

## Environment Variable Issues

**Symptom:** Application starts but features don't work

**Resolution:**

1. Compare deployed `.env` with local `.env`
2. Verify no typos in variable names
3. Ensure secrets are properly escaped (no unescaped quotes)
4. Check for duplicate keys in `.env`
