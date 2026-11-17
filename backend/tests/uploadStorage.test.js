const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { resolveUploadPath } = require('../src/services/uploadStorage');

test('upload paths resolve only to files beneath the configured storage directory', () => {
  const root = path.resolve('/srv/kuccps/uploads');

  assert.equal(
    resolveUploadPath(path.join(root, 'ticket-file'), root),
    path.join(root, 'ticket-file')
  );
  assert.equal(resolveUploadPath('ticket-file', root), path.join(root, 'ticket-file'));
  assert.equal(resolveUploadPath(path.join(root, '..', 'private.key'), root), null);
  assert.equal(resolveUploadPath(root, root), null);
});
