import React, { useMemo, useState } from 'react';
import { Building2, Mail, Ticket, Globe, ShieldCheck, ScrollText } from 'lucide-react';
import OrganizationSettings from './OrganizationSettings';
import EmailSettings from './EmailSettings';
import TicketSettings from './TicketSettings';
import EmailTemplates from './EmailTemplates';
import ActiveDirectorySettings from './ActiveDirectorySettings';
import AccessControlSettings from './AccessControlSettings';
import AccessAuditLog from './AccessAuditLog';
import SlaTimelineSettings from './SlaTimelineSettings';
import { can } from '../../utils/permissions';

// Settings areas. Each is shown only to people holding its permission.
const SECTIONS = [
  {
    id: 'organization',
    label: 'Organization',
    description: 'Name, email identity and email colours',
    icon: Building2,
    permission: 'settings.organization'
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Outgoing and incoming mail, test mode and templates',
    icon: Mail,
    permission: 'settings.email',
    tabs: [['delivery', 'Mail delivery'], ['templates', 'Email templates']]
  },
  {
    id: 'service-desk',
    label: 'Service Desk',
    description: 'Ticket defaults, escalation, attachments and SLA timelines',
    icon: Ticket,
    permission: 'settings.service-desk',
    tabs: [['rules', 'Ticket rules'], ['sla', 'SLA timelines']]
  },
  {
    id: 'directory',
    label: 'Active Directory',
    description: 'Directory connection and synchronisation',
    icon: Globe,
    permission: 'settings.directory'
  },
  {
    id: 'access',
    label: 'Roles & Access',
    description: 'Who can do what in the system',
    icon: ShieldCheck,
    permission: 'access.manage'
  },
  {
    id: 'audit',
    label: 'Access Audit Log',
    description: 'History of role and permission changes',
    icon: ScrollText,
    permission: 'audit.view',
    alsoAllowed: ['access.manage']
  }
];

const AdminPanel = ({ currentUser }) => {
  const sections = useMemo(
    () => SECTIONS.filter(section => can(currentUser, section.permission, ...(section.alsoAllowed || []))),
    [currentUser]
  );
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTab, setSelectedTab] = useState({});

  if (!sections.length) {
    return <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">You do not have access to any settings.</p>;
  }

  const active = sections.find(section => section.id === selectedId) || sections[0];
  const tab = selectedTab[active.id] || active.tabs?.[0]?.[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <nav aria-label="Settings sections" className="space-y-1">
        <p className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Settings</p>
        {sections.map(section => {
          const Icon = section.icon;
          const isActive = section.id === active.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelectedId(section.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-white shadow-sm ring-1 ring-zinc-200' : 'hover:bg-zinc-100'}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? 'text-[#990024]' : 'text-zinc-400'}`} aria-hidden="true" />
              <span>
                <span className={`block text-sm ${isActive ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>{section.label}</span>
                <span className="block text-[11px] text-zinc-500">{section.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6" aria-labelledby="settings-section-title">
        <h1 id="settings-section-title" className="text-lg font-semibold text-zinc-900">{active.label}</h1>
        <p className="mb-4 text-xs text-zinc-500">{active.description}</p>

        {active.tabs && (
          <div className="mb-5 flex gap-1 border-b border-zinc-200" role="tablist">
            {active.tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setSelectedTab(previous => ({ ...previous, [active.id]: id }))}
                className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold ${tab === id ? 'border-[#990024] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {active.id === 'organization' && <OrganizationSettings />}
        {active.id === 'email' && tab === 'delivery' && <EmailSettings />}
        {active.id === 'email' && tab === 'templates' && <EmailTemplates permissions={new Set(currentUser?.permissions || [])} />}
        {active.id === 'service-desk' && tab === 'rules' && <TicketSettings />}
        {active.id === 'service-desk' && tab === 'sla' && <SlaTimelineSettings />}
        {active.id === 'directory' && <ActiveDirectorySettings canEdit />}
        {active.id === 'access' && <AccessControlSettings currentUser={currentUser} />}
        {active.id === 'audit' && <AccessAuditLog />}
      </section>
    </div>
  );
};

export default AdminPanel;
