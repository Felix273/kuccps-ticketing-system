const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ldap = require('ldapjs');

const prisma = new PrismaClient();

// LDAP Authentication Helper
const authenticateWithLDAP = (username, password) => {
  return new Promise((resolve, reject) => {
    if (!process.env.LDAP_URL || !process.env.LDAP_BASE_DN) {
      return reject(new Error('LDAP configuration is missing'));
    }

    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });

    // Construct the user DN
    const userDN = `${process.env.LDAP_USER_DN_PREFIX || 'cn'}=${username},${process.env.LDAP_BASE_DN}`;

    client.bind(userDN, password, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error('Invalid AD credentials'));
      }

      // Search for user details
      const searchOptions = {
        filter: `(${process.env.LDAP_USER_DN_PREFIX || 'cn'}=${username})`,
        scope: 'sub',
        attributes: ['cn', 'mail', 'displayName', 'department', 'memberOf']
      };

      client.search(process.env.LDAP_BASE_DN, searchOptions, (err, res) => {
        if (err) {
          client.unbind();
          return reject(new Error('LDAP search failed'));
        }

        let userInfo = null;

        res.on('searchEntry', (entry) => {
          const attributes = entry.object;
          userInfo = {
            username: attributes.cn || username,
            email: attributes.mail || `${username}@kuccps.ac.ke`,
            name: attributes.displayName || attributes.cn || username,
            department: attributes.department || 'ICT',
            groups: attributes.memberOf || []
          };
        });

        res.on('error', (err) => {
          client.unbind();
          reject(new Error('LDAP search error'));
        });

        res.on('end', () => {
          client.unbind();
          if (userInfo) {
            resolve(userInfo);
          } else {
            reject(new Error('User not found in AD'));
          }
        });
      });
    });
  });
};

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
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Login with username and password (AD/LDAP Authentication)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Authenticate against Active Directory
    let adUserInfo;
    
    // Check if LDAP is enabled
    const useLDAP = process.env.USE_LDAP_AUTH !== 'false';
    
    if (useLDAP) {
      try {
        adUserInfo = await authenticateWithLDAP(username, password);
      } catch (ldapError) {
        console.error('LDAP authentication failed:', ldapError.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Active Directory credentials' 
        });
      }
    } else {
      // Fallback to local authentication for development
      const user = await prisma.user.findUnique({
        where: { username },
        include: { department: true }
      });

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Mock AD user info from local user
      adUserInfo = {
        username: user.username,
        email: user.email,
        name: user.name,
        department: user.department?.name || 'ICT',
        groups: []
      };
    }

    // Check if user's department is ICT
    const userDepartment = adUserInfo.department?.toLowerCase() || '';
    if (!userDepartment.includes('ict') && !userDepartment.includes('information')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only ICT department staff can access this system.' 
      });
    }

    // Find or create user in local database
    let user = await prisma.user.findUnique({
      where: { username: adUserInfo.username },
      include: { department: true }
    });

    if (!user) {
      // Get or create ICT department
      let ictDepartment = await prisma.department.findFirst({
        where: { 
          OR: [
            { name: { contains: 'ICT', mode: 'insensitive' } },
            { name: { contains: 'Information', mode: 'insensitive' } }
          ]
        }
      });

      if (!ictDepartment) {
        ictDepartment = await prisma.department.create({
          data: {
            name: 'ICT',
            code: 'ICT'
          }
        });
      }

      // Create new user from AD info
      user = await prisma.user.create({
        data: {
          username: adUserInfo.username,
          email: adUserInfo.email,
          name: adUserInfo.name,
          password: await bcrypt.hash(password, 10), // Store hashed password as backup
          role: 'staff', // Default role for ICT staff
          departmentId: ictDepartment.id
        },
        include: { department: true }
      });
    } else {
      // Update user info from AD
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: adUserInfo.email,
          name: adUserInfo.name,
          password: await bcrypt.hash(password, 10) // Update password hash
        },
        include: { department: true }
      });
    }

    // Generate token
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
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
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: error.message 
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
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Logout (client-side will handle token removal)
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
