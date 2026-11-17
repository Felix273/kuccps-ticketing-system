# AlmaLinux Production Deployment Runbook

This runbook deploys the React SPA, Express API, and PostgreSQL on one AlmaLinux VPS.
It assumes a single application instance, Nginx as the public HTTPS reverse proxy, and
one public frontend hostname. Replace example hostnames, emails, and paths with approved
production values. Do not put real passwords or keys in source control or this document.

## Partitioning and storage

The application has **no requirement for partitioned PostgreSQL tables**. Use regular
PostgreSQL tables and the checked-in Prisma migrations. Partitioning disk volumes is an
OS/storage decision, not an application setup step.

Recommended mount points (use LVM or the organization's storage standard):

| Mount/path | Use | Sizing guidance |
|---|---|---|
| `/` | AlmaLinux, packages, logs | Keep OS space separate from growing application data. |
| PostgreSQL data volume mounted at `/var/lib/pgsql` | Database | Size for current data, indexes, growth, and free-space headroom. |
| `/var/lib/kuccps-ticketing` | Uploaded ticket and knowledge-base files | Size from expected attachment volume and retention. |
| `/var/backups` or a separate backup volume | Short-term backup staging | Must not be the only backup copy; send backups off-host. |
| `/var/www/kuccps-ticketing` | Built static frontend | Usually small; keep previous release for rollback. |

Provision and mount separate data volumes before creating these paths. Add persistent
mounts to `/etc/fstab`, verify them with `findmnt`, then set ownership/permissions on the
mounted directories; otherwise data may silently be written to the OS root filesystem.

For the OS installer, use the site's standard UEFI layout (typically a 600 MiB EFI System
Partition and a 1 GiB `/boot`), then put the root filesystem and data volumes on LVM.
For a modest single-server installation, reserve roughly 25–40 GiB for `/` before adding
the separately sized database, upload, and backup volumes. Set swap according to the
organization's AlmaLinux standard and available memory. These are starting points, not
capacity guarantees; monitor and revise them from actual workload and retention data.

If a separate PostgreSQL volume is not available, keep database data on a monitored
filesystem with enough growth headroom. Back up uploaded files separately from PostgreSQL.
Do not size data volumes by guesswork: estimate ticket volume, average attachment size,
retention, and backup retention first. Monitor filesystem capacity and inode usage.

## 1. Prepare AlmaLinux

Apply current AlmaLinux security updates and reboot if required. Ensure administrative
SSH access is available before changing firewall rules.

```bash
sudo dnf update -y
sudo dnf install -y git nginx postgresql-server postgresql-contrib firewalld policycoreutils-python-utils
sudo systemctl enable --now nginx
```

Install Node.js **22.12 or newer within Node 22** using the organization's approved RPM
repository. For environments that approve NodeSource, inspect and run its repository
setup script, then install the package:

```bash
sudo dnf install -y curl
curl -fsSL https://rpm.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
sed -n '1,220p' /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo dnf install -y nodejs
sudo rm -f /tmp/nodesource_setup.sh
```

Confirm the installed runtime:

```bash
node --version
npm --version
```

The backend preflight requires Node 22 or newer; Vite 8's production build needs Node
22.12 or newer. Do not use the older AlmaLinux Node.js package if it does not meet that
minimum.

Create a dedicated, non-login service account and persistent data directories:

```bash
sudo useradd --system --home-dir /opt/kuccps-ticketing --shell /sbin/nologin kuccps
sudo install -d -o kuccps -g kuccps -m 0750 /opt/kuccps-ticketing/releases
sudo install -d -o kuccps -g kuccps -m 0750 /var/lib/kuccps-ticketing/uploads
sudo install -d -o root -g root -m 0700 /var/backups/kuccps-ticketing
sudo install -d -o root -g nginx -m 0750 /var/www/kuccps-ticketing/releases
```

