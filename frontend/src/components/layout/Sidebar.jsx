import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Building2, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  X,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { NotificationPreferences } from '../settings/NotificationPreferences';

export const Sidebar = ({ activeTab, setActiveTab, currentUser, onLogout, mobileOpen, setMobileOpen }) => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'All Tickets', icon: Ticket },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'knowledgebase', label: 'Knowledge Base', icon: BookOpen },
  ];

  if (currentUser?.isAdmin || currentUser?.permissions?.some(permission =>
    permission.startsWith('settings.') && !permission.startsWith('settings.notifications.')
  )) {
    navItems.push({ id: 'admin', label: 'Settings', icon: Settings });
  }

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'IT';

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between
        transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Top: Branding Header */}
        <div>
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src="/kuccps-logo.png" 
                alt="KUCCPS" 
                className="h-8 w-auto object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-black tracking-tight text-slate-900 block truncate">
                  KUCCPS IT PORTAL
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Support & Services
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                    ${isActive 
                      ? 'bg-[#990024] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}
                  `}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Card & Sign Out */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* User Profile Pill */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#990024] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {currentUser?.name || 'Staff User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-red-100 text-[#990024]">
                  {currentUser?.role || 'staff'}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                  {currentUser?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center gap-1">
            {currentUser?.permissions?.includes('settings.notifications.view') && <button
              onClick={() => setShowNotificationSettings(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Notification Settings"
            >
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              <span>Alerts</span>
            </button>}

            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

      </aside>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-[#990024] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Notification Preferences</h2>
                <p className="text-xs text-red-100">Manage support alerts and email notifications</p>
              </div>
              <button
                onClick={() => setShowNotificationSettings(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <NotificationPreferences
                canEdit={currentUser?.permissions?.includes('settings.notifications.update')}
                canTest={currentUser?.permissions?.includes('settings.notifications.test')}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
