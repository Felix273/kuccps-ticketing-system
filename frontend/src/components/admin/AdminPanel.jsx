import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OrganizationSettings from './OrganizationSettings';
import EmailSettings from './EmailSettings';
import TicketSettings from './TicketSettings';
import EmailTemplates from './EmailTemplates';
import CustomFormsSettings from './CustomFormsSettings';
import ActiveDirectorySettings from './ActiveDirectorySettings';

const AdminPanel = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('organization');
  const navigate = useNavigate();

  // Check if user is admin
  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  if (user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const tabs = [
    { id: 'organization', label: 'Organization' },
    { id: 'email', label: 'Email Settings' },
    { id: 'tickets', label: 'Ticket Settings' },
    { id: 'ad', label: 'Active Directory' },
    { id: 'templates', label: 'Email Templates' },
    { id: 'forms', label: 'Custom Forms' }
  ];

  return (
    <div className="admin-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome, {user.name}</span>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/');
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium
                ${activeTab === tab.id
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'organization' && <OrganizationSettings />}
        {activeTab === 'email' && <EmailSettings />}
        {activeTab === 'tickets' && <TicketSettings />}
        {activeTab === 'ad' && <ActiveDirectorySettings />}
        {activeTab === 'templates' && <EmailTemplates />}
        {activeTab === 'forms' && <CustomFormsSettings />}
      </div>
    </div>
  );
};

export default AdminPanel;
