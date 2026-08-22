import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';
import { Server, ShieldCheck, Search, Users, Key } from 'lucide-react';

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
        toast.success('Active Directory settings saved successfully');
      } else {
        toast.error(response.message || 'Failed to save Active Directory settings');
      }
    } catch {
      toast.error('Failed to save Active Directory settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600">Loading Active Directory settings...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-[#911414]" />
            LDAP / Active Directory Authentication
          </h3>
          <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              checked={settings.ldapEnabled || false}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapEnabled: e.target.checked }))}
              disabled={saving}
              className="rounded text-[#911414] focus:ring-[#911414]"
            />
            <span className="text-sm font-semibold text-gray-800">Enable AD Login</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">LDAP Server URL</label>
            <input
              value={settings.ldapUrl || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapUrl: e.target.value }))}
              placeholder="ldaps://dc01.kuccps.ac.ke:636 or ldap://dc01.kuccps.ac.ke:389"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">Production should use secure LDAPS (Port 636).</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">AD Domain Name</label>
            <input
              value={settings.ldapDomain || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapDomain: e.target.value }))}
              placeholder="kuccps.ac.ke"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Base DN</label>
            <input
              value={settings.ldapBaseDn || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapBaseDn: e.target.value }))}
              placeholder="DC=kuccps,DC=ac,DC=ke"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username Login Attribute</label>
            <input
              value={settings.ldapUserDnPrefix || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapUserDnPrefix: e.target.value }))}
              placeholder="sAMAccountName"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Key className="w-5 h-5 text-[#911414]" />
          Bind Account Credentials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bind Account DN</label>
            <input
              value={settings.ldapBindDn || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapBindDn: e.target.value }))}
              placeholder="CN=svc-ticketing,OU=ServiceAccounts,DC=kuccps,DC=ac,DC=ke"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bind Password</label>
            <input
              type="password"
              value={settings._newLdapBindPassword || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, _newLdapBindPassword: e.target.value }))}
              placeholder={settings.ldapBindPassword ? 'Saved password configured. Type a new password to replace it.' : 'Enter bind password'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              {settings.ldapBindPassword ? 'A bind password is saved. Leave blank to keep existing password.' : 'No bind password is currently saved.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#911414]" />
          User Search & Attribute Mapping
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User Search Base</label>
              <input
                value={settings.ldapUserSearchBase || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, ldapUserSearchBase: e.target.value }))}
                placeholder="OU=Staff,DC=kuccps,DC=ac,DC=ke"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User Object Filter</label>
              <input
                value={settings.ldapUserFilter || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, ldapUserFilter: e.target.value }))}
                placeholder="(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Attribute Mappings</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Username</span>
                <input value={settings.ldapUsernameAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapUsernameAttribute: e.target.value }))} placeholder="sAMAccountName" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Email</span>
                <input value={settings.ldapEmailAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapEmailAttribute: e.target.value }))} placeholder="mail" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Full Name</span>
                <input value={settings.ldapNameAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapNameAttribute: e.target.value }))} placeholder="displayName" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Directorate</span>
                <input value={settings.ldapDepartmentAttribute || ''} onChange={(e) => setSettings(prev => ({ ...prev, ldapDepartmentAttribute: e.target.value }))} placeholder="department" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={saving} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#911414]" />
          ICT Group Permissions & Directorate Sync
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">ICT Staff AD Group DN</label>
            <input
              value={settings.ldapIctGroupDn || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapIctGroupDn: e.target.value }))}
              placeholder="CN=ICT-Staff,OU=Groups,DC=kuccps,DC=ac,DC=ke"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">Users belonging to this group will automatically be assigned ICT Staff permissions in the ticketing system.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Directorate Search Base</label>
            <input
              value={settings.ldapDirectorateSearchBase || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapDirectorateSearchBase: e.target.value }))}
              placeholder="OU=Directorates,DC=kuccps,DC=ac,DC=ke"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Directorate Object Filter</label>
            <input
              value={settings.ldapDirectorateFilter || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ldapDirectorateFilter: e.target.value }))}
              placeholder="(|(objectClass=organizationalUnit)(objectClass=group))"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414]"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-[#911414] text-white font-medium text-sm rounded-lg hover:bg-[#720e0e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? 'Saving Settings...' : 'Save Active Directory Settings'}
        </button>
      </div>
    </form>
  );
};

export default ActiveDirectorySettings;
