// Role-based access control for the ICT service desk.
//
// Permissions describe real tasks (work a ticket, assign it, publish an article, manage
// email settings...). Roles bundle them. Four system roles cover the ICT Directorate:
//   Administrator  – everything, including roles and system configuration
//   ICT Manager    – runs the desk: assigns work, reopens, publishes KB, sets SLAs, sees reports
//   ICT Officer    – handles tickets day to day and contributes to the knowledge base
//   Viewer         – read-only oversight (e.g. management, audit)
// plus "Requester" (no system access; people who raise tickets).
// Administrators can adjust the Manager/Officer/Viewer permission sets or create custom roles.

const prisma = require('../lib/prisma');

const PERMISSION_GROUPS = [
  {
    group: 'Tickets',
    permissions: [
      ['tickets.view', 'View tickets', 'See the ticket queue, ticket details and conversations'],
      ['tickets.work', 'Work on tickets', 'Claim tickets, reply, add internal notes and attachments, put on hold, resolve'],
      ['tickets.assign', 'Assign tickets', 'Assign or reassign tickets to other officers'],
      ['tickets.escalate', 'Escalate tickets', 'Escalate a ticket to another officer'],
      ['tickets.reopen', 'Reopen tickets', 'Reopen closed tickets'],
      ['tickets.export', 'Export tickets', 'Download ticket lists as CSV']
    ]
  },
  {
    group: 'Knowledge base',
    permissions: [
      ['knowledge.contribute', 'Contribute articles', 'Propose articles and upload documents (sent for review)'],
      ['knowledge.publish', 'Publish & manage articles', 'Approve, edit, archive and delete articles; see search gaps']
    ]
  },
  {
    group: 'Oversight',
    permissions: [
      ['reports.view', 'View dashboards & reports', 'Dashboard, analytics and customer feedback reports'],
      ['users.view', 'View directory', 'See ICT officers, users and directorates'],
      ['status.manage', 'Manage service status', 'Publish and update service status issues'],
      ['audit.view', 'View access audit log', 'See who changed roles and permissions']
    ]
  },
  {
    group: 'Settings',
    permissions: [
      ['settings.organization', 'Organization settings', 'Organization name, branding colours and contact addresses'],
      ['settings.email', 'Email settings', 'Outgoing/incoming email, test mode and email templates'],
      ['settings.service-desk', 'Service desk settings', 'Ticket defaults, SLA timelines, escalation and attachment rules'],
      ['settings.directory', 'Active Directory settings', 'Directory connection and user synchronisation'],
      ['access.manage', 'Manage roles & access', 'Assign roles and edit role permissions (Administrator only)']
    ]
  }
];

const PERMISSIONS = PERMISSION_GROUPS.flatMap(({ group, permissions }) =>
  permissions.map(([key, label, description]) => ({ key, label, description, group }))
);
const PERMISSION_KEYS = new Set(PERMISSIONS.map(permission => permission.key));
const RESERVED_ADMIN_PERMISSION = 'access.manage';

const ALL = PERMISSIONS.map(permission => permission.key);
const SYSTEM_ROLES = [
  {
    name: 'admin',
    label: 'Administrator',
    description: 'Full control of the system, including roles, access and all settings.',
    legacyRole: 'admin',
    permissions: ALL
  },
  {
    name: 'manager',
    label: 'ICT Manager',
    description: 'Runs the service desk: assigns and reopens tickets, publishes knowledge, sets SLA rules and sees all reports.',
    legacyRole: 'staff',
    permissions: [
      'tickets.view', 'tickets.work', 'tickets.assign', 'tickets.escalate', 'tickets.reopen', 'tickets.export',
      'knowledge.contribute', 'knowledge.publish',
      'reports.view', 'users.view', 'status.manage', 'audit.view',
      'settings.service-desk'
    ]
  },
  {
    name: 'officer',
    label: 'ICT Officer',
    description: 'Handles tickets day to day and contributes to the knowledge base.',
    legacyRole: 'staff',
    permissions: [
      'tickets.view', 'tickets.work', 'tickets.escalate',
      'knowledge.contribute',
      'reports.view', 'users.view', 'status.manage'
    ]
  },
  {
    name: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to tickets, dashboards and reports (e.g. management or audit).',
    legacyRole: 'staff',
    permissions: ['tickets.view', 'reports.view', 'users.view', 'audit.view']
  },
  {
    name: 'user',
    label: 'Requester',
    description: 'Raises tickets by email or the Gmail add-on. Cannot sign in to this system.',
    legacyRole: 'user',
    permissions: []
  }
];
const SYSTEM_ROLE_NAMES = SYSTEM_ROLES.map(role => role.name);
const ROLE_LABELS = Object.fromEntries(SYSTEM_ROLES.map(role => [role.name, role.label]));

