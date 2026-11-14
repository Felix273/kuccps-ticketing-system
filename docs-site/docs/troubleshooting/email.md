# Email Issues

This guide covers email-related issues and their resolution.

## Symptoms

- Emails not sent
- "Invalid login" errors from SMTP
- IMAP connection failures
- Duplicate or missing notifications

## SMTP Issues

### Invalid Credentials

**Symptom:** `Invalid login: 535-5.7.8 Username and Password not accepted`

**Resolution:**

1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
2. For Gmail, use an **app password**, not your account password
3. Ensure 2FA is enabled on the Gmail account
4. Check that "Less secure app access" is enabled (if not using app passwords)

### Connection Refused

**Symptom:** `Connection refused` or `ETIMEDOUT`

**Resolution:**

1. Check firewall rules allow outbound SMTP (port 587/465)
2. Verify `SMTP_HOST` and `SMTP_PORT` are correct
3. Test connectivity:
   ```bash
   telnet smtp.gmail.com 587
   ```

### TLS/SSL Errors

**Symptom:** `TLS handshake failed`

**Resolution:**

1. Set `SMTP_TLS_REJECT_UNAUTHORIZED=false` for testing only
2. In production, use valid certificates
3. For Gmail, use port 587 with `secure: false` or port 465 with `secure: true`

## IMAP Issues

### Connection Failures

**Symptom:** IMAP monitoring does not start

**Resolution:**

1. Verify `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASSWORD`
2. Ensure both `EMAIL_USER` and `IMAP_USER` are configured
3. Check firewall allows outbound IMAP (port 993)

### Email Not Processed

**Symptom:** Inbound emails do not create ticket updates

**Resolution:**

1. Check email subject contains ticket number
2. Verify `IMAP_POLL_INTERVAL` is appropriate
3. Check backend logs for IMAP errors
4. Ensure the mailbox is not full

## Email Not Delivered

### Spam/Junk Folder

**Resolution:**

1. Configure SPF, DKIM, and DMARC records for `SUPPORT_EMAIL` domain
2. Use a dedicated support mailbox, not a personal Gmail
3. Avoid spam trigger words in email templates

### Gmail Specific

**Resolution:**

1. Enable 2FA
2. Generate an app password
3. Use the app password in `EMAIL_PASSWORD`

## Testing Email

```bash
# Backend test endpoint
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer <jwt-token>"
```

## Monitoring

Monitor email delivery:
- Check SMTP server logs
- Monitor bounce rates
- Track email queue depth
- Set up alerts for consecutive failures
