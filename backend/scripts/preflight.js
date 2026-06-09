const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const required = ['DATABASE_URL', 'JWT_SECRET'];
const warnings = [];
const failures = [];

function parseEnv(content) {
  const values = {};
  const counts = {};

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      warnings.push(`Line ${index + 1} is not a KEY=value entry.`);
      return;
    }

    const key = match[1];
    let value = match[2].trim();
    value = value.replace(/^['"]|['"]$/g, '');
    values[key] = value;
    counts[key] = (counts[key] || 0) + 1;
  });

  return { values, counts };
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

if (!fs.existsSync(envPath)) {
  console.error('Preflight failed: backend/.env was not found.');
  process.exit(1);
}

const { values, counts } = parseEnv(fs.readFileSync(envPath, 'utf8'));

Object.entries(counts)
  .filter(([, count]) => count > 1)
  .forEach(([key, count]) => failures.push(`${key} appears ${count} times in backend/.env. Keep only one value.`));

required.forEach(key => check(hasValue(values[key]), `${key} is required.`));

check(
  hasValue(values.PUBLIC_TICKET_API_KEY) || values.REQUIRE_PUBLIC_TICKET_API_KEY !== 'true',
  'PUBLIC_TICKET_API_KEY is required when REQUIRE_PUBLIC_TICKET_API_KEY=true.'
);

if (hasValue(values.PUBLIC_TICKET_API_KEY)) {
  check(values.PUBLIC_TICKET_API_KEY.length >= 32, 'PUBLIC_TICKET_API_KEY should be at least 32 characters.');
}

if (hasValue(values.JWT_SECRET)) {
  check(values.JWT_SECRET.length >= 32, 'JWT_SECRET should be at least 32 characters.');
}

if (values.NODE_ENV === 'production') {
  check(values.REQUIRE_PUBLIC_TICKET_API_KEY === 'true', 'REQUIRE_PUBLIC_TICKET_API_KEY must be true in production.');
  warn(values.FRONTEND_URL && !values.FRONTEND_URL.includes('localhost'), 'FRONTEND_URL should be the production HTTPS frontend URL.');
  warn(values.CORS_ORIGINS || values.FRONTEND_URL, 'Set CORS_ORIGINS or FRONTEND_URL for production.');
}

warn(!String(values.CORS_ORIGINS || '').includes('*'), 'CORS_ORIGINS should not contain wildcard origins.');
warn(hasValue(values.EMAIL_USER) || hasValue(values.SMTP_USER), 'SMTP username is not configured; outbound email may fail.');
warn(hasValue(values.EMAIL_PASSWORD) || hasValue(values.SMTP_PASSWORD), 'SMTP password/app password is not configured; outbound email may fail.');
warn(hasValue(values.SUPPORT_EMAIL), 'SUPPORT_EMAIL is not configured; ticket emails may fall back to the SMTP username.');

if (values.USE_LDAP_AUTH === 'true') {
  ['LDAP_URL', 'LDAP_BIND_DN', 'LDAP_BIND_PASSWORD', 'LDAP_SEARCH_BASE'].forEach(key => {
    check(hasValue(values[key]), `${key} is required when USE_LDAP_AUTH=true.`);
  });
}

if (failures.length > 0) {
  console.error('Preflight failed:');
  failures.forEach(message => console.error(`- ${message}`));
  if (warnings.length > 0) {
    console.error('\nWarnings:');
    warnings.forEach(message => console.error(`- ${message}`));
  }
  process.exit(1);
}

console.log('Preflight passed.');
if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(message => console.log(`- ${message}`));
}
