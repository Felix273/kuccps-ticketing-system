# Database Deployment

This guide covers deploying and managing the PostgreSQL database in production.

## Managed PostgreSQL (Recommended)

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Supabase** | Yes | PostgreSQL with REST API, easy setup |
| **Neon** | Yes | Serverless PostgreSQL, branching |
| **Railway** | $5/month | Integrated with Railway backend |
| **AWS RDS** | No | Enterprise-grade, managed backups |

## Self-Hosted PostgreSQL

### Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database

```bash
sudo -u postgres psql
CREATE DATABASE kuccps_ticketing;
CREATE USER kuccps_user WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE kuccps_ticketing TO kuccps_user;
\q
```

## Migrations

Run migrations on the production database:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

> **Never run `prisma migrate dev` in production.**

## Backups

### Automated Backups

Configure automated PostgreSQL backups:

```bash
# Daily backup script
0 2 * * * pg_dump -U kuccps_user kuccps_ticketing | gzip > /backups/kuccps_$(date +\%Y\%m\%d).sql.gz
```

### pg_dump

```bash
# Full backup
pg_dump -U kuccps_user -d kuccps_ticketing > backup.sql

# Compressed backup
pg_dump -U kuccps_user -d kuccps_ticketing | gzip > backup.sql.gz

# Specific tables
pg_dump -U kuccps_user -d kuccps_ticketing -t Ticket -t User > tables_backup.sql
```

### Restore

```bash
# Restore from backup
psql -U kuccps_user -d kuccps_ticketing < backup.sql

# Restore compressed
gunzip -c backup.sql.gz | psql -U kuccps_user -d kuccps_ticketing
```

### Backup Best Practices

1. **Daily automated backups** with at least 7-day retention
2. **Test restore procedures** monthly
3. **Store backups offsite** (e.g., S3, Google Cloud Storage)
4. **Back up file uploads** separately from database
5. **Document restore procedures** for disaster recovery

## Connection Pooling

For high-traffic deployments, use PgBouncer:

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure pool_mode = transaction
# Update DATABASE_URL to use PgBouncer port
```

## Monitoring

Monitor database health:
- Connection count
- Query performance
- Disk usage
- Replication lag (if using replicas)

Tools:
- `pg_stat_activity`
- `pg_stat_user_tables`
- `pg_size_pretty(pg_database_size('kuccps_ticketing'))`
