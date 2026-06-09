import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { toast } from 'react-hot-toast';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    type: '',
    subject: '',
    html: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getEmailTemplates();
      if (response.success) {
        setTemplates(response.templates || []);
      }
    } catch {
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      const response = await settingsService.resetEmailTemplatesToDefault();
      if (response.success) {
        toast.success('Email templates reset to default');
        loadTemplates();
      } else {
        toast.error(response.message || 'Failed to reset email templates');
      }
    } catch {
      toast.error('Failed to reset email templates');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template.id);
    setTemplateForm({
      type: template.type,
      subject: template.subject,
      html: template.html
    });
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingTemplate) {
        // Update existing template
        response = await settingsService.updateEmailTemplate(
          templateForm.type,
          { subject: templateForm.subject, html: templateForm.html }
        );
      } else {
        // Create new template
        response = await settingsService.createEmailTemplate(templateForm);
      }

      if (response.success) {
        toast.success('Email template saved successfully');
        setEditingTemplate(null);
        setTemplateForm({ type: '', subject: '', html: '' });
        loadTemplates();
      } else {
        toast.error(response.message || 'Failed to save email template');
      }
    } catch {
      toast.error('Failed to save email template');
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setTemplateForm({ type: '', subject: '', html: '' });
  };

  const handleDeleteTemplate = async (type) => {
    if (window.confirm('Are you sure you want to delete this email template?')) {
      try {
        const response = await settingsService.deleteEmailTemplate(type);
        if (response.success) {
          toast.success('Email template deleted successfully');
          loadTemplates();
        } else {
          toast.error(response.message || 'Failed to delete email template');
        }
      } catch {
        toast.error('Failed to delete email template');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Email Templates</h3>
        <div className="flex space-x-3">
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Reset to Default
          </button>
          {!editingTemplate && (
            <button
              onClick={() => {
                setEditingTemplate('new');
                setTemplateForm({ type: 'ticketCreated', subject: '', html: '' });
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Template Form */}
      {editingTemplate !== null && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-medium mb-4">
            {editingTemplate === 'new' ? 'Create New Email Template' : 'Edit Email Template'}
          </h3>
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Type</label>
              <select
                value={templateForm.type}
                onChange={(e) => setTemplateForm(prev => ({...prev, type: e.target.value}))}
                disabled={editingTemplate !== 'new'}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Template Type</option>
                <option value="ticketCreated">Ticket Created</option>
                <option value="ticketUpdated">Ticket Updated</option>
                <option value="ticketResolved">Ticket Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Subject</label>
              <input
                type="text"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({...prev, subject: e.target.value}))}
                placeholder="[Ticket #{{ticketNumber}}] Your support request has been received"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {'Available placeholders: {{ticketNumber}}, {{subject}}, {{description}}, {{priority}}, {{status}}, {{category}}, {{requesterName}}, {{requesterEmail}}, {{comment}}, {{resolutionComment}}, {{year}}, {{organizationName}}, {{emailFromName}}'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email HTML Body</label>
              <textarea
                value={templateForm.html}
                onChange={(e) => setTemplateForm(prev => ({...prev, html: e.target.value}))}
                rows="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="Enter HTML email template here..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {editingTemplate === 'new' ? 'Create Template' : 'Update Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      {!editingTemplate && (
        <div className="space-y-4">
          {templates.length > 0 ? (
            templates.map(template => (
              <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{template.type}</h4>
                    <p className="text-sm text-gray-500">ID: {template.id}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.type)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <h5 className="text-sm font-medium mb-1">Subject:</h5>
                  <p className="bg-gray-50 p-2 rounded">{template.subject}</p>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-1">HTML Preview:</h5>
                  <div className="bg-gray-50 p-3 rounded h-48 overflow-auto border">
                    {/* Simple preview - in a real app, you might want to render the HTML properly */}
                    <div className="text-sm">{template.html.substring(0, 100)}{template.html.length > 100 ? '...' : ''}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No email templates found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
