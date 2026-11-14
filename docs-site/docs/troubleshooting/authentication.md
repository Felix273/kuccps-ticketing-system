# Authentication Issues

This guide covers authentication and authorization issues.

## Symptoms

- Login fails with "Invalid credentials"
- "Token expired" errors
- 403 Forbidden on protected routes
- Users cannot log in after AD sync

## Login Failures

### Invalid Credentials

**Symptom:** `Invalid credentials`

**Resolution:**

1. Verify username and password are correct
2. Check `bcrypt` hash comparison in auth middleware
3. Verify `JWT_SECRET` is set and unchanged
4. Check database for the user record:

   ```bash
   cd backend
   npx prisma studio
   ```

### LDAP Authentication Failures

**Symptom:** LDAP users cannot log in

**Resolution:**

1. Verify `USE_LDAP_AUTH=true`
2. Check `LDAP_URL` uses `ldaps://` in production
3. Verify `LDAP_BIND_DN` and `LDAP_BIND_PASSWORD`
4. Check `LDAP_SEARCH_BASE` and `LDAP_SEARCH_FILTER`
5. Test LDAP connection:

   ```bash
   ldapsearch -x -H ldaps://ldap.example.ac.ke:636 -D "cn=admin,dc=example,dc=ac,dc=ke" -W
   ```

## Token Issues

### Token Expired

**Symptom:** `Token expired` or 401 on valid requests

**Resolution:**

1. Check `JWT_EXPIRES_IN` setting
2. Frontend should handle token refresh or redirect to login
3. Client should clear token on 401:

   ```javascript
   if (response.status === 401) {
     localStorage.removeItem('token');
     window.location.href = '/login';
   }
   ```

### Invalid Token

**Symptom:** 401 on requests with token

**Resolution:**

1. Verify `JWT_SECRET` has not changed
2. Check token format in `Authorization` header: `Bearer <token>`
3. Ensure token was not truncated

## Authorization Issues

### 403 Forbidden

**Symptom:** Access denied on routes that should be accessible

**Resolution:**

1. Verify user role in database
2. Check middleware application order
3. Ensure `requireStaffOrAdmin` or `requireAdmin` is applied correctly
4. Check that the user's role matches the required role

### Role Not Applied

**Symptom:** New users do not have expected permissions

**Resolution:**

1. Verify `role` field in `User` model
2. Check that role defaults are correct in `schema.prisma`
3. Verify frontend checks `currentUser.role` before rendering admin tabs

## Password Issues

### Password Not Hashing

**Symptom:** Plain-text passwords stored in database

**Resolution:**

1. Verify `bcrypt` is called before `prisma.user.create` or `update`
2. Check controller code for password hashing

### Password Comparison Failing

**Resolution:**

1. Ensure both hashing and comparison use the same `bcrypt` rounds
2. Verify password is not double-hashed
