const { PrismaClient, Prisma } = require('@prisma/client');
const {
  PERMISSIONS,
  getPermissionsForUser,
  writeAuditLog,
  isValidRolePermissionSet,
  normalizeRolePermissionKeys,
  canReplaceUserRoles,
  canRemoveLastAdmin
} = require('../services/accessControlService');

const prisma = new PrismaClient();
const RESERVED_ADMIN_PERMISSION = 'access-control.manage';

function getActor(req) {
  return { id: req.user.id, email: req.user.email || '' };
}

exports.getMyAccess = async (req, res) => {
  try {
    const [permissions, adminRole] = await Promise.all([
      getPermissionsForUser(req.user.id),
      prisma.userRole.findFirst({
        where: { userId: req.user.id, role: { name: 'admin' } },
        select: { id: true }
      })
    ]);
    res.json({ success: true, permissions, isAdmin: Boolean(adminRole) });
  } catch (error) {
    console.error('Get current access error:', error);
    res.status(500).json({ success: false, message: 'Failed to load access permissions' });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await prisma.accessRole.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({
      success: true,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        userCount: role._count.users,
        permissions: role.permissions.map(item => item.permission.key)
      })),
      permissions: PERMISSIONS
    });
  } catch (error) {
    console.error('Get access roles error:', error);
    res.status(500).json({ success: false, message: 'Failed to load roles' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim().toLowerCase() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : null;
    const permissionKeys = req.body.permissions;
    if (!/^[a-z][a-z0-9_-]{1,39}$/.test(name) || !Array.isArray(permissionKeys)) {
      return res.status(400).json({ success: false, message: 'A valid role name and permissions are required' });
    }
    const known = new Set(PERMISSIONS.map(permission => permission.key));
    const normalizedKeys = normalizeRolePermissionKeys(permissionKeys);
    if (permissionKeys.some(key => !known.has(key)) ||
        !isValidRolePermissionSet(name, normalizedKeys)) {
      return res.status(400).json({ success: false, message: 'Invalid or reserved permissions' });
    }

    const role = await prisma.$transaction(async tx => {
      const created = await tx.accessRole.create({ data: { name, description, isSystem: false } });
      const permissions = await tx.accessPermission.findMany({
        where: { key: { in: normalizedKeys } },
        select: { id: true }
      });
      if (permissions.length) {
        await tx.rolePermission.createMany({
          data: permissions.map(permission => ({ roleId: created.id, permissionId: permission.id }))
        });
      }
      await writeAuditLog({
        actor: getActor(req),
        role: created,
        action: 'role.created',
        details: { permissions: normalizedKeys }
      }, tx);
      return created;
    });
    res.status(201).json({ success: true, role });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A role with that name already exists' });
    }
    console.error('Create access role error:', error);
    res.status(500).json({ success: false, message: 'Failed to create role' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const permissionKeys = req.body.permissions;
    if (!Array.isArray(permissionKeys)) {
      return res.status(400).json({ success: false, message: 'Permissions must be an array' });
    }
    const role = await prisma.accessRole.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    if (role.name === 'admin') {
      return res.status(403).json({ success: false, message: 'The protected administrator role cannot be edited' });
    }
    const assignedToActor = await prisma.userRole.findFirst({
      where: { userId: req.user.id, roleId: role.id },
      select: { id: true }
    });
    if (assignedToActor) {
      return res.status(403).json({ success: false, message: 'You cannot edit permissions for a role assigned to yourself' });
    }
    const known = new Set(PERMISSIONS.map(permission => permission.key));
    const uniqueKeys = normalizeRolePermissionKeys([...new Set(permissionKeys)]);
    if (uniqueKeys.some(key => !known.has(key)) ||
        !isValidRolePermissionSet(role.name, uniqueKeys)) {
      return res.status(400).json({ success: false, message: 'Invalid or reserved permissions' });
    }

    const previousPermissions = (await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permission: { select: { key: true } } }
    })).map(item => item.permission.key);
    await prisma.$transaction(async tx => {
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      const permissions = await tx.accessPermission.findMany({
        where: { key: { in: uniqueKeys } },
        select: { id: true }
      });
      if (permissions.length) {
        await tx.rolePermission.createMany({
          data: permissions.map(permission => ({ roleId: role.id, permissionId: permission.id }))
        });
      }
      await writeAuditLog({
        actor: getActor(req),
        role,
        action: 'role.permissions_updated',
        details: { previousPermissions, permissions: uniqueKeys }
      }, tx);
    });
    res.json({ success: true, message: 'Role permissions updated' });
  } catch (error) {
    console.error('Update access role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role permissions' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await prisma.accessRole.findUnique({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    if (role.isSystem || role.name === 'admin') {
      return res.status(403).json({ success: false, message: 'System roles cannot be deleted' });
    }
    const assignedToActor = await prisma.userRole.findFirst({
      where: { userId: req.user.id, roleId: role.id },
      select: { id: true }
    });
    if (assignedToActor) {
      return res.status(403).json({ success: false, message: 'You cannot delete a role assigned to yourself' });
    }
    const previousPermissions = (await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permission: { select: { key: true } } }
    })).map(item => item.permission.key);
    const users = await prisma.userRole.count({ where: { roleId: role.id } });
    if (users) {
      return res.status(409).json({ success: false, message: 'Remove this role from users before deleting it' });
    }
    await prisma.$transaction(async tx => {
      await tx.accessRole.delete({ where: { id: role.id } });
      await writeAuditLog({
        actor: getActor(req),
        role,
        action: 'role.deleted',
        details: { permissions: previousPermissions }
      }, tx);
    });
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    console.error('Delete access role error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        roleAssignments: { select: { role: { select: { id: true, name: true } } } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        roles: user.roleAssignments.map(assignment => assignment.role),
        roleAssignments: undefined
      }))
    });
  } catch (error) {
    console.error('Get access users error:', error);
    res.status(500).json({ success: false, message: 'Failed to load user roles' });
  }
};

