const prisma = require('../lib/prisma');
const { userHasPermission } = require('../services/accessControlService');

// Managers (who assign work) can share views with everyone or a role and manage any view.
const canManageSharedViews = user => userHasPermission(user.id, 'tickets.assign');

// Visibility is a DB enum: private | shared (with a role) | global (everyone).
// Legacy API values 'public' and 'role' are still accepted.
const VISIBILITY_ALIASES = { public: 'global', role: 'shared' };
const VISIBILITIES = new Set(['private', 'shared', 'global']);

function normalizeVisibility(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const normalized = VISIBILITY_ALIASES[value] || value;
  return VISIBILITIES.has(normalized) ? normalized : null;
}

function getAccessibleViewWhere(user, entity) {
  return {
    entity: entity || 'tickets',
    OR: [
      { visibility: 'global' },
      { ownerId: user.id },
      { visibility: 'shared', role: user.role }
    ]
  };
}

exports.getViews = async (req, res) => {
  try {
    const views = await prisma.savedView.findMany({
      where: getAccessibleViewWhere(req.user, req.query.entity),
      orderBy: [{ visibility: 'asc' }, { name: 'asc' }]
    });
    res.json({ success: true, views });
  } catch (error) {
    console.error('Get views error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch saved views' });
  }
};

exports.createView = async (req, res) => {
  try {
    const { name, entity, filters, columns, sortBy, sortOrder, visibility, role } = req.body;
    if (!name || !filters) {
      return res.status(400).json({ success: false, message: 'Name and filters are required' });
    }

    const requestedVisibility = normalizeVisibility(visibility) ?? (visibility ? null : 'private');
    if (!requestedVisibility) {
      return res.status(400).json({ success: false, message: 'Invalid visibility' });
    }
    if (requestedVisibility !== 'private' && !(await canManageSharedViews(req.user))) {
      return res.status(403).json({ success: false, message: 'Only ICT managers can create shared views' });
    }

    const view = await prisma.savedView.create({
      data: {
        name,
        entity: entity || 'tickets',
        filters,
        columns: columns || null,
        sortBy: sortBy || null,
        sortOrder: sortOrder || 'desc',
        visibility: requestedVisibility,
        role: requestedVisibility === 'shared' ? (role || req.user.role) : null,
        ownerId: req.user.id
      }
    });

    res.status(201).json({ success: true, view });
  } catch (error) {
    console.error('Create view error:', error);
    res.status(500).json({ success: false, message: 'Failed to save view' });
  }
};

exports.updateView = async (req, res) => {
  try {
    const existing = await prisma.savedView.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Saved view not found' });
    if (existing.ownerId !== req.user.id && !(await canManageSharedViews(req.user))) {
      return res.status(403).json({ success: false, message: 'You cannot edit this view' });
    }

    const { name, filters, columns, sortBy, sortOrder, role } = req.body;
    const visibility = normalizeVisibility(req.body.visibility);
    if (visibility === null) {
      return res.status(400).json({ success: false, message: 'Invalid visibility' });
    }
    const canShare = await canManageSharedViews(req.user);
    const view = await prisma.savedView.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(filters !== undefined && { filters }),
        ...(columns !== undefined && { columns }),
        ...(sortBy !== undefined && { sortBy }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(canShare && visibility !== undefined && { visibility }),
        ...(canShare && role !== undefined && { role })
      }
    });
    res.json({ success: true, view });
  } catch (error) {
    console.error('Update view error:', error);
    res.status(500).json({ success: false, message: 'Failed to update view' });
  }
};

exports.deleteView = async (req, res) => {
  try {
    const existing = await prisma.savedView.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Saved view not found' });
    if (existing.ownerId !== req.user.id && !(await canManageSharedViews(req.user))) {
      return res.status(403).json({ success: false, message: 'You cannot delete this view' });
    }
    await prisma.savedView.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Saved view deleted' });
  } catch (error) {
    console.error('Delete view error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete view' });
  }
};
