import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { toast } from 'react-hot-toast';

const OrganizationSettings = () => {
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
        toast.success('Settings saved successfully');
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Organization Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Organization Name</label>
            <input
              type="text"
              value={settings.organizationName || ''}
              onChange={(e) => setSettings(prev => ({...prev, organizationName: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organization Code</label>
            <input
              type="text"
              value={settings.organizationCode || ''}
              onChange={(e) => setSettings(prev => ({...prev, organizationCode: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <input
              type="color"
              value={settings.primaryColor || '#911414'}
              onChange={(e) => setSettings(prev => ({...prev, primaryColor: e.target.value}))}
              className="w-full h-12 p-0"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Secondary Color</label>
            <input
              type="color"
              value={settings.secondaryColor || '#d20001'}
              onChange={(e) => setSettings(prev => ({...prev, secondaryColor: e.target.value}))}
              className="w-full h-12 p-0"
              disabled={saving}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Logo URL</label>
          <input
            type="text"
            value={settings.logoUrl || ''}
            onChange={(e) => setSettings(prev => ({...prev, logoUrl: e.target.value}))}
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Favicon URL</label>
          <input
            type="text"
            value={settings.faviconUrl || ''}
            onChange={(e) => setSettings(prev => ({...prev, faviconUrl: e.target.value}))}
            placeholder="https://example.com/favicon.ico"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.darkModeEnabled || false}
              onChange={(e) => setSettings(prev => ({...prev, darkModeEnabled: e.target.checked}))}
              disabled={saving}
            />
            <span>Enable dark mode preference</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">Contrast Mode</label>
            <select
              value={settings.contrastMode || 'normal'}
              onChange={(e) => setSettings(prev => ({...prev, contrastMode: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            >
              <option value="normal">Normal</option>
              <option value="high">High contrast</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail || ''}
              onChange={(e) => setSettings(prev => ({...prev, supportEmail: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No-Reply Email</label>
            <input
              type="email"
              value={settings.noreplyEmail || ''}
              onChange={(e) => setSettings(prev => ({...prev, noreplyEmail: e.target.value}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Email From Name</label>
          <input
            type="text"
            value={settings.emailFromName || ''}
            onChange={(e) => setSettings(prev => ({...prev, emailFromName: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

export default OrganizationSettings;