// Settings areas: which permission manages each section and which fields belong to it.
const SETTINGS_SECTIONS = {
  organization: 'settings.organization',
  email: 'settings.email',
  tickets: 'settings.service-desk',
  ldap: 'settings.directory'
};

const SETTINGS_FIELD_SECTIONS = {
  organizationName: 'organization',
  primaryColor: 'organization',
  secondaryColor: 'organization',
  supportEmail: 'organization',
  noreplyEmail: 'organization',
  emailFromName: 'organization',
  smtpHost: 'email',
  smtpPort: 'email',
  smtpSecure: 'email',
  smtpUser: 'email',
  smtpPassword: 'email',
  _newSmtpPassword: 'email',
  imapHost: 'email',
  imapPort: 'email',
  imapUser: 'email',
  imapPassword: 'email',
  _newImapPassword: 'email',
  imapEnabled: 'email',
  imapPollInterval: 'email',
  emailTestMode: 'email',
  emailTestAddress: 'email',
  ldapEnabled: 'ldap',
  ldapUrl: 'ldap',
  ldapBaseDn: 'ldap',
  ldapUserDnPrefix: 'ldap',
  ldapBindDn: 'ldap',
  ldapBindPassword: 'ldap',
  _newLdapBindPassword: 'ldap',
  ldapDomain: 'ldap',
  ldapUserSearchBase: 'ldap',
  ldapUserFilter: 'ldap',
  ldapDirectorateSearchBase: 'ldap',
  ldapDirectorateFilter: 'ldap',
  ldapUsernameAttribute: 'ldap',
  ldapEmailAttribute: 'ldap',
  ldapNameAttribute: 'ldap',
  ldapDepartmentAttribute: 'ldap',
  ldapIctGroupDn: 'ldap',
  ldapIctUserFilter: 'ldap',
  ldapDefaultRole: 'ldap',
  ldapSyncUsersEnabled: 'ldap',
  ticketNumberPrefix: 'tickets',
  defaultPriority: 'tickets',
  defaultCategory: 'tickets',
  defaultStatus: 'tickets',
  maxFileSize: 'tickets',
  allowedFileTypes: 'tickets',
  reopenWindowDays: 'tickets',
  slaWarningPercent: 'tickets',
  escalationEmails: 'tickets'
};

async function getPermissionsForUser(userId, client = prisma) {
  const assignments = await client.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          permissions: { select: { permission: { select: { key: true } } } }
        }
      }
    }
  });
  return [...new Set(assignments.flatMap(assignment =>
    assignment.role.permissions.map(item => item.permission.key)
  ))].filter(key => PERMISSION_KEYS.has(key));
}

async function userHasPermission(userId, permission, client = prisma) {
  const assignment = await client.userRole.findFirst({
    where: { userId, role: { permissions: { some: { permission: { key: permission } } } } },
    select: { id: true }
  });
  return Boolean(assignment);
}

// Creates/updates the permission catalogue and system roles, retires obsolete permission
// keys, renames the legacy "staff" role to "officer", and gives every user without a role
// the role matching their legacy user.role. Idempotent; runs at startup and in the seed.
async function ensureDefaultRoles(client = prisma) {
  const legacyStaff = await client.accessRole.findUnique({ where: { name: 'staff' } });
  const officer = await client.accessRole.findUnique({ where: { name: 'officer' } });
  if (legacyStaff && !officer) {
    await client.accessRole.update({ where: { id: legacyStaff.id }, data: { name: 'officer' } });
  }

  for (const permission of PERMISSIONS) {
    await client.accessPermission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: { key: permission.key, description: permission.description }
    });
  }
  // Remove permissions that no longer exist (e.g. old settings.*.view/update keys).
  await client.accessPermission.deleteMany({ where: { key: { notIn: [...PERMISSION_KEYS] } } });

  const permissionIds = new Map(
    (await client.accessPermission.findMany({ select: { id: true, key: true } })).map(item => [item.key, item.id])
  );

  for (const role of SYSTEM_ROLES) {
    const existing = await client.accessRole.findUnique({ where: { name: role.name } });
    const saved = existing
      ? await client.accessRole.update({ where: { id: existing.id }, data: { description: role.description, isSystem: true } })
      : await client.accessRole.create({ data: { name: role.name, description: role.description, isSystem: true } });

    const current = await client.rolePermission.count({ where: { roleId: saved.id } });
    // Administrator always has everything. Other system roles get their defaults when new or
    // empty (e.g. after obsolete keys were removed); later edits by administrators are kept.
    if (role.name === 'admin' || !existing || current === 0) {
      await client.rolePermission.deleteMany({ where: { roleId: saved.id } });
      const data = role.permissions.map(key => ({ roleId: saved.id, permissionId: permissionIds.get(key) })).filter(item => item.permissionId);
      if (data.length) await client.rolePermission.createMany({ data, skipDuplicates: true });
    }
  }

  const roles = await client.accessRole.findMany({ select: { id: true, name: true } });
  const idsByName = new Map(roles.map(role => [role.name, role.id]));
  const users = await client.user.findMany({
    select: { id: true, role: true, roleAssignments: { select: { id: true } } }
  });
  for (const user of users) {
    if (user.roleAssignments.length) continue;
    const roleName = user.role === 'admin' ? 'admin' : user.role === 'staff' ? 'officer' : 'user';
    await client.userRole.create({ data: { userId: user.id, roleId: idsByName.get(roleName) } });
  }
}

