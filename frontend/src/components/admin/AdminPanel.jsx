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
  Clock3,
} from 'lucide-react';
import OrganizationSettings from './OrganizationSettings';
import EmailSettings from './EmailSettings';
import TicketSettings from './TicketSettings';
import EmailTemplates from './EmailTemplates';
import CustomFormsSettings from './CustomFormsSettings';
import ActiveDirectorySettings from './ActiveDirectorySettings';
import AccessControlSettings from './AccessControlSettings';
import SlaTimelineSettings from './SlaTimelineSettings';

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
      available.push({ id: 'sla-timelines', label: 'SLA Timelines', icon: Clock3 });
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
  const handleTabKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    const tabButtons = event.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
    tabButtons?.[nextIndex]?.focus();
  };

  return (
    <div className="admin-settings space-y-4 font-sans text-zinc-800">
      <header className="settings-shell-card p-4 sm:p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#990024]" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                Settings
              </h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Configure the system sections available to your account.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-[#990024]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>{currentUser?.isAdmin ? 'Administrator Console' : 'Settings Access'}</span>
          </div>
        </div>

        <nav className="mt-5 border-t border-zinc-100 pt-3" aria-label="Settings sections">
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-orientation="horizontal">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={event => handleTabKeyDown(event, index)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="settings-panel"
                  tabIndex={isActive ? 0 : -1}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990024] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-[#990024] text-white'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <div
        id="settings-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${selectedTab}`}
        className="settings-content settings-shell-card min-w-0 p-4 sm:p-6"
      >
        <div className="settings-content-inner">
          {selectedTab === 'organization' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><OrganizationSettings /></fieldset>}
          {selectedTab === 'email' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><EmailSettings /></fieldset>}
          {selectedTab === 'tickets' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><TicketSettings /></fieldset>}
          {selectedTab === 'ad' && <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><ActiveDirectorySettings /></fieldset>}
          {selectedTab === 'templates' && <EmailTemplates permissions={permissions} />}
          {selectedTab === 'forms' && <CustomFormsSettings permissions={permissions} />}
          {selectedTab === 'sla-timelines' && currentUser?.isAdmin && <SlaTimelineSettings />}
          {selectedTab === 'access' && currentUser?.isAdmin && <AccessControlSettings currentUser={currentUser} />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
