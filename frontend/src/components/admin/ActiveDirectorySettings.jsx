import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';

const ActiveDirectorySettings = () => {
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
      if (response.success) setSettings(response.settings || {});
    } catch {
      toast.error('Failed to load Active Directory settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        ldapBindPassword: settings._newLdapBindPassword || settings.ldapBindPassword
      };
      delete payload._newLdapBindPassword;

      const response = await settingsService.updateSystemSettings(payload);
      if (response.success) {
        setSettings({
          ...(response.settings || {}),
          _newLdapBindPassword: ''
        });
        toast.success('Active Directory settings saved');
      } else {
        toast.error(response.message || 'Failed to save Active Directory settings');
      }
    } catch {
      toast.error('Failed to save Active Directory settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Active Directory Connection</h3>
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={settings.ldapEnabled || false}
            onChange={(e) => setSettings(prev => ({ ...prev, ldapEnabled: e.target.checked }))}
            disabled={saving}
          />
          <span>Enable AD login for ICT staff</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">LDAP URL</label>
            <input
              value={settings.ldapUrl || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapUrl: e.target.value }))}
              placeholder="ldap://dc01.kuccps.local:389 or ldaps://dc01.kuccps.local:636"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">AD Domain</label>
            <input
              value={settings.ldapDomain || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapDomain: e.target.value }))}
              placeholder="kuccps.local"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base DN</label>
            <input
              value={settings.ldapBaseDn || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapBaseDn: e.target.value }))}
              placeholder="DC=kuccps,DC=local"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Login Attribute</label>
            <input
              value={settings.ldapUserDnPrefix || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapUserDnPrefix: e.target.value }))}
              placeholder="sAMAccountName"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Bind Account</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bind DN</label>
            <input
              value={settings.ldapBindDn || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapBindDn: e.target.value }))}
              placeholder="CN=svc-ticketing,OU=Service Accounts,DC=kuccps,DC=local"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bind Password</label>
            <input
              type="password"
              value={settings._newLdapBindPassword || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, _newLdapBindPassword: e.target.value }))}
              placeholder={settings.ldapBindPassword ? 'Saved password configured. Type a new password to replace it.' : 'Enter bind password'}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              {settings.ldapBindPassword ? 'A bind password is saved. Leave this blank to keep it unchanged.' : 'No bind password is currently saved.'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Search and Mapping</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">User Search Base</label>
            <input
              value={settings.ldapUserSearchBase || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapUserSearchBase: e.target.value }))}
              placeholder="OU=Users,DC=kuccps,DC=local"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User Filter</label>
            <input
              value={settings.ldapUserFilter || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapUserFilter: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input value={settings.ldapUsernameAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapUsernameAttribute: e.target.value }))} placeholder="Username attr" className="px-4 py-2 border border-gray-300 rounded-md" disabled={saving} />
            <input value={settings.ldapEmailAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapEmailAttribute: e.target.value }))} placeholder="Email attr" className="px-4 py-2 border border-gray-300 rounded-md" disabled={saving} />
            <input value={settings.ldapNameAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapNameAttribute: e.target.value }))} placeholder="Name attr" className="px-4 py-2 border border-gray-300 rounded-md" disabled={saving} />
            <input value={settings.ldapDepartmentAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapDepartmentAttribute: e.target.value }))} placeholder="Directorate attr" className="px-4 py-2 border border-gray-300 rounded-md" disabled={saving} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Directorates and Access</h3>
        <div className="space-y-4">
          <input
            value={settings.ldapDirectorateSearchBase || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, ldapDirectorateSearchBase: e.target.value }))}
            placeholder="Directorate search base"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          />
          <input
            value={settings.ldapDirectorateFilter || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, ldapDirectorateFilter: e.target.value }))}
            placeholder="Directorate filter"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          />
          <input
            value={settings.ldapIctGroupDn || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, ldapIctGroupDn: e.target.value }))}
            placeholder="ICT staff AD group DN allowed to log in"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          />
          <input
            value={settings.ldapIctUserFilter || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, ldapIctUserFilter: e.target.value }))}
            placeholder="Optional additional ICT user sync filter"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            disabled={saving}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Active Directory Settings'}
      </button>
    </form>
  );
};

export default ActiveDirectorySettings;
