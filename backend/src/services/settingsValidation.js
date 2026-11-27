// Validates and normalises a PUT /api/settings body. Returns { data, errors }.
// Every accepted field is coerced to the type Prisma expects, so a bad value is a
// 400 with a clear message rather than a database error or unsafe content.

const { HEX_COLOR } = require('../utils/html');
const { normalizePriority, normalizeStatus } = require('./ticketEnums');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MASKED_SECRET = '********';

function isBlank(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

const text = (max, { required = false } = {}) => (value, field) => {
  if (isBlank(value)) {
    if (required) throw new Error(`${field} is required`);
    return null;
  }
  if (typeof value !== 'string') throw new Error(`${field} must be text`);
  const trimmed = value.replace(/\u0000/g, '').trim();
  if (trimmed.length > max) throw new Error(`${field} must be at most ${max} characters`);
  return trimmed;
};

const bool = (value, field) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 'false') return value === 'true';
  throw new Error(`${field} must be true or false`);
};

const int = (min, max) => (value, field) => {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${field} must be a whole number between ${min} and ${max}`);
  }
  return number;
};

const email = ({ required = false } = {}) => (value, field) => {
  const cleaned = text(254, { required })(value, field);
  if (cleaned === null) return null;
  if (!EMAIL.test(cleaned)) throw new Error(`${field} must be a valid email address`);
  return cleaned.toLowerCase();
};

const color = (value, field) => {
  if (typeof value !== 'string' || !HEX_COLOR.test(value.trim())) {
    throw new Error(`${field} must be a hex colour such as #911414`);
  }
  return value.trim();
};

// Image URLs: absolute http(s) or a same-site path; never javascript:/data: etc.
const imageUrl = (value, field) => {
  const cleaned = text(2048)(value, field);
  if (cleaned === null) return null;
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) return cleaned;
  try {
    const url = new URL(cleaned);
    if (['http:', 'https:'].includes(url.protocol)) return cleaned;
  } catch {
    // fall through
  }
  throw new Error(`${field} must be an http(s) URL or a path starting with /`);
};

const httpUrl = (value, field) => {
  const cleaned = text(2048)(value, field);
  if (cleaned === null) return null;
  try {
    const url = new URL(cleaned);
    if (['http:', 'https:'].includes(url.protocol)) return cleaned;
  } catch {
    // fall through
  }
  throw new Error(`${field} must be an http(s) URL`);
};

const ldapUrl = (value, field) => {
  const cleaned = text(2048)(value, field);
  if (cleaned === null) return null;
  if (!/^ldaps?:\/\/[^\s]+$/i.test(cleaned)) throw new Error(`${field} must start with ldap:// or ldaps://`);
  return cleaned;
};

const oneOf = (values) => (value, field) => {
  if (!values.includes(value)) throw new Error(`${field} must be one of: ${values.join(', ')}`);
  return value;
};

// Secrets: the UI echoes the mask back; blank or masked means "keep the current value".
const secret = (value, field) => {
  if (isBlank(value) || value === MASKED_SECRET) return undefined;
  if (typeof value !== 'string' || value.length > 1024) throw new Error(`${field} is invalid`);
  return value;
};

