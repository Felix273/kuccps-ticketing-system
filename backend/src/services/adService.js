const ldap = require('ldapjs');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_USER_FILTER = '(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))';
const DEFAULT_DIRECTORATE_FILTER = '(|(objectClass=organizationalUnit)(objectClass=group))';

function escapeFilter(value) {
  return String(value || '').replace(/[\\*()\0]/g, (char) => {
    const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
    return `\\${hex}`;
  });
}

function escapeDnValue(value) {
  return String(value || '').replace(/([,+"\\<>;=#])/g, '\\$1');
}

function getEntryDn(entry) {
  return entry?.objectName || entry?.dn?.toString?.() || entry?.pojo?.objectName || '';
}

function normaliseValue(value) {
  if (Array.isArray(value)) return value.map(normaliseValue);
  if (Buffer.isBuffer(value)) return value.toString('hex');
  if (value && typeof value === 'object' && value.buffer) return Buffer.from(value.buffer).toString('hex');
  return value == null ? '' : String(value);
}

function getAttr(entry, name) {
  if (!entry || !name) return '';
  const objectValue = entry.object?.[name];
  if (objectValue != null) return normaliseValue(objectValue);

  const pojoAttr = entry.pojo?.attributes?.find(attr => attr.type?.toLowerCase() === name.toLowerCase());
  if (pojoAttr) {
    const values = pojoAttr.values || pojoAttr.buffers || [];
    if (values.length > 1) return values.map(normaliseValue);
    return normaliseValue(values[0]);
  }

  const directAttr = entry.attributes?.find(attr => attr.type?.toLowerCase() === name.toLowerCase());
  if (directAttr) {
    const values = directAttr.values || directAttr.buffers || [];
    if (values.length > 1) return values.map(normaliseValue);
    return normaliseValue(values[0]);
  }

  return '';
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function getAdSettings() {
  const settings = await prisma.systemSettings.findFirst();
  return {
    ldapEnabled: settings?.ldapEnabled ?? (String(process.env.USE_LDAP_AUTH || '').toLowerCase() === 'true'),
    ldapUrl: settings?.ldapUrl || process.env.LDAP_URL,
    ldapBaseDn: settings?.ldapBaseDn || process.env.LDAP_BASE_DN,
    ldapUserDnPrefix: settings?.ldapUserDnPrefix || process.env.LDAP_USER_DN_PREFIX || 'sAMAccountName',
    ldapBindDn: settings?.ldapBindDn || process.env.LDAP_BIND_DN,
    ldapBindPassword: settings?.ldapBindPassword || process.env.LDAP_BIND_PASSWORD,
    ldapDomain: settings?.ldapDomain || process.env.LDAP_DOMAIN,
    ldapUserSearchBase: settings?.ldapUserSearchBase || process.env.LDAP_USER_SEARCH_BASE || settings?.ldapBaseDn || process.env.LDAP_BASE_DN,
    ldapUserFilter: settings?.ldapUserFilter || process.env.LDAP_USER_FILTER || DEFAULT_USER_FILTER,
    ldapDirectorateSearchBase: settings?.ldapDirectorateSearchBase || process.env.LDAP_DIRECTORATE_SEARCH_BASE || settings?.ldapBaseDn || process.env.LDAP_BASE_DN,
    ldapDirectorateFilter: settings?.ldapDirectorateFilter || process.env.LDAP_DIRECTORATE_FILTER || DEFAULT_DIRECTORATE_FILTER,
    ldapUsernameAttribute: settings?.ldapUsernameAttribute || process.env.LDAP_USERNAME_ATTRIBUTE || 'sAMAccountName',
    ldapEmailAttribute: settings?.ldapEmailAttribute || process.env.LDAP_EMAIL_ATTRIBUTE || 'mail',
    ldapNameAttribute: settings?.ldapNameAttribute || process.env.LDAP_NAME_ATTRIBUTE || 'displayName',
    ldapDepartmentAttribute: settings?.ldapDepartmentAttribute || process.env.LDAP_DEPARTMENT_ATTRIBUTE || 'department',
    ldapIctGroupDn: settings?.ldapIctGroupDn || process.env.LDAP_ICT_GROUP_DN,
    ldapIctUserFilter: settings?.ldapIctUserFilter || process.env.LDAP_ICT_USER_FILTER,
    ldapDefaultRole: settings?.ldapDefaultRole || process.env.LDAP_DEFAULT_ROLE || 'user',
    ldapSyncUsersEnabled: settings?.ldapSyncUsersEnabled ?? true
  };
}

function assertConfigured(settings) {
  if (!settings.ldapUrl || !settings.ldapBaseDn) {
    throw new Error('AD/LDAP URL and base DN are required');
  }
}

function createClient(settings) {
  assertConfigured(settings);
  const rejectUnauthorized = String(process.env.LDAP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
  return ldap.createClient({
    url: settings.ldapUrl,
    timeout: 10000,
    connectTimeout: 10000,
    reconnect: false,
    tlsOptions: { rejectUnauthorized }
  });
}

function bind(client, dn, password) {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function unbind(client) {
  try {
    client.unbind();
  } catch {
    // no-op
  }
}

async function getBoundClient(settings) {
  const client = createClient(settings);
  if (!settings.ldapBindDn || !settings.ldapBindPassword) {
    throw new Error('AD bind DN and bind password are required for sync/search');
  }
  await bind(client, settings.ldapBindDn, settings.ldapBindPassword);
  return client;
}

function search(client, base, options) {
  return new Promise((resolve, reject) => {
    const entries = [];
    client.search(base, options, (err, res) => {
      if (err) return reject(err);
      res.on('searchEntry', entry => entries.push(entry));
      res.on('error', reject);
      res.on('end', () => resolve(entries));
    });
  });
}

function mergeFilters(...filters) {
  const clean = filters.filter(Boolean);
  if (clean.length === 0) return '(objectClass=*)';
  if (clean.length === 1) return clean[0];
  return `(&${clean.join('')})`;
}

function mapUser(entry, settings) {
  const username = first(getAttr(entry, settings.ldapUsernameAttribute)) || first(getAttr(entry, 'sAMAccountName')) || first(getAttr(entry, 'userPrincipalName'));
  const email = first(getAttr(entry, settings.ldapEmailAttribute)) || first(getAttr(entry, 'userPrincipalName')) || `${username}@${settings.ldapDomain || 'local'}`;
  const name = first(getAttr(entry, settings.ldapNameAttribute)) || first(getAttr(entry, 'cn')) || username;
  const department = first(getAttr(entry, settings.ldapDepartmentAttribute)) || first(getAttr(entry, 'department')) || 'Unassigned';
  const memberOf = toArray(getAttr(entry, 'memberOf'));
  const dn = getEntryDn(entry);
  const objectGuid = first(getAttr(entry, 'objectGUID')) || first(getAttr(entry, 'objectSid')) || null;

  return {
    username,
    email,
    name,
    department,
    memberOf,
    dn,
    objectGuid
  };
}

function isIctUser(adUser, settings) {
  if (settings.ldapIctGroupDn) {
    const groupDn = settings.ldapIctGroupDn.toLowerCase();
    if (adUser.memberOf.some(group => String(group).toLowerCase() === groupDn)) return true;
  }

  const text = `${adUser.department || ''} ${adUser.dn || ''}`.toLowerCase();
  return text.includes('ict') ||
    text.includes('information') ||
    text.includes('technology') ||
    text.includes('it support');
}

async function findAdUser(username, settings) {
  const client = await getBoundClient(settings);
  try {
    const userFilter = mergeFilters(
      settings.ldapUserFilter,
      `(|(${settings.ldapUsernameAttribute}=${escapeFilter(username)})(userPrincipalName=${escapeFilter(username)})(mail=${escapeFilter(username)}))`
    );
    const entries = await search(client, settings.ldapUserSearchBase, {
      scope: 'sub',
      filter: userFilter,
      attributes: [
        settings.ldapUsernameAttribute,
        settings.ldapEmailAttribute,
        settings.ldapNameAttribute,
        settings.ldapDepartmentAttribute,
        'cn',
        'mail',
        'displayName',
        'department',
        'memberOf',
        'userPrincipalName',
        'objectGUID',
        'objectSid'
      ]
    });
    return entries[0] ? mapUser(entries[0], settings) : null;
  } finally {
    unbind(client);
  }
}

async function authenticate(username, password) {
  const settings = await getAdSettings();
  if (!settings.ldapEnabled) {
    throw new Error('AD authentication is disabled');
  }

  let adUser = null;
  if (settings.ldapBindDn && settings.ldapBindPassword) {
    adUser = await findAdUser(username, settings);
  }

  const bindTargets = [];
  if (adUser?.dn) bindTargets.push(adUser.dn);
  if (settings.ldapDomain && !String(username).includes('@')) bindTargets.push(`${username}@${settings.ldapDomain}`);
  bindTargets.push(username);
  bindTargets.push(`${settings.ldapUserDnPrefix}=${escapeDnValue(username)},${settings.ldapBaseDn}`);

  let lastError = null;
  for (const target of [...new Set(bindTargets.filter(Boolean))]) {
    const client = createClient(settings);
    try {
      await bind(client, target, password);
      unbind(client);
      if (!adUser) adUser = await findAdUser(username, settings).catch(() => null);
      if (!adUser) {
        adUser = {
          username,
          email: settings.ldapDomain ? `${username}@${settings.ldapDomain}` : `${username}@local`,
          name: username,
          department: 'Unassigned',
          memberOf: [],
          dn: target,
          objectGuid: null
        };
      }
      return { adUser, isIct: isIctUser(adUser, settings), settings };
    } catch (error) {
      lastError = error;
      unbind(client);
    }
  }

  throw lastError || new Error('Invalid AD credentials');
}

async function ensureDepartment(name) {
  const safeName = String(name || 'Unassigned').trim() || 'Unassigned';
  const existing = await prisma.department.findFirst({
    where: { name: { equals: safeName, mode: 'insensitive' } }
  });
  if (existing) return existing;
  return prisma.department.create({
    data: {
      name: safeName,
      code: safeName.split(/\s+/).map(part => part[0]).join('').slice(0, 12).toUpperCase() || null
    }
  });
}

async function upsertAdUser(adUser, settings, forceRole) {
  const department = await ensureDepartment(adUser.department);
  let role = forceRole || (isIctUser(adUser, settings) ? 'staff' : settings.ldapDefaultRole || 'user');
  const password = await bcrypt.hash(`AD_SYNC_${adUser.username}_${Date.now()}`, 10);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: adUser.username },
        { email: adUser.email }
      ]
    }
  });

  const data = {
    username: adUser.username,
    email: adUser.email,
    name: adUser.name,
    role,
    departmentId: department.id,
    ldapSync: true,
    ldapDn: adUser.dn || null,
    ldapObjectGuid: adUser.objectGuid || null,
    lastSyncedAt: new Date()
  };

  if (existing) {
    role = existing.role === 'admin' ? 'admin' : role;
    return prisma.user.update({
      where: { id: existing.id },
      data: { ...data, role },
      include: { department: true }
    });
  }

  return prisma.user.create({
    data: {
      ...data,
      password
    },
    include: { department: true }
  });
}

async function syncDirectorates() {
  const settings = await getAdSettings();
  const client = await getBoundClient(settings);
  try {
    const entries = await search(client, settings.ldapDirectorateSearchBase, {
      scope: 'sub',
      filter: settings.ldapDirectorateFilter,
      attributes: ['ou', 'cn', 'name', 'description']
    });

    const names = [...new Set(entries
      .map(entry => first(getAttr(entry, 'ou')) || first(getAttr(entry, 'cn')) || first(getAttr(entry, 'name')))
      .filter(Boolean)
      .map(name => String(name).trim()))];

    const departments = [];
    for (const name of names) {
      departments.push(await ensureDepartment(name));
    }

    return { count: departments.length, departments };
  } finally {
    unbind(client);
  }
}

async function syncUsers() {
  const settings = await getAdSettings();
  const client = await getBoundClient(settings);
  try {
    const filter = mergeFilters(settings.ldapUserFilter, settings.ldapIctUserFilter);
    const entries = await search(client, settings.ldapUserSearchBase, {
      scope: 'sub',
      filter,
      attributes: [
        settings.ldapUsernameAttribute,
        settings.ldapEmailAttribute,
        settings.ldapNameAttribute,
        settings.ldapDepartmentAttribute,
        'cn',
        'mail',
        'displayName',
        'department',
        'memberOf',
        'userPrincipalName',
        'objectGUID',
        'objectSid'
      ]
    });

    const synced = [];
    for (const entry of entries) {
      const adUser = mapUser(entry, settings);
      if (!adUser.username || !adUser.email) continue;
      synced.push(await upsertAdUser(adUser, settings));
    }

    return { count: synced.length, users: synced };
  } finally {
    unbind(client);
  }
}

module.exports = {
  authenticate,
  syncDirectorates,
  syncUsers,
  upsertAdUser,
  getAdSettings,
  isIctUser
};
