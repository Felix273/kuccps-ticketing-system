import React, { useState } from 'react';
import { Menu, RefreshCw, X } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { NotificationPreferences } from '../settings/NotificationPreferences';

const TAB_TITLES = {
  dashboard: 'Dashboard Overview',
  tickets: 'All Tickets Queue',
  departments: 'Departments Directory',
  users: 'User Management',
  knowledgebase: 'Knowledge Base Articles',
  admin: 'System & Admin Settings'
};

export const TopBar = ({ activeTab, onOpenMobileMenu, onRefresh, isLoading }) => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  return (
    <>
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {TAB_TITLES[activeTab] || 'Support Console'}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            KUCCPS ICT Ticketing & Operations
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#990024]' : ''}`} />
          </button>
        )}

        <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Notifications */}
        <div className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <NotificationBell onOpenSettings={() => setShowNotificationSettings(true)} />
        </div>
      </div>

    </header>
    {showNotificationSettings && (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
          <div className="bg-[#990024] text-white px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold">Notification Preferences</h2>
              <p className="text-xs text-red-100">Manage support alerts and email notifications</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationSettings(false)}
              aria-label="Close notification preferences"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto">
            <NotificationPreferences />
          </div>
        </div>
      </div>
    )}
    </>
  );
};
