# Database Issues

This guide covers common database-related issues.

## Symptoms

- `PrismaClientInitializationError`
- `Connection refused` errors
- `Database is out of sync`
- Slow query performance
- Migration failures

## Common Issues

### Prisma Client Not Generated

**Symptom:** `PrismaClientInitializationError: Prisma Client could not be located`

**Resolution:**

```bash
cd backend
npx prisma generate
```

### Database Connection Refused

**Symptom:** `ECONNREFUSED` or `Connection refused`

**Resolution:**

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/database_name?schema=public"
   ```

3. Verify credentials and database exist:
   ```bash
   psql -U user -d database_name
   ```

### Schema Out of Sync

**Symptom:** `Migration failed to apply` or missing columns/tables

**Resolution:**

```bash
cd backend
npx prisma migrate dev
```

For production:

```bash
cd backend
npx prisma migrate deploy
```

### Slow Queries

**Diagnosis:**

```bash
cd backend
npx prisma studio
```

Use the Query tab to test queries and check performance.

**Resolution:**

1. Add indexes on frequently filtered fields
2. Use `select` to limit fetched columns
3. Use `include` selectively
4. Avoid `findMany` without filters on large tables

### Duplicate Ticket Numbers

**Symptom:** Two tickets have the same `ticketNumber`

**Resolution:**

The system uses a mutex to prevent this under concurrent load. If duplicates occur:

1. Check mutex implementation in `services/`
2. Ensure the server is running as a single instance (not multiple replicas without distributed locking)

### Disk Space

**Symptom:** `No space left on device`

**Resolution:**

```bash
# Check disk usage
df -h

# Clean up old uploads
find ./uploads -type f -mtime +90 -delete

# Vacuum database
sudo -u postgres psql -d kuccps_ticketing -c "VACUUM;"
```
