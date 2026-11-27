const prisma = require('../lib/prisma');

const FIELD_TYPES = new Set(['text', 'textarea', 'select', 'checkbox', 'radio', 'number', 'date', 'email', 'phone']);

// Validates the form definition; returns { data, error }.
function validateFormInput(body, { partial }) {
  const input = body || {};
  const data = {};
  if (input.name !== undefined || !partial) {
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) {
      return { error: 'Form name is required (max 120 characters)' };
    }
    data.name = input.name.trim();
  }
  for (const [field, max] of [['category', 120], ['description', 2000]]) {
    if (input[field] === undefined) continue;
    if (input[field] !== null && typeof input[field] !== 'string') return { error: `${field} must be text` };
    data[field] = input[field] ? input[field].trim().slice(0, max) : null;
  }
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') return { error: 'isActive must be true or false' };
    data.isActive = input.isActive;
  }
  if (input.fields !== undefined) {
    if (!Array.isArray(input.fields) || input.fields.length > 100) return { error: 'fields must be a list (max 100)' };
    const keys = new Set();
    const fields = [];
    for (const [index, field] of input.fields.entries()) {
      if (!field || typeof field.label !== 'string' || !field.label.trim()) {
        return { error: `Field ${index + 1} needs a label` };
      }
      if (typeof field.key !== 'string' || !/^[a-zA-Z0-9_]{1,64}$/.test(field.key)) {
        return { error: `Field ${index + 1} needs a key of letters, digits or underscores` };
      }
      if (keys.has(field.key)) return { error: `Field key "${field.key}" is used more than once` };
      keys.add(field.key);
      const type = field.type || 'text';
      if (!FIELD_TYPES.has(type)) return { error: `Field ${index + 1} has an unsupported type` };
      fields.push({
        label: field.label.trim().slice(0, 200),
        key: field.key,
        type,
        required: field.required === true,
        options: field.options ?? null,
        conditions: field.conditions ?? null,
        sortOrder: Number.isInteger(field.sortOrder) ? field.sortOrder : index
      });
    }
    data.fields = fields;
  }
  return { data };
}

exports.getForms = async (req, res) => {
  try {
    // Unauthenticated callers (the public intake page) only ever see active forms.
    const isPublic = !req.user;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const forms = await prisma.customForm.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(isPublic || req.query.active === 'true' ? { isActive: true } : {})
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
    const { data, error } = validateFormInput(req.body, { partial: false });
    if (error) return res.status(400).json({ success: false, message: error });

    const form = await prisma.customForm.create({
      data: {
        name: data.name,
        category: data.category ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        fields: { create: data.fields || [] }
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
    const { data, error } = validateFormInput(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });
    const existing = await prisma.customForm.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Custom form not found' });
    const { fields, ...formData } = data;
    const form = await prisma.$transaction(async (tx) => {
      await tx.customForm.update({
        where: { id: req.params.id },
        data: formData
      });

      if (fields) {
        await tx.customFormField.deleteMany({ where: { formId: req.params.id } });
        await tx.customFormField.createMany({
          data: fields.map(field => ({ ...field, formId: req.params.id }))
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
    const result = await prisma.customForm.deleteMany({ where: { id: req.params.id } });
    if (!result.count) return res.status(404).json({ success: false, message: 'Custom form not found' });
    res.json({ success: true, message: 'Custom form deleted' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete custom form' });
  }
};
