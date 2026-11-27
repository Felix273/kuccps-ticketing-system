import React, { useState } from 'react';
import { PRIORITY_LEVELS, TICKET_STATUS } from '../../utils/constants';
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

  const inputClass = "w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#990024] focus:bg-white";
  const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5";
  const sectionCardClass = "bg-white rounded-lg p-4 border border-zinc-200";
  const sectionTitleClass = "font-mono text-[11px] uppercase tracking-wider text-zinc-700 font-bold mb-3";

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col font-sans">

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="font-mono text-xs text-zinc-400">
                Tickets / <strong className="text-zinc-900 font-bold">Search</strong>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 leading-snug">
                Advanced Search
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Text Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Ticket Number</label>
              <input
                type="text"
                placeholder="TKT-000001"
                value={filters.ticketNumber}
                onChange={(e) => setFilters({...filters, ticketNumber: e.target.value})}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Subject Contains</label>
              <input
                type="text"
                placeholder="Search subject..."
                value={filters.subject}
                onChange={(e) => setFilters({...filters, subject: e.target.value})}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Requester Email</label>
              <input
                type="text"
                placeholder="user@example.com"
                value={filters.requesterEmail}
                onChange={(e) => setFilters({...filters, requesterEmail: e.target.value})}
                className={inputClass}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-zinc-50/70 rounded-lg p-4 border border-zinc-200">
            <h3 className={sectionTitleClass + " flex items-center gap-2"}>
              <Calendar className="w-3.5 h-3.5 text-[#990024]" />
              Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Multi-select Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className={sectionCardClass}>
              <h4 className={sectionTitleClass}>Status</h4>
              <div className="space-y-2">
                {TICKET_STATUS.map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer font-mono text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleCheckboxChange('status', status)}
                      className="rounded border-zinc-300 text-[#990024] focus:ring-0"
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className={sectionCardClass}>
              <h4 className={sectionTitleClass}>Priority</h4>
              <div className="space-y-2">
                {PRIORITY_LEVELS.map(priority => (
                  <label key={priority} className="flex items-center gap-2 cursor-pointer font-mono text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={() => handleCheckboxChange('priority', priority)}
                      className="rounded border-zinc-300 text-[#990024] focus:ring-0"
                    />
                    <span>{priority}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Department */}
            <div className={sectionCardClass}>
              <h4 className={sectionTitleClass}>Department</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {departments.map(dept => (
                  <label key={dept.id} className="flex items-center gap-2 cursor-pointer font-mono text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      checked={filters.department.includes(dept.name)}
                      onChange={() => handleCheckboxChange('department', dept.name)}
                      className="rounded border-zinc-300 text-[#990024] focus:ring-0"
                    />
                    <span>{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Claimed By */}
            <div className={sectionCardClass}>
              <h4 className={sectionTitleClass}>Claimed By</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {users.filter(u => u.role !== 'user').map(user => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer font-mono text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      checked={filters.assignedTo.includes(user.id)}
                      onChange={() => handleCheckboxChange('assignedTo', user.id)}
                      className="rounded border-zinc-300 text-[#990024] focus:ring-0"
                    />
                    <span>{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 bg-zinc-50/80 p-3.5 px-6 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="px-4 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-mono font-semibold rounded transition-colors cursor-pointer"
          >
            Clear All
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-mono font-semibold rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-3.5 py-1.5 bg-[#990024] hover:bg-[#80001e] text-white text-xs font-mono font-semibold rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3 h-3" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};