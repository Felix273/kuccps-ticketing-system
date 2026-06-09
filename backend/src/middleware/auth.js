const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Ensure JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not set in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT verification failed:', err.message);
        
        // Provide specific error messages
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false, 
            message: 'Token has expired. Please login again.' 
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ 
            success: false, 
            message: 'Invalid token. Please login again.' 
          });
        }
        
        return res.status(403).json({ 
          success: false, 
          message: 'Authentication failed' 
        });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

const requireAdmin = authorizeRoles('admin');
const requireStaffOrAdmin = authorizeRoles('staff', 'admin');

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
  requireStaffOrAdmin
};
