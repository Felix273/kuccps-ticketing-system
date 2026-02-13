import React from 'react';
import { User, AlertCircle, Clock, CheckCircle, UserX, Zap } from 'lucide-react';

export const QuickFilters = ({ onFilterSelect, activeFilter, currentUser }) => {
  const quickFilters = [
    {
      id: 'my-tickets',
      label: 'My Tickets',
      icon: <User className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
      activeColor: 'bg-blue-600 text-white border-blue-600',
      filter: { assignedToId: currentUser?.id }
    },
    {
      id: 'unassigned',
      label: 'Unassigned',
      icon: <UserX className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
      activeColor: 'bg-gray-600 text-white border-gray-600',
      filter: { assignedToId: null }
    },
    {
      id: 'critical',
      label: 'Critical',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200',
      activeColor: 'bg-red-600 text-white border-red-600',
      filter: { priority: 'Critical' }
    },
    {
      id: 'open',
      label: 'Open',
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
      activeColor: 'bg-orange-600 text-white border-orange-600',
      filter: { status: 'Open' }
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
      activeColor: 'bg-purple-600 text-white border-purple-600',
      filter: { status: 'In Progress' }
    },
    {
      id: 'resolved',
      label: 'Resolved',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
      activeColor: 'bg-green-600 text-white border-green-600',
      filter: { status: 'Resolved' }
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</h3>
      <div className="flex flex-wrap gap-2">
        {quickFilters.map(filter => (
          <button
            key={filter.id}
            onClick={() => onFilterSelect(filter.id, filter.filter)}
            className={`px-4 py-2 rounded-lg border-2 font-medium text-sm flex items-center gap-2 transition-all ${
              activeFilter === filter.id ? filter.activeColor : filter.color
            }`}
          >
            {filter.icon}
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};