const FIELD_RULES = {
  organizationName: text(120, { required: true }),
  organizationCode: text(20, { required: true }),
  logoUrl: imageUrl,
  faviconUrl: imageUrl,
  primaryColor: color,
  secondaryColor: color,
  supportEmail: email({ required: true }),
  noreplyEmail: email({ required: true }),
  emailFromName: text(120, { required: true }),
  smtpHost: text(255, { required: true }),
  smtpPort: int(1, 65535),
  smtpSecure: bool,
  smtpUser: text(254),
  smtpPassword: secret,
  _newSmtpPassword: secret,
  imapHost: text(255, { required: true }),
  imapPort: int(1, 65535),
  imapUser: text(254),
  imapPassword: secret,
  _newImapPassword: secret,
  imapEnabled: bool,
  imapPollInterval: int(1, 59),
  ldapEnabled: bool,
  ldapUrl,
  ldapBaseDn: text(500),
  ldapUserDnPrefix: text(100),
  ldapBindDn: text(500),
  ldapBindPassword: secret,
  _newLdapBindPassword: secret,
  ldapDomain: text(255),
  ldapUserSearchBase: text(500),
  ldapUserFilter: text(1000),
  ldapDirectorateSearchBase: text(500),
  ldapDirectorateFilter: text(1000),
  ldapUsernameAttribute: text(100, { required: true }),
  ldapEmailAttribute: text(100, { required: true }),
  ldapNameAttribute: text(100, { required: true }),
  ldapDepartmentAttribute: text(100, { required: true }),
  ldapIctGroupDn: text(500),
  ldapIctUserFilter: text(1000),
  ldapDefaultRole: oneOf(['user', 'staff']),
  ldapSyncUsersEnabled: bool,
  ticketNumberPrefix: (value, field) => {
    if (typeof value !== 'string' || !/^[A-Za-z0-9]{1,10}$/.test(value.trim())) {
      throw new Error(`${field} must be 1-10 letters or digits`);
    }
    return value.trim().toUpperCase();
  },
  ticketNumberFormat: oneOf(['YYYYMMDD-XXXX']),
  defaultPriority: (value, field) => {
    const normalized = normalizePriority(value);
    if (!normalized) throw new Error(`${field} is not a valid priority`);
    return normalized;
  },
  defaultCategory: text(120, { required: true }),
  defaultStatus: (value, field) => {
    const normalized = normalizeStatus(value);
    if (!['Open', 'InProgress', 'OnHold'].includes(normalized)) {
      throw new Error(`${field} must be Open, InProgress or OnHold`);
    }
    return normalized;
  },
  googleAddonApiUrl: httpUrl,
  googleAddonEnabled: bool,
  maxFileSize: int(1024, 100 * 1024 * 1024),
  allowedFileTypes: (value, field) => {
    const list = Array.isArray(value) ? value : String(value ?? '').split(/[,;\s]+/);
    const extensions = [...new Set(list.map(item => String(item).trim().toLowerCase().replace(/^\./, '')).filter(Boolean))];
    if (extensions.some(extension => !/^[a-z0-9]{1,10}$/.test(extension))) {
      throw new Error(`${field} must be a comma-separated list of file extensions`);
    }
    return extensions.join(',');
  },
  maintenanceMode: bool,
  maintenanceMessage: text(1000),
  darkModeEnabled: bool,
  contrastMode: oneOf(['normal', 'high'])
};

// Fields whose value may legitimately be null in the database.
const NULLABLE = new Set([
  'logoUrl', 'faviconUrl', 'smtpUser', 'imapUser', 'ldapUrl', 'ldapBaseDn', 'ldapUserDnPrefix',
  'ldapBindDn', 'ldapDomain', 'ldapUserSearchBase', 'ldapUserFilter', 'ldapDirectorateSearchBase',
  'ldapDirectorateFilter', 'ldapIctGroupDn', 'ldapIctUserFilter', 'googleAddonApiUrl', 'maintenanceMessage'
]);

function validateSettingsUpdate(body) {
  const data = {};
  const errors = [];
  for (const [field, value] of Object.entries(body || {})) {
    const rule = FIELD_RULES[field];
    if (!rule) {
      errors.push(`${field} is not a recognised setting`);
      continue;
    }
    try {
      const normalized = rule(value, field);
      if (normalized === undefined) continue;
      if (normalized === null && !NULLABLE.has(field)) {
        errors.push(`${field} is required`);
        continue;
      }
      data[field] = normalized;
    } catch (error) {
      errors.push(error.message);
    }
  }
  return { data, errors };
}

module.exports = { validateSettingsUpdate, MASKED_SECRET };
