const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDelimitedValues } = require('../src/services/normalizedValues');
const {
  DEFAULT_ALLOWED_FILE_TYPES,
  getDefaultAllowedFileTypesRelation
} = require('../src/services/systemSettingsDefaults');

test('parses delimited values, trims whitespace, and deduplicates case-insensitively', () => {
  assert.deepEqual(
    parseDelimitedValues(' Email, printer, email,  VPN '),
    ['Email', 'printer', 'VPN']
  );
});

test('accepts arrays and removes empty entries', () => {
  assert.deepEqual(
    parseDelimitedValues([' Network ', '', 'network', 'Email, VPN']),
    ['Network', 'Email', 'VPN']
  );
});

test('returns no values for empty input', () => {
  assert.deepEqual(parseDelimitedValues(null), []);
  assert.deepEqual(parseDelimitedValues(' ,  , '), []);
});

test('default upload extensions are initialized as normalized relational rows', () => {
  assert.deepEqual(
    getDefaultAllowedFileTypesRelation().create.map(({ extension }) => extension),
    parseDelimitedValues(DEFAULT_ALLOWED_FILE_TYPES)
  );
});
