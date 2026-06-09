import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formService } from '../../services/formService';
import { ISSUE_CATEGORIES } from '../../utils/constants';

const emptyField = { label: '', key: '', type: 'text', required: false };

const CustomFormsSettings = () => {
  const [forms, setForms] = useState([]);
  const [draft, setDraft] = useState({
    name: '',
    category: ISSUE_CATEGORIES[0],
    description: '',
    fields: [{ ...emptyField }]
  });

  const loadForms = async () => {
    const response = await formService.getForms();
    if (response.success) setForms(response.forms || []);
  };

  useEffect(() => {
    const timer = setTimeout(loadForms, 0);
    return () => clearTimeout(timer);
  }, []);

  const addField = () => {
    setDraft(prev => ({ ...prev, fields: [...prev.fields, { ...emptyField }] }));
  };

  const updateField = (index, updates) => {
    setDraft(prev => ({
      ...prev,
      fields: prev.fields.map((field, idx) => idx === index ? { ...field, ...updates } : field)
    }));
  };

  const removeField = (index) => {
    setDraft(prev => ({ ...prev, fields: prev.fields.filter((_, idx) => idx !== index) }));
  };

  const saveForm = async (event) => {
    event.preventDefault();
    const response = await formService.createForm({
      ...draft,
      fields: draft.fields
        .filter(field => field.label && field.key)
        .map((field, index) => ({ ...field, sortOrder: index }))
    });
    if (response.success) {
      setForms(prev => [response.form, ...prev]);
      setDraft({ name: '', category: ISSUE_CATEGORIES[0], description: '', fields: [{ ...emptyField }] });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={saveForm} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h3 className="text-lg font-semibold">Category Form Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            value={draft.name}
            onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Form name"
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={draft.category}
            onChange={(e) => setDraft(prev => ({ ...prev, category: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            {ISSUE_CATEGORIES.map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What this form collects"
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />

        <div className="space-y-3">
          {draft.fields.map((field, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-gray-50 p-3 rounded-lg">
              <input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value, key: field.key || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') })}
                placeholder="Field label"
                className="px-3 py-2 border border-gray-300 rounded-md md:col-span-2"
              />
              <input
                value={field.key}
                onChange={(e) => updateField(index, { key: e.target.value })}
                placeholder="field_key"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(index, { type: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="text">Text</option>
                <option value="textarea">Long Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(index, { required: e.target.checked })} />
                  Required
                </label>
                <button type="button" onClick={() => removeField(index)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button type="button" onClick={addField} className="px-4 py-2 border border-gray-300 rounded-md flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Field
          </button>
          <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-md">Save Form</button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forms.map(form => (
          <div key={form.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900">{form.name}</h4>
            <p className="text-sm text-gray-600">{form.category || 'All categories'}</p>
            <p className="text-xs text-gray-500 mt-2">{form.fields?.length || 0} fields</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomFormsSettings;
