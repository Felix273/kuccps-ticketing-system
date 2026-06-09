import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { toast } from 'react-hot-toast';

const EmailSettings = () => {
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
      const payload = {
        ...settings,
        smtpPassword: settings._newSmtpPassword || settings.smtpPassword,
        imapPassword: settings._newImapPassword || settings.imapPassword
      };
      delete payload._newSmtpPassword;
      delete payload._newImapPassword;

      const response = await settingsService.updateSystemSettings(payload);
      if (response.success) {
        setSettings({
          ...(response.settings || {}),
          _newSmtpPassword: '',
          _newImapPassword: ''
        });
        toast.success('Email settings saved successfully');
      } else {
        toast.error(response.message || 'Failed to save email settings');
      }
    } catch {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Outgoing Email (SMTP)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SMTP Host</label>
            <input
              type="text"
              value={settings.smtpHost || ''}
              onChange={(e) => setSettings(prev => ({...prev, smtpHost: e.target.value}))}
              placeholder="smtp.gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SMTP Port</label>
            <input
              type="number"
              value={settings.smtpPort || 587}
              onChange={(e) => setSettings(prev => ({...prev, smtpPort: parseInt(e.target.value) || 587}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">SMTP Secure (TLS)</label>
          <select
            value={settings.smtpSecure ? 'true' : 'false'}
            onChange={(e) => setSettings(prev => ({...prev, smtpSecure: e.target.value === 'true'}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled (TLS)</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">SMTP Username</label>
          <input
            type="text"
            value={settings.smtpUser || ''}
            onChange={(e) => setSettings(prev => ({...prev, smtpUser: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">SMTP Password</label>
          <input
            type="password"
            value={settings._newSmtpPassword || ''}
            onChange={(e) => setSettings(prev => ({...prev, _newSmtpPassword: e.target.value}))}
            placeholder={settings.smtpPassword ? 'Saved password configured. Type a new password to replace it.' : 'Enter SMTP password'}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
          <p className="text-xs text-gray-500 mt-1">
            {settings.smtpPassword ? 'A password is saved. Leave this blank to keep it unchanged.' : 'No SMTP password is currently saved.'}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Incoming Email (IMAP)</h3>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.imapEnabled || false}
              onChange={(e) => setSettings(prev => ({...prev, imapEnabled: e.target.checked}))}
              disabled={saving}
            />
            <span className="ml-2">Enable Email Monitoring (IMAP)</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Enable to automatically create tickets from incoming emails.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">IMAP Host</label>
            <input
              type="text"
              value={settings.imapHost || ''}
              onChange={(e) => setSettings(prev => ({...prev, imapHost: e.target.value}))}
              placeholder="imap.gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IMAP Port</label>
            <input
              type="number"
              value={settings.imapPort || 993}
              onChange={(e) => setSettings(prev => ({...prev, imapPort: parseInt(e.target.value) || 993}))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">IMAP Username</label>
          <input
            type="text"
            value={settings.imapUser || ''}
            onChange={(e) => setSettings(prev => ({...prev, imapUser: e.target.value}))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">IMAP Password</label>
          <input
            type="password"
            value={settings._newImapPassword || ''}
            onChange={(e) => setSettings(prev => ({...prev, _newImapPassword: e.target.value}))}
            placeholder={settings.imapPassword ? 'Saved password configured. Type a new password to replace it.' : 'Enter IMAP password'}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
          <p className="text-xs text-gray-500 mt-1">
            {settings.imapPassword ? 'A password is saved. Leave this blank to keep it unchanged.' : 'No IMAP password is currently saved.'}
          </p>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Email Polling Interval (minutes)</label>
          <input
            type="number"
            value={settings.imapPollInterval || 5}
            onChange={(e) => setSettings(prev => ({...prev, imapPollInterval: parseInt(e.target.value) || 5}))}
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
        {saving ? 'Saving...' : 'Save Email Settings'}
      </button>
    </form>
  );
};

export default EmailSettings;
