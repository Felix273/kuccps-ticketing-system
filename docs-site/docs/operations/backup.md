# Backup and Restore

This guide covers backup strategies and restore procedures for the KUCCPS IT Ticketing System.

## Database Backups

### Automated Daily Backups

Set up a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

Create `/usr/local/bin/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR=/backups/kuccps
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U kuccps_user kuccps_ticketing | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_$TIMESTAMP.sql.gz s3://kuccps-backups/
```

### Manual Backup

```bash
# Full backup
pg_dump -U kuccps_user kuccps_ticketing > db_backup.sql

# Compressed backup
pg_dump -U kuccps_user kuccps_ticketing | gzip > db_backup.sql.gz

# Specific tables
pg_dump -U kuccps_user -d kuccps_ticketing -t Ticket -t User > tables_backup.sql
```

## File Backups

Uploads are stored in the filesystem (default: `./uploads`). Back them up separately:

```bash
# Tar the uploads directory
tar -czf uploads_backup.tar.gz ./uploads

# Upload to S3
aws s3 cp uploads_backup.tar.gz s3://kuccps-backups/
```

## Restore Procedure

### Restore Database

```bash
# Stop the backend
pm2 stop kuccps-backend

# Restore from backup
gunzip -c db_backup.sql.gz | psql -U kuccps_user -d kuccps_ticketing

# Start the backend
pm2 start kuccps-backend
```

### Restore Files

```bash
# Stop the backend
pm2 stop kuccps-backend

# Restore uploads
tar -xzf uploads_backup.tar.gz

# Set permissions
chown -R www-data:www-data ./uploads

# Start the backend
pm2 start kuccps-backend
```

## Disaster Recovery Plan

1. **RTO (Recovery Time Objective):** 2 hours
2. **RPO (Recovery Point Objective):** 24 hours (daily backups)
3. **Testing:** Monthly restore tests on staging environment

### Recovery Steps

1. Provision new server or restore existing
2. Install Node.js, PostgreSQL, and dependencies
3. Restore database from latest backup
4. Restore file uploads
5. Configure environment variables
6. Deploy backend and frontend
7. Run migrations if needed
8. Verify health check
9. Test core functionality
10. Update DNS if server IP changed

## Offsite Backups

Store backups in a different physical location:

- AWS S3 with versioning
- Google Cloud Storage
- Offsite SFTP server
- Encrypted email attachments (for small databases)

Encrypt sensitive backups:

```bash
# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 db_backup.sql.gz

# Decrypt
gpg --decrypt db_backup.sql.gz.gpg > db_backup.sql.gz
```
