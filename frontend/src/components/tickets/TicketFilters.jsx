// src/components/tickets/TicketFilters.jsx
import React from 'react';
import { Search, Download } from 'lucide-react';
import { TICKET_STATUS, DEPARTMENTS } from '../../utils/constants';

export const TicketFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  filterStatus, 
  setFilterStatus,
  filterDepartment,
  setFilterDepartment,
  onExport
}) => (
  <div className="flex flex-col lg:flex-row gap-4 mb-6">
    <div className="flex-1 relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Search tickets by ID, subject, or email..."
        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent text-sm"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
    <select
      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] text-sm font-medium"
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
    >
      <option value="All">All Status</option>
      {TICKET_STATUS.map(status => (
        <option key={status} value={status}>{status}</option>
      ))}
    </select>
    <select
      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] text-sm font-medium"
      value={filterDepartment}
      onChange={(e) => setFilterDepartment(e.target.value)}
    >
      <option value="All">All Departments</option>
      {DEPARTMENTS.map(dept => (
        <option key={dept} value={dept}>{dept}</option>
      ))}
    </select>
    <button 
      onClick={onExport}
      className="px-6 py-3 bg-[#911414] text-white rounded-lg hover:bg-[#ac0807] flex items-center gap-2 font-medium transition-colors"
    >
      <Download className="w-4 h-4" />
      Export
    </button>
  </div>
);