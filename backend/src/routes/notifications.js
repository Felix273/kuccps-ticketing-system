const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { sendEmailNotification } = require('../services/notificationService');

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

router.get('/', authenticateToken, async (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const where = {
      userId: req.user.id,
      ...(unreadOnly ? { isRead: false } : {})
    };
    const [notifications, unreadCount, count] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: { ticket: { select: { id: true, ticketNumber: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false }
      }),
      prisma.notification.count({
        where: { userId: req.user.id }
      })
    ]);

    res.json({
      success: true,
      notifications,
      count,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
});

router.put('/read/all', authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({
      success: true,
      message: 'Notifications marked as read',
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true }
    });
    if (!result.count) {
      const notification = await prisma.notification.findFirst({
        where: { id: req.params.id, userId: req.user.id },
        select: { id: true }
      });
      if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!result.count) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

router.get('/preferences', authenticateToken, requirePermission('settings.notifications.view'), async (req, res) => {
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

router.put('/preferences', authenticateToken, requirePermission('settings.notifications.update'), async (req, res) => {
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

router.post('/test', authenticateToken, requirePermission('settings.notifications.test'), async (req, res) => {
  try {
    const to = req.user.email;
    if (!to) {
      return res.status(400).json({ success: false, message: 'Your account has no email address' });
    }

    await sendEmailNotification(to, {
      title: 'Notification test successful',
      message: `Hello ${req.user.name || 'there'}, this confirms that email notifications can be sent to your account.`
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