// Keeps the legacy user.role column (used by AD sync and display) consistent with roles.
function legacyRoleFor(roleNames) {
  if (roleNames.includes('admin')) return 'admin';
  if (roleNames.some(name => name !== 'user')) return 'staff';
  return 'user';
}

async function writeAuditLog({ actor, targetUser, role, action, details }, client = prisma) {
  await client.accessControlAuditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      targetUserId: targetUser?.id || null,
      targetUserEmail: targetUser?.email || null,
      roleId: role?.id || null,
      roleName: role?.name || null,
      action,
      ...(details ? { details } : {})
    }
  });
}

function isValidRolePermissionSet(roleName, permissionKeys) {
  return roleName === 'admin' || !permissionKeys.includes(RESERVED_ADMIN_PERMISSION);
}

// Working on, assigning, escalating, reopening or exporting tickets all require seeing them.
function normalizeRolePermissionKeys(permissionKeys) {
  const result = new Set(permissionKeys.filter(key => PERMISSION_KEYS.has(key)));
  const needsTicketView = ['tickets.work', 'tickets.assign', 'tickets.escalate', 'tickets.reopen', 'tickets.export'];
  if (needsTicketView.some(key => result.has(key))) result.add('tickets.view');
  if (result.has('knowledge.publish')) result.add('knowledge.contribute');
  return [...result];
}

function canReplaceUserRoles(actorId, targetUserId) {
  return actorId !== targetUserId;
}

function canRemoveLastAdmin(targetRole, assigningAdmin, remainingAdminCount) {
  return targetRole !== 'admin' || assigningAdmin || remainingAdminCount > 0;
}

function getRequiredSettingsPermissions(fields) {
  if (!fields.length || fields.some(field => !SETTINGS_FIELD_SECTIONS[field])) return null;
  return [...new Set(fields.map(field => SETTINGS_SECTIONS[SETTINGS_FIELD_SECTIONS[field]]))];
}

function createPermissionMiddleware(client = prisma) {
  return (...permissions) => async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      // Passing several permissions means "any of these".
      const assignment = await client.userRole.findFirst({
        where: {
          userId: req.user.id,
          role: { permissions: { some: { permission: { key: { in: permissions } } } } }
        },
        select: { id: true }
      });
      if (!assignment) {
        return res.status(403).json({ success: false, message: 'You do not have permission to do this' });
      }
      next();
    } catch (error) {
      console.error('Permission authorization error:', error);
      res.status(500).json({ success: false, message: 'Unable to verify permissions' });
    }
  };
}

const requirePermission = createPermissionMiddleware();

module.exports = {
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  RESERVED_ADMIN_PERMISSION,
  ROLE_LABELS,
  SETTINGS_SECTIONS,
  SETTINGS_FIELD_SECTIONS,
  SYSTEM_ROLES,
  SYSTEM_ROLE_NAMES,
  canRemoveLastAdmin,
  canReplaceUserRoles,
  createPermissionMiddleware,
  ensureDefaultRoles,
  getPermissionsForUser,
  getRequiredSettingsPermissions,
  isValidRolePermissionSet,
  legacyRoleFor,
  normalizeRolePermissionKeys,
  requirePermission,
  userHasPermission,
  writeAuditLog
};
