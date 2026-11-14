import React, { useState } from 'react';
import { Bell, Settings, LogOut, X, Menu, Book, User } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { NotificationPreferences } from '../settings/NotificationPreferences';

export const Header = ({ currentUser, onLogout, setActiveTab }) => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'IT';

  return (
    <>
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and System Title */}
            <div className="flex items-center gap-3.5 min-w-0">
              <img 
                src="/kuccps-logo.png" 
                alt="KUCCPS Logo" 
                className="h-9 sm:h-10 w-auto object-contain flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="border-l border-slate-200 pl-3 hidden sm:block">
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                  KUCCPS IT Ticketing
                </h1>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Internal Support & Services Console
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2.5 lg:gap-3">
              {/* Notification Bell */}
              <div className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <NotificationBell onOpenSettings={() => setShowNotificationSettings(true)} />
              </div>

              {/* Knowledge Base Shortcut */}
              <button
                onClick={() => setActiveTab && setActiveTab('knowledgebase')}
                className="p-2 text-slate-600 hover:text-[#990024] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Knowledge Base"
              >
                <Book className="w-5 h-5" />
              </button>

              {/* Settings Shortcut */}
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => setActiveTab && setActiveTab('admin')}
                  className="p-2 text-slate-600 hover:text-[#990024] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="System Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

              {/* User Profile Info */}
              <div className="flex items-center gap-3 pl-1">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser?.name || 'Staff User'}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="inline-block px-1.5 py-0.2 text-[10px] font-bold uppercase rounded bg-red-100 text-[#990024]">
                      {currentUser?.role || 'staff'}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                      {currentUser?.email}
                    </span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-[#990024] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitials}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 ml-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Header Controls */}
            <div className="flex md:hidden items-center gap-1.5">
              <NotificationBell onOpenSettings={() => setShowNotificationSettings(true)} />
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="md:hidden py-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-[#990024] text-white flex items-center justify-center font-bold text-xs">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-[#990024]">
                  {currentUser?.role}
                </span>
              </div>

              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => {
                    setShowMobileMenu(false);
                    setActiveTab && setActiveTab('admin');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Admin Settings</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

        </div>
      </header>

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
              <NotificationPreferences />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
