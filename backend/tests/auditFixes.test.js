const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSettingsUpdate } = require('../src/services/settingsValidation');
const { formatTicketDate, sanitizePrefix } = require('../src/services/ticketNumber');
const { escapeHtml, textToHtml, safeColor } = require('../src/utils/html');
const { isIctUser } = require('../src/services/adService');
const { htmlToText, isAutomatedMessage } = require('../src/services/emailService');

function headers(entries = {}) {
  return new Map(Object.entries(entries));
}

test('settings validation coerces types and rejects unsafe values', () => {
  const ok = validateSettingsUpdate({
    smtpPort: '587',
    smtpSecure: 'false',
    primaryColor: '#990024',
    ticketNumberPrefix: 'kuc',
    defaultStatus: 'In Progress',
    defaultPriority: 'very high',
    allowedFileTypes: 'PDF, .docx ,png',
    smtpPassword: '********'
  });
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.data.smtpPort, 587);
  assert.equal(ok.data.smtpSecure, false);
  assert.equal(ok.data.ticketNumberPrefix, 'KUC');
  assert.equal(ok.data.defaultStatus, 'InProgress');
  assert.equal(ok.data.defaultPriority, 'VeryHigh');
  assert.equal(ok.data.allowedFileTypes, 'pdf,docx,png');
  assert.equal('smtpPassword' in ok.data, false, 'masked secret must keep the stored value');

  const bad = validateSettingsUpdate({
    primaryColor: 'red;background:url(x)',
    logoUrl: 'javascript:alert(1)',
    smtpPort: 70000,
    ticketNumberPrefix: 'TI-CK',
    defaultStatus: 'Closed',
    organizationName: '',
    unknownField: true
  });
  assert.equal(bad.errors.length, 7);
  assert.deepEqual(bad.data, {});
});

test('ticket numbers use the organisation timezone and a safe prefix', () => {
  // 22:30 UTC on 31 Dec is already 1 Jan in Nairobi (UTC+3).
  assert.equal(formatTicketDate(new Date('2026-12-31T22:30:00Z'), 'Africa/Nairobi'), '20270101');
  assert.equal(sanitizePrefix('it-desk'), 'ITDESK');
  assert.equal(sanitizePrefix(''), 'TICK');
});

test('email values are HTML-escaped and colours are validated', () => {
  assert.equal(escapeHtml('<a href="x">\'&'), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  assert.equal(textToHtml('line 1\nline <2>'), 'line 1<br>line &lt;2&gt;');
  assert.equal(safeColor('#abc', '#000'), '#abc');
  assert.equal(safeColor('red"><script>', '#000'), '#000');
});

test('ICT access is granted by whole-word department/OU match or the configured group only', () => {
  const noGroup = {};
  const user = (department, dn, memberOf = []) => ({ department, dn, memberOf });
  assert.equal(isIctUser(user('Finance', 'CN=Victor Benedict,OU=Finance,DC=kuccps'), noGroup), false);
  assert.equal(isIctUser(user('District Liaison', 'CN=Ann,OU=District,DC=kuccps'), noGroup), false);
  assert.equal(isIctUser(user('ICT', 'CN=Jo,OU=Staff,DC=kuccps'), noGroup), true);
  assert.equal(isIctUser(user('', 'CN=Jo,OU=ICT,DC=kuccps'), noGroup), true);
  assert.equal(isIctUser(user('Information and Communication Technology', ''), noGroup), true);

  const withGroup = { ldapIctGroupDn: 'CN=ICT Staff,DC=kuccps' };
  assert.equal(isIctUser(user('ICT', ''), withGroup), false, 'group membership is authoritative when configured');
  assert.equal(isIctUser(user('HR', '', ['cn=ict staff,dc=kuccps']), withGroup), true);
});

test('inbound auto-replies, bounces and self-sent mail are ignored', () => {
  const own = new Set(['itsupport@kuccps.ac.ke']);
  assert.equal(isAutomatedMessage({ headers: headers({ 'auto-submitted': 'auto-replied' }) }, 'user@x.org', own), true);
  assert.equal(isAutomatedMessage({ headers: headers({ precedence: 'bulk' }) }, 'user@x.org', own), true);
  assert.equal(isAutomatedMessage({ headers: headers() }, 'mailer-daemon@x.org', own), true);
  assert.equal(isAutomatedMessage({ headers: headers() }, 'itsupport@kuccps.ac.ke', own), true);
  assert.equal(isAutomatedMessage({ headers: headers({ 'auto-submitted': 'no' }) }, 'user@x.org', own), false);
});

test('HTML-only inbound email is stored as plain text', () => {
  const text = htmlToText('<p>Printer <b>offline</b></p><script>alert(1)</script><div>Floor&nbsp;2</div>');
  assert.match(text, /Printer\s+offline/);
  assert.match(text, /Floor 2/);
  assert.doesNotMatch(text, /<|alert/);
});
