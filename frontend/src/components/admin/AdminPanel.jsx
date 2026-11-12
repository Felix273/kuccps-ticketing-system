import React, { useMemo, useState } from 'react';
import {
  Building2,
  Mail,
  Ticket,
  Globe,
  FileText,
  Sliders,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import OrganizationSettings from './OrganizationSettings';
import EmailSettings from './EmailSettings';
import TicketSettings from './TicketSettings';
import EmailTemplates from './EmailTemplates';
import CustomFormsSettings from './CustomFormsSettings';
import ActiveDirectorySettings from './ActiveDirectorySettings';
import AccessControlSettings from './AccessControlSettings';

const SETTINGS_SECTIONS = [
  { id: 'organization', label: 'Organization & Identity', icon: Building2, view: 'settings.organization.view', update: 'settings.organization.update' },
  { id: 'email', label: 'Email & IMAP', icon: Mail, view: 'settings.email.view', update: 'settings.email.update' },
  { id: 'tickets', label: 'Ticket & SLA Policies', icon: Ticket, view: 'settings.tickets.view', update: 'settings.tickets.update' },
  { id: 'ad', label: 'Active Directory / LDAP', icon: Globe, view: 'settings.ldap.view', update: 'settings.ldap.update' },
  { id: 'templates', label: 'Email Templates', icon: FileText, view: 'settings.templates.view' },
  { id: 'forms', label: 'Custom Forms', icon: Sliders, view: 'settings.forms.view' }
];

const AdminPanel = ({ currentUser }) => {
  const permissions = useMemo(() => new Set(currentUser?.permissions || []), [currentUser?.permissions]);
  const [activeTab, setActiveTab] = useState('');
  const tabs = useMemo(() => {
    const available = SETTINGS_SECTIONS.filter(section => permissions.has(section.view));
    if (currentUser?.isAdmin) {
      available.push({ id: 'access', label: 'Roles & Permissions', icon: ShieldCheck, view: 'access-control.manage' });
    }
    return available;
  }, [permissions, currentUser?.isAdmin]);

  if (!tabs.length) {
    return <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">You do not have permission to view Settings.</p>;
  }

  const selectedTab = tabs.some(tab => tab.id === activeTab) ? activeTab : tabs[0].id;
  const activeSection = SETTINGS_SECTIONS.find(section => section.id === selectedTab);
  const canEdit = activeSection ? permissions.has(activeSection.update) : false;

  return (
    <div className="admin-settings space-y-5">

      {/* 1. Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#990024]" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                System Administration & Settings
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
            Configure the system sections assigned to your account
            </p>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 text-[#990024] border border-red-100 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#990024]" />
            <span>{currentUser?.isAdmin ? 'Administrator Console' : 'Settings Access'}</span>
          </div>
        </div>

        {/* 2. Modern Tab Navigation Strip */}
        <nav className="mt-5 pt-3 border-t border-slate-100" aria-label="Settings sections">
          <div className="flex overflow-x-auto gap-1.5 scrollbar-none pb-0.5" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="settings-panel"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#990024] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* 3. Settings View Container */}
      <div
        id="settings-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${selectedTab}`}
        className="settings-content bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-6"
      >
        {selectedTab === 'organization' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><OrganizationSettings /></fieldset>}
        {selectedTab === 'email' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><EmailSettings /></fieldset>}
        {selectedTab === 'tickets' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><TicketSettings /></fieldset>}
        {selectedTab === 'ad' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><ActiveDirectorySettings /></fieldset>}
        {selectedTab === 'templates' && <EmailTemplates permissions={permissions} />}
        {selectedTab === 'forms' && <CustomFormsSettings permissions={permissions} />}
        {selectedTab === 'access' && currentUser?.isAdmin && <AccessControlSettings currentUser={currentUser} />}
      </div>

    </div>
  );
};

export default AdminPanel;
