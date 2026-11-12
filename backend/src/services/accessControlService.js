const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  ['access-control.manage', 'Manage roles, permissions, and user role assignments'],
  ['settings.organization.view', 'View organization settings'],
  ['settings.organization.update', 'Update organization settings'],
  ['settings.email.view', 'View email and IMAP settings'],
  ['settings.email.update', 'Update email and IMAP settings'],
  ['settings.tickets.view', 'View ticket and SLA settings'],
  ['settings.tickets.update', 'Update ticket and SLA settings'],
  ['settings.ldap.view', 'View Active Directory and LDAP settings'],
  ['settings.ldap.update', 'Update Active Directory and LDAP settings'],
  ['settings.templates.view', 'View email templates'],
  ['settings.templates.create', 'Create email templates'],
  ['settings.templates.update', 'Update email templates'],
  ['settings.templates.delete', 'Delete email templates'],
  ['settings.templates.reset', 'Reset email templates to defaults'],
  ['settings.forms.view', 'View custom forms in Settings'],
  ['settings.forms.create', 'Create custom forms'],
  ['settings.forms.update', 'Update custom forms'],
  ['settings.forms.delete', 'Delete custom forms'],
  ['settings.notifications.view', 'View your notification preferences'],
  ['settings.notifications.update', 'Update your notification preferences'],
  ['settings.notifications.test', 'Send a test notification to your own account']
].map(([key, description]) => ({ key, description }));

const SETTINGS_SECTIONS = {
  organization: 'settings.organization',
  email: 'settings.email',
  tickets: 'settings.tickets',
  ldap: 'settings.ldap'
};

const SETTINGS_FIELD_SECTIONS = {
  organizationName: 'organization',
  organizationCode: 'organization',
  logoUrl: 'organization',
  faviconUrl: 'organization',
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
  ticketNumberFormat: 'tickets',
  defaultPriority: 'tickets',
  defaultCategory: 'tickets',
  defaultStatus: 'tickets',
  googleAddonApiUrl: 'tickets',
  googleAddonEnabled: 'tickets',
  maxFileSize: 'tickets',
  allowedFileTypes: 'tickets',
  maintenanceMode: 'tickets',
  maintenanceMessage: 'tickets',
  darkModeEnabled: 'organization',
  contrastMode: 'organization'
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
  ))];
}

async function ensureDefaultRoles(client = prisma) {
  const roles = [
    { name: 'admin', description: 'Full system and access-control administration' },
    { name: 'staff', description: 'Standard ICT staff access' },
    { name: 'user', description: 'Standard requester access' }
  ];

  for (const role of roles) {
    await client.accessRole.upsert({
      where: { name: role.name },
      update: { description: role.description, isSystem: true },
      create: { ...role, isSystem: true }
    });
  }

  for (const permission of PERMISSIONS) {
    await client.accessPermission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission
    });
  }

  const adminRole = await client.accessRole.findUnique({ where: { name: 'admin' } });
  const allPermissions = await client.accessPermission.findMany({ select: { id: true } });
  await client.rolePermission.createMany({
    data: allPermissions.map(permission => ({ roleId: adminRole.id, permissionId: permission.id })),
    skipDuplicates: true
  });
  const selfServicePermissions = await client.accessPermission.findMany({
    where: { key: { in: [
      'settings.notifications.view',
      'settings.notifications.update',
      'settings.notifications.test'
    ] } },
    select: { id: true }
  });
  const selfServiceRoles = await client.accessRole.findMany({
    where: { name: { in: ['staff', 'user'] } },
    select: { id: true }
  });
  await client.rolePermission.createMany({
    data: selfServiceRoles.flatMap(role => selfServicePermissions.map(permission => ({
      roleId: role.id,
      permissionId: permission.id
    }))),
    skipDuplicates: true
  });

  const users = await client.user.findMany({
    select: { id: true, role: true, roleAssignments: { select: { id: true } } }
  });
  const roleIds = await client.accessRole.findMany({ select: { id: true, name: true } });
  const idsByName = new Map(roleIds.map(role => [role.name, role.id]));
  for (const user of users) {
    if (user.roleAssignments.length) continue;
    const roleName = ['admin', 'staff'].includes(user.role) ? user.role : 'user';
    await client.userRole.create({
      data: { userId: user.id, roleId: idsByName.get(roleName) }
    });
  }
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
  return roleName === 'admin' || !permissionKeys.includes('access-control.manage');
}

function normalizeRolePermissionKeys(permissionKeys) {
  const result = new Set(permissionKeys);
  const viewPermissions = {
    'settings.organization.update': 'settings.organization.view',
    'settings.email.update': 'settings.email.view',
    'settings.tickets.update': 'settings.tickets.view',
    'settings.ldap.update': 'settings.ldap.view',
    'settings.templates.create': 'settings.templates.view',
    'settings.templates.update': 'settings.templates.view',
    'settings.templates.delete': 'settings.templates.view',
    'settings.templates.reset': 'settings.templates.view',
    'settings.forms.create': 'settings.forms.view',
    'settings.forms.update': 'settings.forms.view',
    'settings.forms.delete': 'settings.forms.view',
    'settings.notifications.update': 'settings.notifications.view',
    'settings.notifications.test': 'settings.notifications.view'
  };
  for (const key of result) {
    if (viewPermissions[key]) result.add(viewPermissions[key]);
  }
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
  return [...new Set(fields.map(field =>
    `settings.${SETTINGS_FIELD_SECTIONS[field]}.update`
  ))];
}

function createPermissionMiddleware(client = prisma) {
  return (permission) => async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const assignment = await client.userRole.findFirst({
        where: {
          userId: req.user.id,
          role: { permissions: { some: { permission: { key: permission } } } }
        },
        select: { id: true }
      });
      if (!assignment) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
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
  SETTINGS_SECTIONS,
  SETTINGS_FIELD_SECTIONS,
  getPermissionsForUser,
  ensureDefaultRoles,
  writeAuditLog,
  isValidRolePermissionSet,
  normalizeRolePermissionKeys,
  canReplaceUserRoles,
  canRemoveLastAdmin,
  getRequiredSettingsPermissions,
  createPermissionMiddleware,
  requirePermission
};
