# Maintenance

This guide covers routine maintenance tasks for the KUCCPS IT Ticketing System.

## Daily Tasks

- [ ] Review open and overdue tickets
- [ ] Check failed email sends in logs
- [ ] Review critical tickets approaching SLA breach
- [ ] Verify backup completion
- [ ] Monitor system health endpoint

## Weekly Tasks

- [ ] Review database backup logs
- [ ] Check knowledge base article usefulness (ratings/views)
- [ ] Review user and department changes
- [ ] Review status issue history
- [ ] Check disk space for uploads directory
- [ ] Review error logs for patterns

## Monthly Tasks

- [ ] Rotate secrets where appropriate (`JWT_SECRET`, API keys)
- [ ] Update npm dependencies after testing
- [ ] Review audit logs and ticket history
- [ ] Test restore procedures
- [ ] Review SLA policy performance
- [ ] Clean up old attachments if storage is constrained
- [ ] Review and update documentation

## Dependency Updates

```bash
# Backend
cd backend
npm outdated
npm update

# Frontend
cd frontend
npm outdated
npm update

# Check for vulnerabilities
cd backend && npm audit
cd frontend && npm audit
```

## Database Maintenance

### Vacuum Analyze

```bash
sudo -u postgres psql -d kuccps_ticketing -c "VACUUM ANALYZE;"
```

### Reindex

```bash
sudo -u postgres psql -d kuccps_ticketing -c "REINDEX DATABASE kuccps_ticketing;"
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname, tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname, tablename) DESC;
```

## Log Rotation

Configure log rotation for application logs:

```bash
# /etc/logrotate.d/kuccps-ticketing
/var/log/kuccps-ticketing/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload kuccps-backend
    endscript
}
```

## Performance Tuning

### Database Indexes

Monitor slow queries and add indexes as needed:

```sql
EXPLAIN ANALYZE SELECT * FROM "Ticket" WHERE "status" = 'Open' AND "createdAt" > NOW() - INTERVAL '30 days';
```

### Prisma Query Optimization

- Use `select` to fetch only needed columns
- Use `include` selectively for relations
- Avoid N+1 queries by using `include` or separate `findMany` calls