Keep PostgreSQL and the backend private; do not open ports 5000 or 5432 to the internet.
If Nginx proxies to the loopback backend under SELinux, allow that connection:

```bash
sudo setsebool -P httpd_can_network_connect 1
```

## 2. Configure PostgreSQL

Initialize PostgreSQL on a new server, then enable it:

```bash
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

Create a dedicated database owner and database. Set the role password through the
interactive `\password` prompt rather than putting it in shell history:

```bash
sudo -u postgres psql
```

At the `psql` prompt:

```sql
CREATE ROLE kuccps_app LOGIN;
\password kuccps_app
CREATE DATABASE kuccps_ticketing OWNER kuccps_app;
\q
```

Use a URL-encoded password in `DATABASE_URL` if it contains reserved URL characters.
Keep PostgreSQL listening on localhost unless a separately secured database host is used.

## 3. Configure the production environment

Create a root-owned environment file readable by the service group:

```bash
sudo install -o root -g kuccps -m 0640 /dev/null /etc/kuccps-ticketing.env
sudoedit /etc/kuccps-ticketing.env
```

Set the following values in that file. Generate both keys independently with a secure
secret manager or `openssl rand -hex 32`; never reuse development values.

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=5000
DATABASE_URL=postgresql://kuccps_app:<URL-ENCODED-PASSWORD>@127.0.0.1:5432/kuccps_ticketing?schema=public
JWT_SECRET=<unique-random-value-at-least-32-characters>
PUBLIC_TICKET_API_KEY=<different-unique-random-value-at-least-32-characters>
REQUIRE_PUBLIC_TICKET_API_KEY=true
CORS_ORIGINS=https://tickets.example.ac.ke
UPLOAD_DIR=/var/lib/kuccps-ticketing/uploads
ALLOW_PUBLIC_API_KEY_IN_BODY=false
SMTP_TLS_REJECT_UNAUTHORIZED=true
IMAP_TLS_REJECT_UNAUTHORIZED=true
LDAP_TLS_REJECT_UNAUTHORIZED=true
JSON_BODY_LIMIT=1mb
```

`CORS_ORIGINS` must contain exact HTTPS origins (scheme and hostname, no path), separated
by commas if more than one frontend origin is required. Set `PUBLIC_APP_URL` to the
public HTTPS URL if CSAT links should be generated. Add mail settings only when email is
used: `EMAIL_USER`, `EMAIL_PASSWORD` (or `SMTP_USER`/`SMTP_PASSWORD`), `SMTP_HOST`,
`SMTP_PORT`, `SUPPORT_EMAIL`, and optionally `EMAIL_FROM`. Inbound email additionally
needs `IMAP_USER`, `IMAP_PASSWORD`, and `IMAP_ENABLED=true`. Configure LDAP only if needed;
production LDAP must use `LDAP_URL=ldaps://...`, with its bind and search settings.

Protect and verify the file:

```bash
sudo chown root:kuccps /etc/kuccps-ticketing.env
sudo chmod 0640 /etc/kuccps-ticketing.env
```

