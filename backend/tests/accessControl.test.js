const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createPermissionMiddleware,
  isValidRolePermissionSet,
  normalizeRolePermissionKeys,
  canReplaceUserRoles,
  canRemoveLastAdmin,
  getRequiredSettingsPermissions
} = require('../src/services/accessControlService');

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('permission middleware allows an explicitly granted permission', async () => {
  const guard = createPermissionMiddleware({
    userRole: { findFirst: async () => ({ id: 'assignment-1' }) }
  })('settings.email.view');
  const req = { user: { id: 'user-1' } };
  const res = responseRecorder();
  let nextCalled = false;

  await guard(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('permission middleware denies ungranted permissions by default', async () => {
  const guard = createPermissionMiddleware({
    userRole: { findFirst: async () => null }
  })('settings.email.update');
  const res = responseRecorder();
  let nextCalled = false;

  await guard({ user: { id: 'user-1' } }, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('permission middleware fails closed when there is no authenticated user', async () => {
  const guard = createPermissionMiddleware({
    userRole: { findFirst: async () => ({ id: 'unexpected' }) }
  })('settings.email.view');
  const res = responseRecorder();

  await guard({}, res, () => assert.fail('next must not be called'));

  assert.equal(res.statusCode, 401);
});

test('non-admin roles cannot receive access management permission', () => {
  assert.equal(isValidRolePermissionSet('officer', ['settings.email']), true);
  assert.equal(isValidRolePermissionSet('officer', ['access.manage']), false);
  assert.equal(isValidRolePermissionSet('admin', ['access.manage']), true);
});

test('ticket actions and publishing imply the permissions they depend on; unknown keys are dropped', () => {
  assert.deepEqual(
    normalizeRolePermissionKeys(['tickets.assign', 'knowledge.publish', 'not.a.permission']).sort(),
    ['knowledge.contribute', 'knowledge.publish', 'tickets.assign', 'tickets.view']
  );
});

test('settings updates require the manage permission for every submitted area', () => {
  assert.deepEqual(getRequiredSettingsPermissions(['organizationName', 'primaryColor']), ['settings.organization']);
  assert.deepEqual(
    getRequiredSettingsPermissions(['organizationName', 'smtpHost']),
    ['settings.organization', 'settings.email']
  );
  assert.deepEqual(getRequiredSettingsPermissions(['slaWarningPercent']), ['settings.service-desk']);
  // Retired settings (maintenance mode, logo URL, dark mode...) are rejected.
  assert.equal(getRequiredSettingsPermissions(['logoUrl']), null);
  assert.equal(getRequiredSettingsPermissions(['admin']), null);
});

test('system roles describe a realistic ICT directorate', () => {
  const { SYSTEM_ROLES, PERMISSIONS } = require('../src/services/accessControlService');
  const byName = Object.fromEntries(SYSTEM_ROLES.map(role => [role.name, new Set(role.permissions)]));
  assert.equal(byName.admin.size, PERMISSIONS.length);
  assert.ok(byName.manager.has('tickets.assign') && byName.manager.has('knowledge.publish') && !byName.manager.has('access.manage'));
  assert.ok(byName.officer.has('tickets.work') && !byName.officer.has('tickets.assign') && !byName.officer.has('knowledge.publish'));
  assert.ok(byName.viewer.has('tickets.view') && !byName.viewer.has('tickets.work'));
  assert.equal(byName.user.size, 0);
});

test('a user cannot change their own roles', () => {
  assert.equal(canReplaceUserRoles('user-1', 'user-1'), false);
  assert.equal(canReplaceUserRoles('admin-1', 'user-1'), true);
});

test('the last administrator cannot be removed or demoted', () => {
  assert.equal(canRemoveLastAdmin('admin', false, 0), false);
  assert.equal(canRemoveLastAdmin('admin', false, 1), true);
  assert.equal(canRemoveLastAdmin('admin', true, 0), true);
  assert.equal(canRemoveLastAdmin('staff', false, 0), true);
});
