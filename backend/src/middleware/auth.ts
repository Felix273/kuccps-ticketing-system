// Typed mirror of auth.js. The server runs auth.js (Node resolves require('./auth') to .js);
// this file is type-checked in CI. Keep both in sync when changing authentication.
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { getRequestToken, isCsrfSafe } from './sessionCookie';
import {
  SETTINGS_SECTIONS,
  getRequiredSettingsPermissions,
  getPermissionsForUser,
  requirePermission
} from '../services/accessControlService';
import { Request, Response, NextFunction } from 'express';


interface TokenUser {
  id: string;
  [key: string]: unknown;
}

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { token, source } = getRequestToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }
    if (!isCsrfSafe(req, source)) {
      res.status(403).json({ success: false, message: 'Missing anti-forgery header' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not set in environment variables');
      res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, async (err: jwt.VerifyErrors | null, tokenUser: unknown) => {
      if (err) {
        console.error('JWT verification failed:', err.message);

        if (err.name === 'TokenExpiredError') {
          res.status(401).json({
            success: false,
            message: 'Token has expired. Please login again.'
          });
          return;
        } else if (err.name === 'JsonWebTokenError') {
          res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.'
          });
          return;
        }

        res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
        return;
      }

      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: (tokenUser as TokenUser).id },
          select: { id: true, email: true, username: true, name: true, role: true, tokensRevokedAt: true }
        });
        if (!currentUser) {
          res.status(401).json({ success: false, message: 'User account is unavailable' });
          return;
        }
        // Tokens issued before the user's last logout/revocation are no longer valid.
        const issuedAt = Number((tokenUser as TokenUser).iat) || 0;
        if (currentUser.tokensRevokedAt &&
            issuedAt < Math.floor(currentUser.tokensRevokedAt.getTime() / 1000)) {
          res.status(401).json({ success: false, message: 'Session has ended. Please login again.' });
          return;
        }
        const { tokensRevokedAt: _revokedAt, ...activeUser } = currentUser;
        req.user = { ...(tokenUser as TokenUser), ...activeUser };
        next();
      } catch (error) {
        console.error('Authentication user lookup error:', error);
        res.status(500).json({ success: false, message: 'Unable to verify user account' });
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes((req.user as CurrentUser).role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }
    next();
  };
};

export const requireSettingsSection = (action: string) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const section = req.query.section as string;
  const permissionPrefix = (SETTINGS_SECTIONS as Record<string, string>)[section];
  if (!permissionPrefix) {
    res.status(403).json({ success: false, message: 'A permitted settings section is required' });
    return;
  }
  return requirePermission(`${permissionPrefix}.${action}`)(req, res, next);
};

export const requireSettingsUpdatePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fields = Object.keys(req.body || {});
    const required = getRequiredSettingsPermissions(fields);
    if (!required) {
      res.status(400).json({ success: false, message: 'Invalid settings fields' });
      return;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'ldapDefaultRole') && !['user', 'staff'].includes(req.body.ldapDefaultRole)) {
      res.status(400).json({ success: false, message: 'LDAP default role must be user or staff' });
      return;
    }
    const permissions = await getPermissionsForUser(req.user!.id);
    if (required.some((permission: string) => !permissions.includes(permission))) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  } catch (error) {
    console.error('Settings update authorization error:', error);
    res.status(500).json({ success: false, message: 'Unable to verify permissions' });
  }
};

export const requireAdmin = authorizeRoles('admin');
export const requireStaffOrAdmin = authorizeRoles('staff', 'admin');

export { requirePermission };
