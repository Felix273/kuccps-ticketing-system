require('dotenv/config');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const departmentRoutes = require('./routes/departments');
const userRoutes = require('./routes/users');
const publicTicketRoutes = require('./routes/publicTickets');
const { startEmailMonitoring } = require('./services/emailService');
const { startNotificationJobs } = require('./services/notificationScheduler');
const { PrismaClient } = require('@prisma/client');
const { requestId, securityHeaders, rateLimit, validateProductionConfig } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

validateProductionConfig();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(requestId);
app.use(securityHeaders);

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
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
app.use('/api/access-control', require('./routes/accessControl'));
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

app.use((err, req, res, next) => {
  if (err?.message === 'CORS origin denied') {
    return res.status(403).json({ success: false, message: 'CORS origin denied' });
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Uploaded file is too large' });
  }

  if (err?.message === 'File type is not allowed') {
    return res.status(415).json({ success: false, message: err.message });
  }

  console.error('Unhandled request error:', { requestId: req.id, message: err.message });
  return res.status(500).json({ success: false, message: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API available at http://localhost:${PORT}`);
  startNotificationJobs();

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

// ─────────────────────────────────────────────────────────────
// AUTOMATED ACTIVE DIRECTORY INGESTION ENGINE
// ─────────────────────────────────────────────────────────────
const adService = require('./services/adService');

async function runAutomatedAdSync() {
  try {
    const settings = await adService.getAdSettings();
    if (!settings.ldapEnabled || !settings.ldapUrl || !settings.ldapBaseDn) {
      console.log('ℹ Automated AD Sync skipped: LDAP is not configured or disabled in settings.');
      return;
    }

    console.log('🔄 [AD Sync Engine] Pulling directorates and users from Active Directory...');
    
    // 1. Sync any defined Directorates from AD
    const dirResult = await adService.syncDirectorates().catch((err) => {
      console.warn('ℹ Directorate OU scan note:', err.message);
      return { count: 0 };
    });

    // 2. Sync all Users (auto-creates and links Directorates from the user's department attribute)
    const userResult = await adService.syncUsers();

    console.log(`✓ [AD Sync Engine] Complete: ${dirResult.count || 0} directorates verified, ${userResult.count || 0} users synced and linked.`);
  } catch (error) {
    console.error('⚠ [AD Sync Engine] Notice:', error.message);
  }
}

// Automatically trigger initial directory harvest 10 seconds after boot
setTimeout(runAutomatedAdSync, 10000);

// Schedule automatic background refresh every 24 hours
setInterval(runAutomatedAdSync, 24 * 60 * 60 * 1000);
