const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adService = require('../services/adService');
const { auditLog } = require('../middleware/security');
const { clearSessionCookie, getRequestToken, setSessionCookie } = require('../middleware/sessionCookie');

const prisma = require('../lib/prisma');

// Generate JWT Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h', algorithm: 'HS256' }
  );
};

// Pre-computed hash used to equalise response time for unknown usernames,
// so login timing does not reveal which accounts exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);
const { getPermissionsForUser } = require('../services/accessControlService');

// Login with username and password (AD/LDAP Authentication)
exports.login = async (req, res) => {
  try {
    const { username: rawUsername, password } = req.body || {};

    if (typeof rawUsername !== 'string' || typeof password !== 'string' || !rawUsername.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    if (rawUsername.length > 254 || password.length > 1024) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    const username = rawUsername.trim();

    const adSettings = await adService.getAdSettings();
    let user;

    if (adSettings.ldapEnabled) {
      try {
        const authResult = await adService.authenticate(username, password);
        if (!authResult.isIct) {
          auditLog('auth.denied_non_ict', { requestId: req.id, username });
          return res.status(403).json({
            success: false,
            message: 'Access denied. Only ICT staff and administrators can access this system.'
          });
        }
        user = await adService.upsertAdUser(authResult.adUser, authResult.settings, 'staff');
      } catch (ldapError) {
        auditLog('auth.ldap_failed', { requestId: req.id, username, error: ldapError.message });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Active Directory credentials' 
        });
      }
    } else {
      user = await prisma.user.findUnique({
        where: { username },
        include: { department: true }
      });

      if (!user) {
        await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
        auditLog('auth.local_failed_unknown_user', { requestId: req.id, username });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Directory-synced accounts must authenticate against Active Directory;
      // their local password hash is a random placeholder and is never accepted.
      if (user.ldapSync) {
        await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
        auditLog('auth.local_denied_directory_account', { requestId: req.id, username });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isValidPassword = user.password
        ? await bcrypt.compare(password, user.password)
        : await bcrypt.compare(password, DUMMY_PASSWORD_HASH).then(() => false);
      
      if (!isValidPassword) {
        auditLog('auth.local_failed_bad_password', { requestId: req.id, username });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

    }

    // This is an ICT console: only accounts holding a role with at least one permission
    // (Administrator, ICT Manager, ICT Officer, Viewer or a custom role) can sign in.
    const permissions = await getPermissionsForUser(user.id);
    if (!permissions.length) {
      auditLog('auth.denied_non_staff', { requestId: req.id, username: user.username });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your account has no role in the ICT service desk. Contact an administrator.'
      });
    }

    const token = generateToken(user);
    auditLog('auth.login_success', { requestId: req.id, username: user.username, email: user.email, role: user.role });

    // Browsers get the session as an httpOnly cookie; the token is only returned in the
    // body to API clients that explicitly ask for bearer mode.
    setSessionCookie(res, token, jwt.decode(token).exp);
    const wantsBearer = String(req.headers['x-auth-mode'] || '').toLowerCase() === 'bearer';

    res.json({
      success: true,
      message: 'Login successful',
      ...(wantsBearer ? { token } : {}),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', { requestId: req.id, message: error.message });
    res.status(500).json({ 
      success: false, 
      message: 'Login failed'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', { requestId: req.id, message: error.message });
    res.status(500).json({ 
      success: false, 
      message: 'Server error'
    });
  }
};

// Logout: revoke every token issued to this user up to now.
// Logout: revoke every token issued to this user up to now and clear the session cookie.
// Works even when the session has already expired, so the cookie is always removed.
exports.logout = async (req, res) => {
  try {
    const { token } = getRequestToken(req);
    let payload = null;
    if (token && process.env.JWT_SECRET) {
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], ignoreExpiration: true });
      } catch {
        payload = null;
      }
    }
    if (payload?.id) {
      await prisma.user.updateMany({
        where: { id: payload.id },
        data: { tokensRevokedAt: new Date() }
      });
      auditLog('auth.logout', { requestId: req.id, username: payload.username });
    }
    clearSessionCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', { requestId: req.id, message: error.message });
    clearSessionCookie(res);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};
