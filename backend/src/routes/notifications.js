const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { createEmailTransporter, getSystemSettings } = require('../services/emailService');

const prisma = new PrismaClient();

const DEFAULT_PREFERENCES = {
  emailOnAssignment: true,
  emailOnStatusChange: true,
  emailOnNewComment: true,
  dailyDigest: false,
  escalationAlerts: true
};

const selectPreferenceFields = {
  emailOnAssignment: true,
  emailOnStatusChange: true,
  emailOnNewComment: true,
  dailyDigest: true,
  escalationAlerts: true
};

async function getOrCreatePreferences(userId) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...DEFAULT_PREFERENCES
    },
    select: selectPreferenceFields
  });
}

// Get notifications for current user (returns empty - notification feature not yet implemented)
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      notifications: [],
      count: 0
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      notifications: [],
      count: 0
    });
  }
});

router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await getOrCreatePreferences(req.user.id);
    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      preferences: DEFAULT_PREFERENCES
    });
  }
});

router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const data = {};
    Object.keys(DEFAULT_PREFERENCES).forEach(key => {
      if (typeof req.body[key] === 'boolean') data[key] = req.body[key];
    });

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: req.user.id },
      update: data,
      create: {
        userId: req.user.id,
        ...DEFAULT_PREFERENCES,
        ...data
      },
      select: selectPreferenceFields
    });

    res.json({
      success: true,
      message: 'Notification preferences saved',
      preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save notification preferences'
    });
  }
});

router.post('/test', authenticateToken, async (req, res) => {
  try {
    const settings = await getSystemSettings();
    const transporter = await createEmailTransporter();
    const to = req.user.email;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Your account has no email address' });
    }

    await transporter.sendMail({
      from: `${settings.emailFromName} <${settings.supportEmail || process.env.EMAIL_USER}>`,
      to,
      subject: 'KUCCPS IT Support notification test',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2 style="color: ${settings.primaryColor || '#911414'};">Notification test successful</h2>
          <p>Hello ${req.user.name || 'there'},</p>
          <p>This confirms your KUCCPS IT Support email notifications can be sent to this address.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email. Check SMTP/email settings.'
    });
  }
});

module.exports = router;
