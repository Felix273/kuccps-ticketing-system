const fs = require('fs');
const path = require('path');
const { getProductionConfigErrors } = require('../src/middleware/security');

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

const fileConfig = fs.existsSync(envPath)
  ? parseEnv(fs.readFileSync(envPath, 'utf8'))
  : { values: {}, counts: {} };
const values = { ...fileConfig.values, ...process.env };
const counts = fileConfig.counts;

Object.entries(counts)
  .filter(([, count]) => count > 1)
  .forEach(([key, count]) => failures.push(`${key} appears ${count} times in backend/.env. Keep only one value.`));

required.forEach(key => check(hasValue(values[key]), `${key} is required.`));

if (hasValue(values.DATABASE_URL)) {
  try {
    const databaseUrl = new URL(values.DATABASE_URL);
    check(
      ['postgres:', 'postgresql:'].includes(databaseUrl.protocol),
      'DATABASE_URL must use PostgreSQL.'
    );
  } catch {
    failures.push('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
}

if (values.NODE_ENV === 'production') {
  failures.push(...getProductionConfigErrors(values));
  check(values.ALLOW_PUBLIC_API_KEY_IN_BODY !== 'true', 'ALLOW_PUBLIC_API_KEY_IN_BODY must not be true in production.');
  check(!String(values.LDAP_URL || '').startsWith('ldap://'), 'Use LDAPS, not LDAP, in production.');
  check(values.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false', 'LDAP_TLS_REJECT_UNAUTHORIZED must not be false in production.');
  check(values.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false', 'SMTP_TLS_REJECT_UNAUTHORIZED must not be false in production.');
  check(values.IMAP_TLS_REJECT_UNAUTHORIZED !== 'false', 'IMAP_TLS_REJECT_UNAUTHORIZED must not be false in production.');
  check(Number(process.versions.node.split('.')[0]) >= 22, 'Node.js 22 or newer is required in production.');
}

warn(hasValue(values.EMAIL_USER) || hasValue(values.SMTP_USER), 'SMTP username is not configured; outbound email may fail.');
warn(hasValue(values.EMAIL_PASSWORD) || hasValue(values.SMTP_PASSWORD), 'SMTP password/app password is not configured; outbound email may fail.');
warn(hasValue(values.SUPPORT_EMAIL), 'SUPPORT_EMAIL is not configured; ticket emails may fall back to the SMTP username.');

if (values.USE_LDAP_AUTH === 'true' || values.LDAP_ENABLED === 'true') {
  ['LDAP_URL', 'LDAP_BIND_DN', 'LDAP_BIND_PASSWORD', 'LDAP_BASE_DN'].forEach(key => {
    check(hasValue(values[key]), `${key} is required when USE_LDAP_AUTH=true.`);
  });
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
warn(nodeMajor >= 22, `Node ${process.versions.node} is below the required production runtime v22.x.`);

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