For a brand-new database only, temporarily add `BOOTSTRAP_ADMIN_USERNAME`,
`BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, and `BOOTSTRAP_ADMIN_PASSWORD` to this
file. The password must be at least 16 characters and include uppercase, lowercase, and
numeric characters. Remove the bootstrap password after the administrator has been seeded.

## 4. Deploy an application release

Deploy from a reviewed, immutable Git commit or approved build artifact. Do not deploy
unreviewed working-tree changes. Use a unique release directory for each deployment:

```bash
RELEASE=/opt/kuccps-ticketing/releases/RELEASE_ID
REPOSITORY_URL=https://github.com/Felix273/kuccps-ticketing-system.git
APP_COMMIT=REVIEWED_COMMIT_SHA
sudo -u kuccps git clone --no-checkout "$REPOSITORY_URL" "$RELEASE"
sudo -u kuccps git -C "$RELEASE" checkout --detach "$APP_COMMIT"
```

For a private repository using a deploy key, set `REPOSITORY_URL` to the SSH remote and
install the key for the `kuccps` service account with the approved access controls, or
copy an approved release artifact instead. Then install dependencies, generate Prisma
Client, validate configuration, and apply migrations. Before the first production
migration and before every later release that may migrate the schema, make a database and
uploads backup as shown in section 8. Run the preflight and database commands with the
protected environment loaded:

```bash
sudo chown -R kuccps:kuccps "$RELEASE"
sudo -u kuccps bash -c 'set -a; . /etc/kuccps-ticketing.env; set +a; cd "$1/backend" && npm ci && npm run preflight && npx prisma generate && npx prisma migrate deploy' _ "$RELEASE"
```

On the initial database only, run the seed with bootstrap variables present:

```bash
sudo -u kuccps bash -c 'set -a; . /etc/kuccps-ticketing.env; set +a; cd "$1/backend" && npx prisma db seed' _ "$RELEASE"
```

Remove `BOOTSTRAP_ADMIN_PASSWORD` (and the other bootstrap-only values) from the
environment file after successful initial seeding. Do not run `prisma migrate dev` in
production.

Build the frontend with a same-origin API path. The resulting build is public code; never
put secrets in `VITE_*` variables.

```bash
sudo -u kuccps bash -c 'cd "$1/frontend" && npm ci && VITE_API_URL=/api npm run build' _ "$RELEASE"
```

Check that development demo credentials were not emitted. Copy the static build into a
web-readable release directory under `/var/www` (do not point Nginx through the private
`/opt` release tree), then point both release symlinks at the new version:

```bash
if grep -R -E 'admin123|staff123' "$RELEASE/frontend/dist"; then
  echo "Development credentials found in the production bundle" >&2
  exit 1
fi
sudo install -d -o root -g nginx -m 0755 "/var/www/kuccps-ticketing/releases/$(basename "$RELEASE")"
sudo cp -a "$RELEASE/frontend/dist/." "/var/www/kuccps-ticketing/releases/$(basename "$RELEASE")/"
sudo chown -R root:nginx "/var/www/kuccps-ticketing/releases/$(basename "$RELEASE")"
sudo find "/var/www/kuccps-ticketing/releases/$(basename "$RELEASE")" -type d -exec chmod 0755 {} +
sudo find "/var/www/kuccps-ticketing/releases/$(basename "$RELEASE")" -type f -exec chmod 0644 {} +
sudo ln -sfn "$RELEASE" /opt/kuccps-ticketing/current
sudo ln -sfn "/var/www/kuccps-ticketing/releases/$(basename "$RELEASE")" /var/www/kuccps-ticketing/current
```

## 5. Configure systemd

Create `/etc/systemd/system/kuccps-ticketing.service`:

```ini
[Unit]
Description=KUCCPS Ticketing API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=kuccps
Group=kuccps
WorkingDirectory=/opt/kuccps-ticketing/current/backend
EnvironmentFile=/etc/kuccps-ticketing.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5
UMask=0027
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/kuccps-ticketing/uploads

[Install]
WantedBy=multi-user.target
```

Confirm the Node binary path with `command -v node`; update `ExecStart` if it is not
`/usr/bin/node`. Then start and enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kuccps-ticketing
sudo systemctl status kuccps-ticketing --no-pager
sudo journalctl -u kuccps-ticketing -n 100 --no-pager
```

The scheduler runs inside the backend process. Start only one backend instance until
scheduler leadership and shared/distributed rate limiting are implemented.

## 6. Configure HTTPS Nginx and firewall

Obtain a valid certificate for the public hostname from the organization's PKI or an
approved ACME process. Configure Nginx at `/etc/nginx/conf.d/kuccps-ticketing.conf`,
substituting the certificate paths and hostname:

