ALTER TABLE "User"
ADD COLUMN "ldapDn" TEXT,
ADD COLUMN "ldapObjectGuid" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

ALTER TABLE "SystemSettings"
ADD COLUMN "ldapBindDn" TEXT,
ADD COLUMN "ldapBindPassword" TEXT,
ADD COLUMN "ldapDomain" TEXT,
ADD COLUMN "ldapUserSearchBase" TEXT,
ADD COLUMN "ldapUserFilter" TEXT DEFAULT '(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
ADD COLUMN "ldapDirectorateSearchBase" TEXT,
ADD COLUMN "ldapDirectorateFilter" TEXT DEFAULT '(|(objectClass=organizationalUnit)(objectClass=group))',
ADD COLUMN "ldapUsernameAttribute" TEXT NOT NULL DEFAULT 'sAMAccountName',
ADD COLUMN "ldapEmailAttribute" TEXT NOT NULL DEFAULT 'mail',
ADD COLUMN "ldapNameAttribute" TEXT NOT NULL DEFAULT 'displayName',
ADD COLUMN "ldapDepartmentAttribute" TEXT NOT NULL DEFAULT 'department',
ADD COLUMN "ldapIctGroupDn" TEXT,
ADD COLUMN "ldapIctUserFilter" TEXT,
ADD COLUMN "ldapDefaultRole" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN "ldapSyncUsersEnabled" BOOLEAN NOT NULL DEFAULT true;
