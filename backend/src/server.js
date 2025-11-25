require('dotenv/config');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const departmentRoutes = require('./routes/departments');
const userRoutes = require('./routes/users');
const publicTicketRoutes = require('./routes/publicTickets');
const { startEmailMonitoring } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Enhanced CORS for Cloudflare Tunnel
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

// Add headers for Cloudflare compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public/tickets', publicTicketRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'KUCCPS Ticketing System API is running' });
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
