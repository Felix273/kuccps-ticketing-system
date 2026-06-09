const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getIssues = async (req, res) => {
  try {
    const isPublic = !req.user;
    const issues = await prisma.statusIssue.findMany({
      where: {
        ...(isPublic ? { isPublic: true } : {}),
        ...(req.query.status ? { status: req.query.status } : {})
      },
      include: {
        updates: {
          where: isPublic ? { isPublic: true } : {},
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [{ resolvedAt: 'asc' }, { updatedAt: 'desc' }]
    });

    const activeIssues = issues.filter(issue => !['Completed', 'Resolved'].includes(issue.status));
    res.json({
      success: true,
      issues,
      summary: {
        active: activeIssues.length,
        allOperational: activeIssues.length === 0
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status issues' });
  }
};

exports.createIssue = async (req, res) => {
  try {
    const { title, description, status, severity, systems, isPublic } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const issue = await prisma.statusIssue.create({
      data: {
        title,
        description,
        status: status || 'Investigating',
        severity: severity || 'Informational',
        systems: Array.isArray(systems) ? systems.join(',') : (systems || ''),
        isPublic: isPublic !== false,
        updates: {
          create: {
            message: description,
            status: status || 'Investigating',
            isPublic: isPublic !== false,
            createdBy: req.user.id
          }
        }
      },
      include: { updates: true }
    });

    res.status(201).json({ success: true, issue });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to create status issue' });
  }
};

exports.updateIssue = async (req, res) => {
  try {
    const { title, description, status, severity, systems, isPublic } = req.body;
    const data = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(severity !== undefined && { severity }),
      ...(systems !== undefined && { systems: Array.isArray(systems) ? systems.join(',') : systems }),
      ...(isPublic !== undefined && { isPublic })
    };
    if (status && ['Completed', 'Resolved'].includes(status)) data.resolvedAt = new Date();
    if (status && !['Completed', 'Resolved'].includes(status)) data.resolvedAt = null;

    const issue = await prisma.statusIssue.update({
      where: { id: req.params.id },
      data,
      include: { updates: { orderBy: { createdAt: 'desc' } } }
    });
    res.json({ success: true, issue });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status issue' });
  }
};

exports.addIssueUpdate = async (req, res) => {
  try {
    const { message, status, isPublic } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Update message is required' });
    }

    const update = await prisma.statusIssueUpdate.create({
      data: {
        issueId: req.params.id,
        message,
        status: status || null,
        isPublic: isPublic !== false,
        createdBy: req.user.id
      }
    });

    const issueData = { updatedAt: new Date() };
    if (status) {
      issueData.status = status;
      issueData.resolvedAt = ['Completed', 'Resolved'].includes(status) ? new Date() : null;
    }
    await prisma.statusIssue.update({ where: { id: req.params.id }, data: issueData });
    res.status(201).json({ success: true, update });
  } catch (error) {
    console.error('Add issue update error:', error);
    res.status(500).json({ success: false, message: 'Failed to add issue update' });
  }
};
