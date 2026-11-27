// Browser sessions use an httpOnly cookie so the JWT is never readable by page scripts.
// API clients (scripts, tests) may still send "Authorization: Bearer <token>".

const SESSION_COOKIE = 'kuccps_session';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function parseCookies(header) {
  const cookies = {};
  String(header || '').split(';').forEach(part => {
    const index = part.indexOf('=');
    if (index < 0) return;
    const name = part.slice(0, index).trim();
    if (!name) return;
    try {
      cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      cookies[name] = part.slice(index + 1).trim();
    }
  });
  return cookies;
}

/**
 * Returns { token, source } where source is 'cookie' or 'bearer', or { token: null }.
 */
function getRequestToken(req) {
  const cookieToken = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (cookieToken) return { token: cookieToken, source: 'cookie' };
  const authHeader = req.headers.authorization || '';
  if (/^bearer /i.test(authHeader)) {
    const token = authHeader.slice(7).trim();
    if (token) return { token, source: 'bearer' };
  }
  return { token: null, source: null };
}

// CSRF defence in depth on top of SameSite=Strict: a state-changing request that relies on
// the cookie must carry X-Requested-With, which cross-site forms cannot set and CORS
// prevents other origins' scripts from sending.
function isCsrfSafe(req, source) {
  if (source !== 'cookie' || SAFE_METHODS.has(req.method)) return true;
  return String(req.headers['x-requested-with'] || '').toLowerCase() === 'xmlhttprequest';
}

function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {})
  };
}

function setSessionCookie(res, token, expiresAtSeconds) {
  const maxAgeMs = Math.max(0, expiresAtSeconds * 1000 - Date.now());
  res.cookie(SESSION_COOKIE, token, cookieOptions(maxAgeMs));
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

module.exports = {
  SESSION_COOKIE,
  clearSessionCookie,
  getRequestToken,
  isCsrfSafe,
  parseCookies,
  setSessionCookie
};
