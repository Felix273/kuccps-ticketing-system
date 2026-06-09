const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getForms = async (req, res) => {
  try {
    const forms = await prisma.customForm.findMany({
      where: {
        ...(req.query.category ? { category: req.query.category } : {}),
        ...(req.query.active === 'true' ? { isActive: true } : {})
      },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, forms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch custom forms' });
  }
};

exports.createForm = async (req, res) => {
  try {
    const { name, category, description, isActive, fields } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Form name is required' });

    const form = await prisma.customForm.create({
      data: {
        name,
        category: category || null,
        description: description || null,
        isActive: isActive !== false,
        fields: {
          create: (fields || []).map((field, index) => ({
            label: field.label,
            key: field.key,
            type: field.type || 'text',
            required: Boolean(field.required),
            options: field.options || null,
            conditions: field.conditions || null,
            sortOrder: field.sortOrder ?? index
          }))
        }
      },
      include: { fields: { orderBy: { sortOrder: 'asc' } } }
    });
    res.status(201).json({ success: true, form });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ success: false, message: 'Failed to create custom form' });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const { name, category, description, isActive, fields } = req.body;
    const form = await prisma.$transaction(async (tx) => {
      await tx.customForm.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(category !== undefined && { category }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive })
        }
      });

      if (Array.isArray(fields)) {
        await tx.customFormField.deleteMany({ where: { formId: req.params.id } });
        await tx.customFormField.createMany({
          data: fields.map((field, index) => ({
            formId: req.params.id,
            label: field.label,
            key: field.key,
            type: field.type || 'text',
            required: Boolean(field.required),
            options: field.options || null,
            conditions: field.conditions || null,
            sortOrder: field.sortOrder ?? index
          }))
        });
      }

      return tx.customForm.findUnique({
        where: { id: req.params.id },
        include: { fields: { orderBy: { sortOrder: 'asc' } } }
      });
    });
    res.json({ success: true, form });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ success: false, message: 'Failed to update custom form' });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    await prisma.customForm.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Custom form deleted' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete custom form' });
  }
};
