import React from 'react';
import { Home, FileText, Building2, Users, Book } from 'lucide-react';

export const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tickets', label: 'All Tickets', icon: FileText },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'knowledgebase', label: 'Knowledge Base', icon: Book },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-14 sm:top-16 z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Mobile: Horizontal scroll */}
        <div className="flex overflow-x-auto scrollbar-hide -mx-2 sm:mx-0">
          <div className="flex space-x-1 sm:space-x-4 px-2 sm:px-0 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#911414] to-[#d20001] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
