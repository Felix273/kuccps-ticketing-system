import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';

const FIELDS = ['organizationName', 'emailFromName', 'supportEmail', 'noreplyEmail', 'primaryColor', 'secondaryColor'];

// Only the organisation details the system actually uses: the name (page title, emails),
// the sender name and addresses on outgoing email, and the brand colours used in emails.
const OrganizationSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getSystemSettings('organization')
      .then(response => { if (response.success) setSettings(response.settings || {}); })
      .catch(() => toast.error('Failed to load organization settings'))
      .finally(() => setLoading(false));
  }, []);

  const update = (field, value) => setSettings(previous => ({ ...previous, [field]: value }));

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(FIELDS.map(field => [field, settings[field]]));
      const response = await settingsService.updateSystemSettings(payload);
      if (response.success) toast.success('Organization settings saved');
      else toast.error(response.message || 'Failed to save organization settings');
    } catch (error) {
      toast.error(error.message || 'Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const input = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500';
  return (
    <form onSubmit={handleSave} className="settings-form settings-sections">
      <div>
        <h3 className="text-lg font-medium mb-1">Organization</h3>
        <p className="mb-4 text-xs text-gray-500">Shown in the browser title and in every email sent to requesters.</p>
        <label htmlFor="org-name" className="block text-sm font-medium mb-1">Organization name</label>
        <input id="org-name" className={input} value={settings.organizationName || ''} onChange={e => update('organizationName', e.target.value)} disabled={saving} required />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1">Email identity</h3>
        <p className="mb-4 text-xs text-gray-500">How outgoing emails are signed and where replies go.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="org-from" className="block text-sm font-medium mb-1">Sender name</label>
            <input id="org-from" className={input} value={settings.emailFromName || ''} onChange={e => update('emailFromName', e.target.value)} disabled={saving} required />
          </div>
          <div>
            <label htmlFor="org-support" className="block text-sm font-medium mb-1">Support email</label>
            <input id="org-support" type="email" className={input} value={settings.supportEmail || ''} onChange={e => update('supportEmail', e.target.value)} disabled={saving} required />
          </div>
          <div>
            <label htmlFor="org-reply" className="block text-sm font-medium mb-1">Reply-to address</label>
            <input id="org-reply" type="email" className={input} value={settings.noreplyEmail || ''} onChange={e => update('noreplyEmail', e.target.value)} disabled={saving} required />
            <p className="mt-1 text-xs text-gray-500">Use the monitored support mailbox so replies reach the ticket.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-1">Email colours</h3>
        <p className="mb-4 text-xs text-gray-500">Used for headers, buttons and accents in emails.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['primaryColor', 'Primary colour', '#911414'], ['secondaryColor', 'Secondary colour', '#d20001']].map(([field, label, fallback]) => (
            <div key={field}>
              <label htmlFor={`org-${field}`} className="block text-sm font-medium mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input type="color" aria-label={`${label} picker`} value={settings[field] || fallback} onChange={e => update(field, e.target.value)} disabled={saving} className="h-10 w-12 rounded border border-gray-300" />
                <input id={`org-${field}`} className={input} value={settings[field] || ''} onChange={e => update(field, e.target.value)} disabled={saving} pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Organization Settings'}
      </button>
    </form>
  );
};

export default OrganizationSettings;
