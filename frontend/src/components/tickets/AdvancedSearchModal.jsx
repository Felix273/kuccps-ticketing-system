import React, { useState } from 'react';
import { X, Search, Calendar, Filter } from 'lucide-react';

export const AdvancedSearchModal = ({ onClose, onApply, departments, users }) => {
  const [filters, setFilters] = useState({
    ticketNumber: '',
    subject: '',
    requesterEmail: '',
    status: [],
    priority: [],
    category: [],
    assignedTo: [],
    department: [],
    dateFrom: '',
    dateTo: '',
  });

  const handleCheckboxChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({
      ticketNumber: '',
      subject: '',
      requesterEmail: '',
      status: [],
      priority: [],
      category: [],
      assignedTo: [],
      department: [],
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Filter className="w-6 h-6" />
                Advanced Search
              </h2>
              <p className="text-white/80 mt-1">Build complex search criteria</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Text Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ticket Number
              </label>
              <input
                type="text"
                placeholder="TKT-000001"
                value={filters.ticketNumber}
                onChange={(e) => setFilters({...filters, ticketNumber: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject Contains
              </label>
              <input
                type="text"
                placeholder="Search subject..."
                value={filters.subject}
                onChange={(e) => setFilters({...filters, subject: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Requester Email
              </label>
              <input
                type="text"
                placeholder="user@example.com"
                value={filters.requesterEmail}
                onChange={(e) => setFilters({...filters, requesterEmail: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Multi-select Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Status</h4>
              <div className="space-y-2">
                {['Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleCheckboxChange('status', status)}
                      className="w-4 h-4 text-[#911414] rounded focus:ring-[#911414]"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Priority</h4>
              <div className="space-y-2">
                {['Low', 'Medium', 'High', 'Critical'].map(priority => (
                  <label key={priority} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={() => handleCheckboxChange('priority', priority)}
                      className="w-4 h-4 text-[#911414] rounded focus:ring-[#911414]"
                    />
                    <span className="text-sm text-gray-700">{priority}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Department */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Department</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {departments.map(dept => (
                  <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.department.includes(dept.name)}
                      onChange={() => handleCheckboxChange('department', dept.name)}
                      className="w-4 h-4 text-[#911414] rounded focus:ring-[#911414]"
                    />
                    <span className="text-sm text-gray-700">{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assigned To */}
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Assigned To</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {users.filter(u => u.role !== 'user').map(user => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.assignedTo.includes(user.id)}
                      onChange={() => handleCheckboxChange('assignedTo', user.id)}
                      className="w-4 h-4 text-[#911414] rounded focus:ring-[#911414]"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-between items-center rounded-b-xl">
          <button
            onClick={handleClear}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
