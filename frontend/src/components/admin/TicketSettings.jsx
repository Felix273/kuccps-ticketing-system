import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { toast } from 'react-hot-toast';
import { ISSUE_CATEGORIES, PRIORITY_LEVELS, normalizePriority } from '../../utils/constants';

const TicketSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSystemSettings('tickets');
      if (response.success) {
        setSettings(response.settings || {});
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await settingsService.updateSystemSettings(settings);
      if (response.success) {
        toast.success('Ticket settings saved successfully');
      } else {
        toast.error(response.message || 'Failed to save ticket settings');
      }
    } catch {
      toast.error('Failed to save ticket settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <form onSubmit={handleSave} className="settings-form settings-sections">
      <div>
        <h3 className="text-lg font-medium mb-4">Ticket Numbering</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ticket Number Prefix</label>
            <input
              type="text"
              value={settings.ticketNumberPrefix || 'TICK'}
              onChange={(e) => setSettings(prev => ({...prev, ticketNumberPrefix: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ticket numbers look like {(settings.ticketNumberPrefix || 'TICK').toUpperCase()}-20260101-0001 (date in East Africa Time; the sequence restarts daily).
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Default Ticket Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Default Priority</label>
            <select
              value={normalizePriority(settings.defaultPriority || 'Medium')}
              onChange={(e) => setSettings(prev => ({...prev, defaultPriority: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            >
              {PRIORITY_LEVELS.map(priority => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Category</label>
            <select
              value={settings.defaultCategory || 'Incident/Problem Resolution'}
              onChange={(e) => setSettings(prev => ({...prev, defaultCategory: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            >
              {ISSUE_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">Used for email tickets. Categories follow the ICT Service Charter and set the SLA timeline.</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Default Status</label>
          <select
            value={settings.defaultStatus || 'Open'}
            onChange={(e) => setSettings(prev => ({...prev, defaultStatus: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          >
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="OnHold">On Hold</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Lifecycle &amp; Escalation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SLA warning threshold (%)</label>
            <input
              type="number"
              min="10"
              max="99"
              value={settings.slaWarningPercent ?? 75}
              onChange={(e) => setSettings(prev => ({...prev, slaWarningPercent: parseInt(e.target.value, 10) || 75}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">The assigned officer is warned when this share of the SLA time has been used.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reply window (days)</label>
            <input
              type="number"
              min="1"
              max="90"
              value={settings.reopenWindowDays ?? 14}
              onChange={(e) => setSettings(prev => ({...prev, reopenWindowDays: parseInt(e.target.value, 10) || 14}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">Replies to a closed ticket within this period are added to it and the officer is alerted (the ticket is not reopened automatically). Later replies open a new ticket.</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Escalation email recipients</label>
          <input
            type="text"
            placeholder="e.g. ict.head@kuccps.ac.ke, servicedesk.lead@kuccps.ac.ke"
            value={settings.escalationEmails || ''}
            onChange={(e) => setSettings(prev => ({...prev, escalationEmails: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
          <p className="mt-1 text-xs text-gray-500">When a ticket exceeds its SLA it is escalated to all administrators, the assigned officer and these addresses.</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">File Upload Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Maximum File Size (bytes)</label>
            <input
              type="number"
              value={settings.maxFileSize || 10485760}
              onChange={(e) => setSettings(prev => ({...prev, maxFileSize: parseInt(e.target.value) || 10485760}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">
              10485760 bytes = 10 MB
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Allowed File Types (comma-separated)</label>
            <input
              type="text"
              value={settings.allowedFileTypes || 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip'}
              onChange={(e) => setSettings(prev => ({...prev, allowedFileTypes: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Service Desk Settings'}
      </button>
    </form>
  );
};

export default TicketSettings;
