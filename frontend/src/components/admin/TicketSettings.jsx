import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { toast } from 'react-hot-toast';

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
      const response = await settingsService.getSystemSettings();
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
    <form onSubmit={handleSave} className="space-y-6">
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
              Example: TICK (results in TICK-20230101-0001)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ticket Number Format</label>
            <select
              value={settings.ticketNumberFormat || 'YYYYMMDD-XXXX'}
              onChange={(e) => setSettings(prev => ({...prev, ticketNumberFormat: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            >
              <option value="YYYYMMDD-XXXX">YYYYMMDD-XXXX (e.g., 20230101-0001)</option>
              <option value="YYYY-XXXX">YYYY-XXXX (e.g., 2023-0001)</option>
              <option value="XXXX-YYYY">XXXX-YYYY (e.g., 0001-2023)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Default Ticket Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Default Priority</label>
            <select
              value={settings.defaultPriority || 'Medium'}
              onChange={(e) => setSettings(prev => ({...prev, defaultPriority: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Category</label>
            <input
              type="text"
              value={settings.defaultCategory || 'General Issues'}
              onChange={(e) => setSettings(prev => ({...prev, defaultCategory: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
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
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
          </select>
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

      <div>
        <h3 className="text-lg font-medium mb-4">System Maintenance</h3>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.maintenanceMode || false}
              onChange={(e) => setSettings(prev => ({...prev, maintenanceMode: e.target.checked}))}
              disabled={saving}
            />
            <span className="ml-2">Enable Maintenance Mode</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, only administrators can access the system.
          </p>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Maintenance Message</label>
          <textarea
            value={settings.maintenanceMessage || ''}
            onChange={(e) => setSettings(prev => ({...prev, maintenanceMessage: e.target.value}))}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            placeholder="System is currently under maintenance. Please check back later."
            disabled={saving}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Ticket Settings'}
      </button>
    </form>
  );
};

export default TicketSettings;
