CREATE TABLE "AccessRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessPermission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessControlAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetUserEmail" TEXT,
    "roleId" TEXT,
    "roleName" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessControlAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessRole_name_key" ON "AccessRole"("name");
CREATE UNIQUE INDEX "AccessPermission_key_key" ON "AccessPermission"("key");
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX "AccessControlAuditLog_actorId_createdAt_idx" ON "AccessControlAuditLog"("actorId", "createdAt");
CREATE INDEX "AccessControlAuditLog_targetUserId_createdAt_idx" ON "AccessControlAuditLog"("targetUserId", "createdAt");
CREATE INDEX "AccessControlAuditLog_roleId_createdAt_idx" ON "AccessControlAuditLog"("roleId", "createdAt");

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "AccessPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AccessRole" ("id", "name", "description", "isSystem", "updatedAt") VALUES
    ('rbac-role-admin', 'admin', 'Full system and access-control administration', true, CURRENT_TIMESTAMP),
    ('rbac-role-staff', 'staff', 'Standard ICT staff access', true, CURRENT_TIMESTAMP),
    ('rbac-role-user', 'user', 'Standard requester access', true, CURRENT_TIMESTAMP);

INSERT INTO "AccessPermission" ("id", "key", "description") VALUES
    ('rbac-perm-admin', 'access-control.manage', 'Manage roles, permissions, and user role assignments'),
    ('rbac-perm-org-view', 'settings.organization.view', 'View organization settings'),
    ('rbac-perm-org-update', 'settings.organization.update', 'Update organization settings'),
    ('rbac-perm-email-view', 'settings.email.view', 'View email and IMAP settings'),
    ('rbac-perm-email-update', 'settings.email.update', 'Update email and IMAP settings'),
    ('rbac-perm-tickets-view', 'settings.tickets.view', 'View ticket and SLA settings'),
    ('rbac-perm-tickets-update', 'settings.tickets.update', 'Update ticket and SLA settings'),
    ('rbac-perm-ldap-view', 'settings.ldap.view', 'View Active Directory and LDAP settings'),
    ('rbac-perm-ldap-update', 'settings.ldap.update', 'Update Active Directory and LDAP settings'),
    ('rbac-perm-templates-view', 'settings.templates.view', 'View email templates'),
    ('rbac-perm-templates-create', 'settings.templates.create', 'Create email templates'),
    ('rbac-perm-templates-update', 'settings.templates.update', 'Update email templates'),
    ('rbac-perm-templates-delete', 'settings.templates.delete', 'Delete email templates'),
    ('rbac-perm-templates-reset', 'settings.templates.reset', 'Reset email templates to defaults'),
    ('rbac-perm-forms-view', 'settings.forms.view', 'View custom forms in Settings'),
    ('rbac-perm-forms-create', 'settings.forms.create', 'Create custom forms'),
    ('rbac-perm-forms-update', 'settings.forms.update', 'Update custom forms'),
    ('rbac-perm-forms-delete', 'settings.forms.delete', 'Delete custom forms'),
    ('rbac-perm-notifications-view', 'settings.notifications.view', 'View your notification preferences'),
    ('rbac-perm-notifications-update', 'settings.notifications.update', 'Update your notification preferences'),
    ('rbac-perm-notifications-test', 'settings.notifications.test', 'Send a test notification to your own account');

INSERT INTO "UserRole" ("id", "userId", "roleId", "createdAt")
SELECT 'rbac-user-role-' || md5(u."id" || ':' || r."id"), u."id", r."id", CURRENT_TIMESTAMP
FROM "User" u
JOIN "AccessRole" r ON r."name" = CASE WHEN u."role" IN ('admin', 'staff') THEN u."role" ELSE 'user' END;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId")
SELECT 'rbac-role-perm-' || md5(r."id" || ':' || p."id"), r."id", p."id"
FROM "AccessRole" r
CROSS JOIN "AccessPermission" p
WHERE r."name" = 'admin';

INSERT INTO "RolePermission" ("id", "roleId", "permissionId")
SELECT 'rbac-self-notifications-' || md5(r."id" || ':' || p."id"), r."id", p."id"
FROM "AccessRole" r
JOIN "AccessPermission" p ON p."key" IN (
    'settings.notifications.view',
    'settings.notifications.update',
    'settings.notifications.test'
)
WHERE r."name" IN ('staff', 'user');
