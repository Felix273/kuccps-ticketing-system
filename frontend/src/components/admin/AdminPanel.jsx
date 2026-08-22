import React, { useState } from 'react';
import OrganizationSettings from './OrganizationSettings';
import EmailSettings from './EmailSettings';
import ActiveDirectorySettings from './ActiveDirectorySettings';
import { authService } from '../../services/authService';

const AdminPanel = () => {
  const currentUser = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('organization');

  if (currentUser?.role !== 'admin') {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">Administrative permissions are required to access this panel.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'organization', label: 'Organization & Branding' },
    { id: 'email', label: 'Email & IMAP Settings' },
    { id: 'ad', label: 'Active Directory / LDAP' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Administration</h2>
          <p className="text-sm text-gray-500 mt-1">Configure global branding, mail servers, and Active Directory authentication</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold transition-colors relative
                ${activeTab === tab.id
                  ? 'text-[#911414] bg-white border-t-2 border-t-[#911414] -mb-px'
                  : 'text-gray-500 hover:text-gray-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'organization' && <OrganizationSettings />}
          {activeTab === 'email' && <EmailSettings />}
          {activeTab === 'ad' && <ActiveDirectorySettings />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
