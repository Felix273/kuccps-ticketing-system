const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getAccessibleViewWhere(user, entity) {
  return {
    entity: entity || 'tickets',
    OR: [
      { visibility: 'public' },
      { ownerId: user.id },
      { visibility: 'role', role: user.role }
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

    const requestedVisibility = visibility || 'private';
    if (requestedVisibility !== 'private' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create shared views' });
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
        role: requestedVisibility === 'role' ? role : null,
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
    if (existing.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You cannot edit this view' });
    }

    const { name, filters, columns, sortBy, sortOrder, visibility, role } = req.body;
    const view = await prisma.savedView.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(filters !== undefined && { filters }),
        ...(columns !== undefined && { columns }),
        ...(sortBy !== undefined && { sortBy }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(req.user.role === 'admin' && visibility !== undefined && { visibility }),
        ...(req.user.role === 'admin' && role !== undefined && { role })
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
    if (existing.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You cannot delete this view' });
    }
    await prisma.savedView.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Saved view deleted' });
  } catch (error) {
    console.error('Delete view error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete view' });
  }
};
