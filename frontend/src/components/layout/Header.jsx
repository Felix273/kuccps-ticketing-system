import React, { useState } from 'react';
import { Bell, Settings, LogOut, X, Menu, Book } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { NotificationPreferences } from '../settings/NotificationPreferences';

export const Header = ({ currentUser, onLogout, setActiveTab }) => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title - Responsive */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <img 
                src="/kuccps-logo.png" 
                alt="KUCCPS Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">
                  KUCCPS IT Ticketing
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Internal IT Support Dashboard</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              {/* Notification Bell */}
              <NotificationBell onOpenSettings={() => setShowNotificationSettings(true)} />
              
              {/* Knowledge Base */}
              <button
                onClick={() => setActiveTab('knowledgebase')}
                className="p-2 text-gray-600 hover:text-[#911414] hover:bg-gray-100 rounded-lg transition-colors relative group"
                title="Knowledge Base"
              >
                <Book className="w-5 h-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Knowledge Base
                </span>
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-600 hover:text-[#911414] hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.role === 'admin' ? 'IT Admin' : currentUser?.name}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-[#911414] to-[#d20001] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs lg:text-sm font-bold">
                    {currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'IA'}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <NotificationBell onOpenSettings={() => setShowNotificationSettings(true)} />
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600 hover:text-[#911414] hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#911414] to-[#d20001] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'IA'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {currentUser?.role === 'admin' ? 'IT Admin' : currentUser?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                  </div>
                </div>

                {/* Settings Button */}
                <button 
                  onClick={() => {
                    setShowMobileMenu(false);
                    // Add settings action
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-4 sm:p-6 rounded-t-xl flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold">Notification Settings</h2>
              <button
                onClick={() => setShowNotificationSettings(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <NotificationPreferences />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
