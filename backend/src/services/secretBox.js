// Encryption at rest for credentials stored in SystemSettings (SMTP, IMAP, LDAP bind).
//
// Format: enc:v1:<iv base64url>:<auth tag base64url>:<ciphertext base64url>  (AES-256-GCM)
// Key:    SETTINGS_ENCRYPTION_KEY — 32 random bytes as 64 hex chars or base64. Required in
//         production. SETTINGS_ENCRYPTION_KEY_PREVIOUS may hold the old key during rotation.
// Values without the prefix are legacy plaintext; they are still readable and are
// re-encrypted at startup by encryptStoredSecrets().

const crypto = require('crypto');

const PREFIX = 'enc:v1:';
const SECRET_FIELDS = ['smtpPassword', 'imapPassword', 'ldapBindPassword'];

function parseKey(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (/^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, 'hex');
  const decoded = Buffer.from(value, 'base64');
  if (decoded.length === 32) return decoded;
  throw new Error('SETTINGS_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters or base64');
}

function getKeys() {
  let primary = parseKey(process.env.SETTINGS_ENCRYPTION_KEY);
  if (!primary) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SETTINGS_ENCRYPTION_KEY is required in production');
    }
    // Development convenience only: derive a stable key from JWT_SECRET.
    primary = crypto.createHash('sha256').update(`settings-key:${process.env.JWT_SECRET || 'dev'}`).digest();
  }
  const previous = parseKey(process.env.SETTINGS_ENCRYPTION_KEY_PREVIOUS);
  return previous ? [primary, previous] : [primary];
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptSecret(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return plaintext ?? null;
  if (isEncrypted(plaintext)) return plaintext;
  const [key] = getKeys();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

function decryptSecret(value) {
  if (!isEncrypted(value)) return value ?? null;
  const [iv, tag, ciphertext] = value.slice(PREFIX.length).split(':').map(part => Buffer.from(part, 'base64url'));
  for (const key of getKeys()) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
      // try the next key
    }
  }
  throw new Error('A stored credential could not be decrypted; check SETTINGS_ENCRYPTION_KEY');
}

// Returns a copy of a settings row with credential fields decrypted (for internal use only).
function withDecryptedSecrets(settings) {
  if (!settings) return settings;
  const copy = { ...settings };
  for (const field of SECRET_FIELDS) {
    try {
      copy[field] = decryptSecret(settings[field]);
    } catch (error) {
      console.error(`Settings credential ${field} unavailable:`, error.message);
      copy[field] = null;
    }
  }
  return copy;
}

// Encrypts any legacy plaintext credentials already in the database. Idempotent.
async function encryptStoredSecrets(prisma) {
  const rows = await prisma.systemSettings.findMany({
    select: { id: true, smtpPassword: true, imapPassword: true, ldapBindPassword: true }
  });
  let updated = 0;
  for (const row of rows) {
    const data = {};
    for (const field of SECRET_FIELDS) {
      if (row[field] && !isEncrypted(row[field])) data[field] = encryptSecret(row[field]);
    }
    if (Object.keys(data).length) {
      await prisma.systemSettings.update({ where: { id: row.id }, data });
      updated += 1;
    }
  }
  return updated;
}

module.exports = {
  SECRET_FIELDS,
  decryptSecret,
  encryptSecret,
  encryptStoredSecrets,
  isEncrypted,
  withDecryptedSecrets
};
