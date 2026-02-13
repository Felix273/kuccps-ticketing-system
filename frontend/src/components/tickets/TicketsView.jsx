import React, { useState, useMemo } from 'react';
import { Search, Filter, RefreshCw, AlertCircle, Download, Sliders } from 'lucide-react';
import { TicketCard } from './TicketCard';
import { TicketAssignModal } from './TicketAssignModal';
import { TicketDetailModal } from './TicketDetailModal';
import { QuickFilters } from './QuickFilters';
import { SavedFilters } from './SavedFilters';
import { AdvancedSearchModal } from './AdvancedSearchModal';
import { ticketService } from '../../services/ticketService';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { authService } from '../../services/authService';

export const TicketsView = ({ tickets = [], isLoading, error, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState('all');
  const [assigningTicket, setAssigningTicket] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(null);

  const { departments } = useDepartments(true);
  const { users } = useUsers();
  const currentUser = authService.getCurrentUser();

  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Apply advanced filters if set
    if (advancedFilters) {
      if (advancedFilters.ticketNumber) {
        result = result.filter(t => 
          t.ticketNumber.toLowerCase().includes(advancedFilters.ticketNumber.toLowerCase())
        );
      }
      if (advancedFilters.subject) {
        result = result.filter(t => 
          t.subject.toLowerCase().includes(advancedFilters.subject.toLowerCase())
        );
      }
      if (advancedFilters.requesterEmail) {
        result = result.filter(t => 
          t.requesterEmail.toLowerCase().includes(advancedFilters.requesterEmail.toLowerCase())
        );
      }
      if (advancedFilters.status.length > 0) {
        result = result.filter(t => advancedFilters.status.includes(t.status));
      }
      if (advancedFilters.priority.length > 0) {
        result = result.filter(t => advancedFilters.priority.includes(t.priority));
      }
      if (advancedFilters.department.length > 0) {
        result = result.filter(t => 
          advancedFilters.department.includes(t.department?.name) ||
          advancedFilters.department.includes(t.assignedTo?.department)
        );
      }
      if (advancedFilters.assignedTo.length > 0) {
        result = result.filter(t => advancedFilters.assignedTo.includes(t.assignedToId));
      }
      if (advancedFilters.dateFrom) {
        const fromDate = new Date(advancedFilters.dateFrom);
        result = result.filter(t => new Date(t.createdAt) >= fromDate);
      }
      if (advancedFilters.dateTo) {
        const toDate = new Date(advancedFilters.dateTo);
        toDate.setHours(23, 59, 59);
        result = result.filter(t => new Date(t.createdAt) <= toDate);
      }
    } else {
      // Apply standard filters
      const matchesSearch = (ticket) =>
        ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.requesterEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = (ticket) =>
        filterStatus === 'all' || ticket.status === filterStatus;
      
      const matchesPriority = (ticket) =>
        filterPriority === 'all' || ticket.priority === filterPriority;
      
      const matchesDepartment = (ticket) =>
        filterDepartment === 'all' || 
        ticket.department?.name === filterDepartment ||
        ticket.assignedTo?.department === filterDepartment;
      
      const matchesAssignedTo = (ticket) =>
        filterAssignedTo === 'all' || 
        (filterAssignedTo === 'unassigned' ? !ticket.assignedToId : ticket.assignedToId === filterAssignedTo);

      result = result.filter(ticket =>
        matchesSearch(ticket) &&
        matchesStatus(ticket) &&
        matchesPriority(ticket) &&
        matchesDepartment(ticket) &&
        matchesAssignedTo(ticket)
      );
    }

    return result;
  }, [tickets, searchQuery, filterStatus, filterPriority, filterDepartment, filterAssignedTo, advancedFilters]);

  const handleQuickFilter = (filterId, filterCriteria) => {
    // Clear advanced filters
    setAdvancedFilters(null);
    
    if (activeQuickFilter === filterId) {
      // Toggle off
      setActiveQuickFilter(null);
      clearAllFilters();
    } else {
      // Apply quick filter
      setActiveQuickFilter(filterId);
      
      if (filterCriteria.assignedToId === currentUser?.id) {
        setFilterAssignedTo(currentUser.id);
      } else if (filterCriteria.assignedToId === null) {
        setFilterAssignedTo('unassigned');
      } else if (filterCriteria.status) {
        setFilterStatus(filterCriteria.status);
      } else if (filterCriteria.priority) {
        setFilterPriority(filterCriteria.priority);
      }
    }
  };

  const handleAdvancedSearch = (filters) => {
    setAdvancedFilters(filters);
    setActiveQuickFilter(null);
    clearStandardFilters();
  };

  const handleLoadSavedFilter = (filters) => {
    setAdvancedFilters(filters);
    setActiveQuickFilter(null);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterDepartment('all');
    setFilterAssignedTo('all');
    setActiveQuickFilter(null);
    setAdvancedFilters(null);
  };

  const clearStandardFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterDepartment('all');
    setFilterAssignedTo('all');
  };

  const getCurrentFilters = () => {
    if (advancedFilters) return advancedFilters;
    
    return {
      searchQuery,
      status: filterStatus !== 'all' ? filterStatus : null,
      priority: filterPriority !== 'all' ? filterPriority : null,
      department: filterDepartment !== 'all' ? filterDepartment : null,
      assignedTo: filterAssignedTo !== 'all' ? filterAssignedTo : null
    };
  };

  const handleExport = (format) => {
    if (filteredTickets.length === 0) {
      alert('No tickets to export');
      return;
    }

    const filename = `tickets_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(filteredTickets, `${filename}.csv`);
    } else {
      exportToExcel(filteredTickets, `${filename}.xlsx`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#911414] animate-spin" />
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center gap-4 py-8">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-900">Error Loading Tickets</h3>
          <p className="text-gray-600">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Filters */}
      <QuickFilters
        onFilterSelect={handleQuickFilter}
        activeFilter={activeQuickFilter}
        currentUser={currentUser}
      />

      {/* Saved Filters */}
      <SavedFilters
        onLoadFilter={handleLoadSavedFilter}
        currentFilters={getCurrentFilters()}
      />

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Tickets</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredTickets.length} of {tickets.length} tickets
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
            >
              <Sliders className="w-5 h-5" />
              Advanced Search
            </button>
            <div className="relative group">
              <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition-colors">
                <Download className="w-5 h-5" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg text-sm"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg text-sm"
                >
                  Export as Excel
                </button>
              </div>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Standard Filters */}
        {!advancedFilters && (
          <div className="space-y-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ticket number, subject, or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>

              <select
                value={filterAssignedTo}
                onChange={(e) => setFilterAssignedTo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="unassigned">Unassigned</option>
                {users.filter(u => u.role !== 'user').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>

              <button
                onClick={clearAllFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Active Advanced Filters Badge */}
        {advancedFilters && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Advanced filters active</span>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Advanced Filters
            </button>
          </div>
        )}

        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onAssign={() => setAssigningTicket(ticket)}
                onViewDetails={() => setViewingTicket(ticket)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tickets Found</h3>
            <p className="text-gray-500 mb-6">
              {tickets.length === 0 
                ? 'No tickets have been created yet'
                : 'Try adjusting your search or filters'}
            </p>
            {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || advancedFilters) && (
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-[#911414] text-white rounded-lg hover:bg-[#ac0807] font-medium transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {assigningTicket && (
        <TicketAssignModal
          ticket={assigningTicket}
          onClose={() => setAssigningTicket(null)}
          onAssign={async (userId) => {
            try {
              const result = await ticketService.assign(assigningTicket.id, userId);
              if (result.success && onRefresh) {
                onRefresh();
              }
              return result;
            } catch (error) {
              return { success: false, message: 'Failed to assign ticket' };
            }
          }}
        />
      )}

      {viewingTicket && (
        <TicketDetailModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
          onUpdate={onRefresh}
        />
      )}

      {showAdvancedSearch && (
        <AdvancedSearchModal
          onClose={() => setShowAdvancedSearch(false)}
          onApply={handleAdvancedSearch}
          departments={departments}
          users={users}
        />
      )}
    </div>
  );
};
