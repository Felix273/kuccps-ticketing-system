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

test('non-admin roles cannot receive access-control management permission', () => {
  assert.equal(isValidRolePermissionSet('support', ['settings.email.view']), true);
  assert.equal(isValidRolePermissionSet('support', ['access-control.manage']), false);
  assert.equal(isValidRolePermissionSet('admin', ['access-control.manage']), true);
});

test('write permissions automatically include the matching view permission', () => {
  assert.deepEqual(
    normalizeRolePermissionKeys(['settings.forms.create', 'settings.email.update']),
    ['settings.forms.create', 'settings.email.update', 'settings.forms.view', 'settings.email.view']
  );
});

test('settings updates require the permission for every submitted field', () => {
  assert.deepEqual(
    getRequiredSettingsPermissions(['organizationName', 'logoUrl']),
    ['settings.organization.update']
  );
  assert.deepEqual(
    getRequiredSettingsPermissions(['organizationName', 'smtpHost']),
    ['settings.organization.update', 'settings.email.update']
  );
  assert.equal(getRequiredSettingsPermissions(['admin']), null);
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
