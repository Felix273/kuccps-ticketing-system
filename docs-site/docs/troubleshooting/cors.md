# CORS Issues

This guide covers Cross-Origin Resource Sharing (CORS) issues and their resolution.

## Symptoms

- Browser console shows: `No 'Access-Control-Allow-Origin' header is present`
- Frontend requests fail with `TypeError: Failed to fetch`
- Network tab shows CORS error on preflight requests

## Causes

### Missing Origin in CORS Config

The backend only allows origins listed in `CORS_ORIGINS` or `FRONTEND_URL`.

```env
# Correct
FRONTEND_URL=http://localhost:5173,http://localhost:5174

# Wrong - missing port or wrong origin
FRONTEND_URL=http://localhost:5173
```

### Wildcard Origin in Production

`validateProductionConfig()` rejects wildcard CORS origins when `NODE_ENV=production`.

```env
# Wrong in production
FRONTEND_URL=*

# Correct in production
FRONTEND_URL=https://ticketing.kuccps.ac.ke
```

### HTTP vs HTTPS Mismatch

If the frontend is served over HTTPS and the backend over HTTP, the browser considers them different origins.

```env
# Frontend
VITE_API_URL=https://api.kuccps.ac.ke/api

# Backend
FRONTEND_URL=https://ticketing.kuccps.ac.ke
```

## Resolution Steps

1. **Check the browser console** for the exact origin being blocked.
2. **Verify `FRONTEND_URL`** in `backend/.env` includes the frontend origin.
3. **Restart the backend** after changing `.env`.
4. **Check for typos** in the origin URL (protocol, host, port).
5. **Verify reverse proxy** is forwarding the correct `Host` header.

## Testing CORS

```bash
# Test preflight request
curl -X OPTIONS http://localhost:5000/api/tickets \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Expected response headers:

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

## Nginx CORS Headers

If using Nginx as a reverse proxy, ensure it passes the `Origin` header:

```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