```nginx
server {
    listen 80;
    server_name tickets.example.ac.ke;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name tickets.example.ac.ke;

    ssl_certificate /etc/pki/tls/certs/tickets.example.ac.ke-fullchain.pem;
    ssl_certificate_key /etc/pki/tls/private/tickets.example.ac.ke-key.pem;

    root /var/www/kuccps-ticketing/current;
    index index.html;
    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-Id $request_id;
    }

    location = /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Validate/reload Nginx and expose only SSH, HTTP, and HTTPS. Before starting firewalld on
a remote server, allow the actual SSH port in the active zone. The following assumes the
default `public` zone and SSH on port 22; adjust for the organization's configured zone
or nonstandard SSH port:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo firewall-offline-cmd --zone=public --add-service=ssh
sudo firewall-offline-cmd --zone=public --add-service=http
sudo firewall-offline-cmd --zone=public --add-service=https
sudo systemctl enable --now firewalld
sudo firewall-cmd --reload
sudo ss -lntp
```

Do not add public firewall rules for ports 5000 or 5432. Confirm SELinux remains enforcing;
resolve labeling issues with the appropriate file contexts rather than disabling SELinux.

## 7. Pre-launch checklist and smoke tests

- [ ] Production keys are unique, strong, and stored outside the repository.
- [ ] `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_TICKET_API_KEY`,
  `REQUIRE_PUBLIC_TICKET_API_KEY`, and `CORS_ORIGINS` are set correctly.
- [ ] `UPLOAD_DIR` is persistent, writable by `kuccps`, monitored, and backed up.
- [ ] Bootstrap credentials are removed after the first administrator is seeded.
- [ ] Migrations and `npm run preflight` succeed; there is a verified pre-migration backup.
- [ ] HTTPS certificate is valid; firewall exposes no backend or database port.
- [ ] Only one backend instance is running; logs and disk alerts are configured.
- [ ] Database and uploads have off-host backups and a tested restore procedure.
- [ ] Add-on Script Properties are set separately: `API_URL=https://tickets.example.ac.ke/api`,
  `BACKEND_API_KEY` equal to the backend's public ticket key, and the production support email.

Smoke tests:

1. `curl -fsS https://tickets.example.ac.ke/health` returns HTTP 200 and JSON with
   `"status":"OK"`. A database outage must result in HTTP 503.
2. Load the UI over HTTPS, authenticate as the initial administrator, and confirm demo
   credentials are not displayed.
3. Create a test ticket through the configured add-on or another approved API client; as
   an authorized staff user, add an attachment and download it.
4. If the Google Workspace add-on is enabled, submit one test ticket and verify a request
   without the configured API key is rejected.
5. If enabled, test outbound email, inbound IMAP processing, and one LDAPS login/sync.
6. Confirm `journalctl -u kuccps-ticketing` has no startup errors and upload/database
   filesystems have adequate free space.

The backend writes logs to systemd's journal:

```bash
sudo journalctl -u kuccps-ticketing --since today --no-pager
sudo systemctl is-active kuccps-ticketing
```

Configure an external uptime monitor for the HTTPS `/health` endpoint and alerts for
service failure, database/storage capacity, and backup failure. The app does not provide
a metrics exporter or centralized log shipping by itself.

## 8. Backups and rollback

Before each release/migration, take a database backup and snapshot/copy the upload
directory. A basic local backup (run with a protected root shell) is:

```bash
STAMP=$(date +%Y%m%d_%H%M%S)
set -o pipefail
sudo -u postgres pg_dump --format=custom kuccps_ticketing | sudo tee "/var/backups/kuccps-ticketing/db_${STAMP}.dump" >/dev/null
sudo tar -C /var/lib/kuccps-ticketing -czf "/var/backups/kuccps-ticketing/uploads_${STAMP}.tar.gz" uploads
sudo chmod 0600 "/var/backups/kuccps-ticketing/db_${STAMP}.dump" "/var/backups/kuccps-ticketing/uploads_${STAMP}.tar.gz"
```

