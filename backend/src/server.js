require('dotenv/config');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const departmentRoutes = require('./routes/departments');
const userRoutes = require('./routes/users');
const publicTicketRoutes = require('./routes/publicTickets');
const { startEmailMonitoring } = require('./services/emailService');
const { PrismaClient } = require('@prisma/client');
const { requestId, securityHeaders, rateLimit } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(requestId);
app.use(securityHeaders);

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin denied'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'X-Request-Id'],
  credentials: true
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600, keyPrefix: 'api' }));

// Routes
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'auth' }), authRoutes);

app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/views', require('./routes/views'));
app.use('/api/knowledge-base', require('./routes/knowledgeBase'));
app.use('/api/status-issues', require('./routes/statusIssues'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/operations', require('./routes/operations'));
app.use('/api/public/tickets', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'public-ticket' }), publicTicketRoutes);
app.use('/api/tickets/public', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'public-ticket' }), publicTicketRoutes); // Alias for Google Add-on compatibility
app.use('/api/tickets', ticketRoutes); // Must come AFTER public routes

// Health check with dynamic organization name
app.get('/health', async (req, res) => {
  try {
    // Get organization name from system settings
    const settings = await prisma.systemSettings.findFirst();
    const orgName = settings ? settings.organizationName : 'KUCCPS';

    res.json({
      status: 'OK',
      message: `${orgName} Ticketing System API is running`
    });
  } catch (error) {
    // Fallback to default if database error
    res.json({ status: 'OK', message: 'KUCCPS Ticketing System API is running' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API available at http://localhost:${PORT}`);

  // Start email monitoring if credentials are configured
  if (process.env.EMAIL_USER && process.env.IMAP_USER) {
    try {
      console.log('Starting email monitoring...');
      startEmailMonitoring();
    } catch (error) {
      console.error('Failed to start email monitoring:', error.message);
      console.log('Server will continue without email monitoring');
    }
  } else {
    console.log('⚠ Email monitoring disabled - configure EMAIL_USER and IMAP_USER in .env to enable');
  }
});

module.exports = app;
// Updated 17 Februari 2026 11:41:36 asubuhi EAT
