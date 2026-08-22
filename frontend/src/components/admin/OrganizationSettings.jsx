import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { toast } from 'react-hot-toast';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';

const OrganizationSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG)');
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    setUploadingLogo(true);
    try {
      const response = await api.post('/settings/logo', formData);
      if (response.success) {
        setSettings(prev => ({ ...prev, logoUrl: response.logoUrl }));
        toast.success('Organization logo uploaded successfully');
      } else {
        toast.error(response.message || 'Failed to upload logo');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload logo image');
    } finally {
      setUploadingLogo(false);
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

  if (loading) return <div className="text-center py-8 text-gray-600">Loading settings...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Organization Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
            <input
              type="text"
              value={settings.organizationName || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, organizationName: e.target.value }))}
              placeholder="e.g. KUCCPS IT Support"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Code</label>
            <input
              type="text"
              value={settings.organizationCode || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, organizationCode: e.target.value }))}
              placeholder="e.g. KUCCPS"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Branding & Logo</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Logo</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-32 h-16 bg-white border border-gray-300 rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-inner">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || '/api'}${settings.logoUrl}` : settings.logoUrl}
                  alt="Organization Logo"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/kuccps-logo.png'; }}
                />
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <ImageIcon className="w-5 h-5" />
                  <span>No Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#911414] text-white text-sm font-medium rounded-lg hover:bg-[#720e0e] cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo || saving}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500">Recommended format: PNG, JPG, or SVG. Max size: 5MB.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor || '#911414'}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-12 h-12 rounded-lg border border-gray-300 p-1 cursor-pointer"
                disabled={saving}
              />
              <span className="font-mono text-sm uppercase font-semibold text-gray-700">{settings.primaryColor || '#911414'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.secondaryColor || '#d20001'}
                onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="w-12 h-12 rounded-lg border border-gray-300 p-1 cursor-pointer"
                disabled={saving}
              />
              <span className="font-mono text-sm uppercase font-semibold text-gray-700">{settings.secondaryColor || '#d20001'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Official Support Contacts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Official Support Email</label>
            <input
              type="email"
              value={settings.supportEmail || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
              placeholder="itsupport@kuccps.ac.ke"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Sender Name</label>
            <input
              type="text"
              value={settings.emailFromName || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, emailFromName: e.target.value }))}
              placeholder="KUCCPS IT Support"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || uploadingLogo}
          className="px-8 py-3 bg-[#911414] text-white font-medium text-sm rounded-lg hover:bg-[#720e0e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? 'Saving Settings...' : 'Save Organization Settings'}
        </button>
      </div>
    </form>
  );
};

export default OrganizationSettings;
