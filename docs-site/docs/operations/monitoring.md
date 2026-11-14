# Monitoring

This guide covers monitoring the health and performance of the KUCCPS IT Ticketing System.

## Health Check

### Endpoint

```http
GET /health
```

### Response

```json
{
  "status": "OK",
  "message": "KUCCPS Ticketing System API is running"
}
```

### Monitoring Tools

Use external monitoring services to check the health endpoint:

| Tool | Setup |
|------|-------|
| **UptimeRobot** | Free HTTP monitor |
| **Pingdom** | Advanced monitoring with alerts |
| **Datadog** | Full-stack observability |
| **Grafana + Prometheus** | Self-hosted metrics |

## Application Metrics

### Key Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| API response time | Average request latency | > 500ms |
| Error rate | 5xx responses per minute | > 5 |
| Ticket creation rate | Tickets created per hour | Anomaly detection |
| Active users | Concurrent authenticated users | N/A |
| Database connections | Active DB connections | > 80% of pool |
| Disk usage | Upload directory size | > 80% |

### Logging

Log important events with request IDs:

```javascript
console.error('Unhandled request error:', { requestId: req.id, message: err.message });
```

Log format should include:
- Timestamp
- Request ID
- Log level (info, warn, error)
- Message
- Context (user ID, ticket ID, etc.)

## Database Monitoring

### Connection Count

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'kuccps_ticketing';
```

### Slow Queries

Enable slow query logging in `postgresql.conf`:

```conf
log_min_duration_statement = 1000  # Log queries > 1s
```

### Table Size

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname, tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname, tablename) DESC;
```

## Email Monitoring

Monitor email delivery:

- Check SMTP logs for bounces and failures
- Monitor IMAP connection health
- Track email queue depth
- Alert on consecutive failed sends

## Alerting

Set up alerts for:

1. **Critical:** Health check failure, database down, error rate spike
2. **Warning:** High response time, approaching disk capacity, failed email sends
3. **Info:** Daily digest sent, backup completed

### Alert Channels

- Email to administrators
- Slack/Discord webhook
- SMS for critical alerts
- PagerDuty for on-call escalation
