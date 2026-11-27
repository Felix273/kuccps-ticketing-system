const { parseDelimitedValues } = require('../services/normalizedValues');
const prisma = require('../lib/prisma');

function parseSystems(value) {
  return parseDelimitedValues(value).map(name => ({
    name,
    normalizedName: name.toLowerCase()
  }));
}

function systemRelations(value) {
  return {
    create: parseSystems(value).map(({ name, normalizedName }) => ({
      system: {
        connectOrCreate: {
          where: { normalizedName },
          create: { name, normalizedName }
        }
      }
    }))
  };
}

const ISSUE_STATUSES = new Set(['Investigating', 'Identified', 'Monitoring', 'Resolved']);
const ISSUE_SEVERITIES = new Set(['Informational', 'Warning', 'Error']);

function serializeIssue(issue, { isPublic = false } = {}) {
  return {
    ...issue,
    systems: issue.systems.map(({ system }) => system.name).join(','),
    // Staff user IDs are internal; public status readers only need the update text.
    ...(isPublic && Array.isArray(issue.updates)
      ? { updates: issue.updates.map(({ createdBy, ...update }) => update) }
      : {})
  };
}

// Validates issue fields; returns an error message or null.
function getIssueValidationError({ title, description, status, severity, systems, isPublic }, { partial }) {
  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim() || title.length > 200) return 'Title is required (max 200 characters)';
  }
  if (!partial || description !== undefined) {
    if (typeof description !== 'string' || !description.trim() || description.length > 5000) {
      return 'Description is required (max 5000 characters)';
    }
  }
  if (status !== undefined && status !== null && !ISSUE_STATUSES.has(status)) {
    return `Status must be one of: ${[...ISSUE_STATUSES].join(', ')}`;
  }
  if (severity !== undefined && severity !== null && !ISSUE_SEVERITIES.has(severity)) {
    return `Severity must be one of: ${[...ISSUE_SEVERITIES].join(', ')}`;
  }
  if (systems !== undefined && systems !== null && typeof systems !== 'string' && !Array.isArray(systems)) {
    return 'Systems must be a comma-separated list';
  }
  if (isPublic !== undefined && typeof isPublic !== 'boolean') return 'isPublic must be true or false';
  return null;
}

const issueInclude = {
  systems: { include: { system: true } }
};

exports.getIssues = async (req, res) => {
  try {
    const isPublic = !req.user;
    const issues = await prisma.statusIssue.findMany({
      where: {
        ...(isPublic ? { isPublic: true } : {}),
        ...(ISSUE_STATUSES.has(req.query.status) ? { status: req.query.status } : {})
      },
      include: {
        ...issueInclude,
        updates: {
          where: isPublic ? { isPublic: true } : {},
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [{ resolvedAt: 'asc' }, { updatedAt: 'desc' }]
    });

    const activeIssues = issues.filter(issue => issue.status !== 'Resolved');
    res.json({
      success: true,
      issues: issues.map(issue => serializeIssue(issue, { isPublic })),
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
    const { title, description, status, severity, systems, isPublic } = req.body || {};
    const validationError = getIssueValidationError(req.body || {}, { partial: false });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const issue = await prisma.statusIssue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        status: status || 'Investigating',
        severity: severity || 'Informational',
        systems: systemRelations(systems),
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
      include: { updates: true, ...issueInclude }
    });

    res.status(201).json({ success: true, issue: serializeIssue(issue) });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to create status issue' });
  }
};

exports.updateIssue = async (req, res) => {
  try {
    const { title, description, status, severity, systems, isPublic } = req.body || {};
    const validationError = getIssueValidationError(req.body || {}, { partial: true });
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const existing = await prisma.statusIssue.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Status issue not found' });
    const data = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(severity !== undefined && { severity }),
      ...(systems !== undefined && {
        systems: {
          deleteMany: {},
          ...systemRelations(systems)
        }
      }),
      ...(isPublic !== undefined && { isPublic })
    };
    if (status) data.resolvedAt = status === 'Resolved' ? new Date() : null;

    const issue = await prisma.statusIssue.update({
      where: { id: req.params.id },
      data,
      include: { updates: { orderBy: { createdAt: 'desc' } }, ...issueInclude }
    });
    res.json({ success: true, issue: serializeIssue(issue) });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status issue' });
  }
};

exports.addIssueUpdate = async (req, res) => {
  try {
    const { message, status, isPublic } = req.body || {};
    if (typeof message !== 'string' || !message.trim() || message.length > 5000) {
      return res.status(400).json({ success: false, message: 'Update message is required (max 5000 characters)' });
    }
    if (status !== undefined && status !== null && status !== '' && !ISSUE_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    if (isPublic !== undefined && typeof isPublic !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isPublic must be true or false' });
    }
    const issueExists = await prisma.statusIssue.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!issueExists) return res.status(404).json({ success: false, message: 'Status issue not found' });

    const update = await prisma.statusIssueUpdate.create({
      data: {
        issueId: req.params.id,
        message: message.trim(),
        status: status || null,
        isPublic: isPublic !== false,
        createdBy: req.user.id
      }
    });

    const issueData = { updatedAt: new Date() };
    if (status) {
      issueData.status = status;
      issueData.resolvedAt = status === 'Resolved' ? new Date() : null;
    }
    await prisma.statusIssue.update({ where: { id: req.params.id }, data: issueData });
    res.status(201).json({ success: true, update });
  } catch (error) {
    console.error('Add issue update error:', error);
    res.status(500).json({ success: false, message: 'Failed to add issue update' });
  }
};