To automate a daily backup, create `/usr/local/sbin/backup-kuccps-ticketing` as root:

```bash
sudoedit /usr/local/sbin/backup-kuccps-ticketing
```

Use this script content:

```bash
#!/usr/bin/env bash
set -euo pipefail
umask 077

BACKUP_DIR=/var/backups/kuccps-ticketing
STAMP=$(date +%Y%m%d_%H%M%S)
DB_TMP="$BACKUP_DIR/.db_${STAMP}.dump.partial"
UPLOADS_TMP="$BACKUP_DIR/.uploads_${STAMP}.tar.gz.partial"
trap 'rm -f -- "$DB_TMP" "$UPLOADS_TMP"' EXIT

runuser -u postgres -- pg_dump --format=custom kuccps_ticketing > "$DB_TMP"
tar -C /var/lib/kuccps-ticketing -czf "$UPLOADS_TMP" uploads
mv "$DB_TMP" "$BACKUP_DIR/db_${STAMP}.dump"
mv "$UPLOADS_TMP" "$BACKUP_DIR/uploads_${STAMP}.tar.gz"
```

Protect and schedule the script with systemd:

```bash
sudo chown root:root /usr/local/sbin/backup-kuccps-ticketing
sudo chmod 0700 /usr/local/sbin/backup-kuccps-ticketing
sudoedit /etc/systemd/system/kuccps-ticketing-backup.service
```

Service contents:

```ini
[Unit]
Description=Back up KUCCPS Ticketing database and uploads

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/backup-kuccps-ticketing
```

Create `/etc/systemd/system/kuccps-ticketing-backup.timer`:

```ini
[Unit]
Description=Daily KUCCPS Ticketing backup

[Timer]
OnCalendar=*-*-* 02:15:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable the schedule and verify it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kuccps-ticketing-backup.timer
sudo systemctl list-timers kuccps-ticketing-backup.timer --no-pager
sudo systemctl start kuccps-ticketing-backup.service
sudo systemctl status kuccps-ticketing-backup.service --no-pager
```

Copy encrypted backups off-host and test restoration regularly. Local backups alone do
not protect against disk loss. Restore the database and uploads together to keep ticket
attachment references consistent.

For an application-only rollback, point both `current` symlinks back to the previous
release, then restart the backend and reload Nginx:

```bash
PREVIOUS_RELEASE_ID=REPLACE_WITH_PREVIOUS_RELEASE_ID
sudo ln -sfn "/opt/kuccps-ticketing/releases/$PREVIOUS_RELEASE_ID" /opt/kuccps-ticketing/current
sudo ln -sfn "/var/www/kuccps-ticketing/releases/$PREVIOUS_RELEASE_ID" /var/www/kuccps-ticketing/current
sudo systemctl restart kuccps-ticketing
sudo systemctl reload nginx
```

Application rollback is safe only when the previous code supports the migrated schema.
Prisma migrations are not automatically undone. If a migration is incompatible, stop
traffic, restore the pre-migration database backup (and matching uploads snapshot if
needed), deploy the matching application release, and rerun the smoke tests. For a
destructive restore, first stop the service and verify the exact backup filenames:

```bash
sudo systemctl stop kuccps-ticketing
STAMP=REPLACE_WITH_BACKUP_TIMESTAMP
sudo -u postgres pg_restore --clean --if-exists --no-owner --role=kuccps_app \
  --dbname=kuccps_ticketing "/var/backups/kuccps-ticketing/db_${STAMP}.dump"
sudo tar -xzf "/var/backups/kuccps-ticketing/uploads_${STAMP}.tar.gz" \
  -C /var/lib/kuccps-ticketing
sudo chown -R kuccps:kuccps /var/lib/kuccps-ticketing/uploads
sudo systemctl start kuccps-ticketing
```

Set `STAMP` to the same backup timestamp for both files. This restore can discard
writes made since the backup; coordinate and announce the maintenance window before
proceeding.