exports.replaceUserRoles = async (req, res) => {
  const { userId } = req.params;
  const roleIds = req.body.roleIds;
  if (!canReplaceUserRoles(req.user.id, userId)) {
    return res.status(403).json({ success: false, message: 'You cannot change your own roles' });
  }
  if (!Array.isArray(roleIds) || roleIds.some(id => typeof id !== 'string')) {
    return res.status(400).json({ success: false, message: 'Role IDs must be an array' });
  }

  try {
    const uniqueRoleIds = [...new Set(roleIds)];
    const result = await prisma.$transaction(async tx => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true }
      });
      if (!target) throw Object.assign(new Error('User not found'), { status: 404 });

      const roles = await tx.accessRole.findMany({
        where: { id: { in: uniqueRoleIds } },
        include: { permissions: { include: { permission: true } } }
      });
      if (roles.length !== uniqueRoleIds.length) {
        throw Object.assign(new Error('One or more roles do not exist'), { status: 400 });
      }
      if (roles.some(role => role.permissions.some(item => item.permission.key === RESERVED_ADMIN_PERMISSION) &&
          role.name !== 'admin')) {
        throw Object.assign(new Error('Only the protected administrator role may grant access-control management'), { status: 400 });
      }

      const assigningAdmin = roles.some(role => role.name === 'admin');
      let remainingAdmins = 0;
      if (target.role === 'admin' && !assigningAdmin) {
        remainingAdmins = await tx.user.count({
          where: { role: 'admin', id: { not: userId } }
        });
      }
      if (!canRemoveLastAdmin(target.role, assigningAdmin, remainingAdmins)) {
        throw Object.assign(new Error('The last administrator cannot be removed'), { status: 409 });
      }

      const legacyRole = assigningAdmin
        ? 'admin'
        : roles.some(role => role.name === 'staff')
          ? 'staff'
          : roles.some(role => role.name === 'user')
            ? 'user'
            : target.role === 'admin' ? 'staff' : 'user';

      const previousRoles = (await tx.userRole.findMany({
        where: { userId },
        select: { role: { select: { name: true } } }
      })).map(item => item.role.name);
      await tx.userRole.deleteMany({ where: { userId } });
      if (uniqueRoleIds.length) {
        await tx.userRole.createMany({
          data: uniqueRoleIds.map(roleId => ({ userId, roleId, assignedById: req.user.id }))
        });
      }
      await tx.user.update({ where: { id: userId }, data: { role: legacyRole } });
      await writeAuditLog({
        actor: getActor(req),
        targetUser: target,
        action: 'user.roles_replaced',
        details: {
          previousRoles,
          roles: roles.map(role => role.name)
        }
      }, tx);
      return { userId, roles: roles.map(role => role.name) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.json({ success: true, assignment: result });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    if (error.code === 'P2034') {
      return res.status(409).json({ success: false, message: 'Concurrent role change detected; reload and try again' });
    }
    console.error('Replace user roles error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user roles' });
  }
};

exports.getAuditLog = async (req, res) => {
  try {
    const logs = await prisma.accessControlAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get access-control audit log error:', error);
    res.status(500).json({ success: false, message: 'Failed to load audit log' });
  }
};
