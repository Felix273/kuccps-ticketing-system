import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Sliders, 
  Table as TableIcon, 
  LayoutGrid, 
  ChevronRight, 
  ChevronLeft,
  X,
  User,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TicketCard } from './TicketCard';
import { TicketDetailModal } from './TicketDetailModal';
import { AdvancedSearchModal } from './AdvancedSearchModal';
import { ticketService } from '../../services/ticketService';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { authService } from '../../services/authService';
import { PRIORITY_LEVELS, TICKET_STATUS, normalizePriority } from '../../utils/constants';

export const TicketsView = ({ tickets = [], isLoading, error, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState('all');
  const [activeSegment, setActiveSegment] = useState('all'); // 'all', 'unassigned', 'my-tickets', 'critical', 'in-progress', 'resolved'
  const [viewingTicket, setViewingTicket] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const { departments = [] } = useDepartments(true);
  const { users = [] } = useUsers();
  const currentUser = authService.getCurrentUser();

  // Reset page when criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPriority, filterDepartment, filterAssignedTo, activeSegment, advancedFilters]);

  // Segment Tab Counts
  const segmentCounts = useMemo(() => {
    return {
      all: tickets.length,
      unassigned: tickets.filter(t => !t.assignedToId).length,
      myTickets: tickets.filter(t => currentUser?.id && t.assignedToId === currentUser.id).length,
      critical: tickets.filter(t => normalizePriority(t.priority) === 'Very High' && t.status !== 'Resolved' && t.status !== 'Closed').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      onHold: tickets.filter(t => t.status === 'On Hold').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      closed: tickets.filter(t => t.status === 'Closed').length
    };
  }, [tickets, currentUser?.id]);

  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Segment Filter
    if (activeSegment === 'unassigned') {
      result = result.filter(t => !t.assignedToId);
    } else if (activeSegment === 'my-tickets') {
      if (currentUser?.id) result = result.filter(t => t.assignedToId === currentUser.id);
    } else if (activeSegment === 'critical') {
      result = result.filter(t => normalizePriority(t.priority) === 'Very High' && t.status !== 'Resolved' && t.status !== 'Closed');
    } else if (activeSegment === 'in-progress') {
      result = result.filter(t => t.status === 'In Progress');
    } else if (activeSegment === 'on-hold') {
      result = result.filter(t => t.status === 'On Hold');
    } else if (activeSegment === 'resolved') {
      result = result.filter(t => t.status === 'Resolved');
    } else if (activeSegment === 'closed') {
      result = result.filter(t => t.status === 'Closed');
    }

    if (advancedFilters) {
      if (advancedFilters.ticketNumber) {
        result = result.filter(t => t.ticketNumber?.toLowerCase().includes(advancedFilters.ticketNumber.toLowerCase()));
      }
      if (advancedFilters.subject) {
        result = result.filter(t => t.subject?.toLowerCase().includes(advancedFilters.subject.toLowerCase()));
      }
      if (advancedFilters.requesterEmail) {
        result = result.filter(t => t.requesterEmail?.toLowerCase().includes(advancedFilters.requesterEmail.toLowerCase()));
      }
      if (advancedFilters.status?.length > 0) {
        result = result.filter(t => advancedFilters.status.includes(t.status));
      }
      if (advancedFilters.priority?.length > 0) {
        result = result.filter(t => advancedFilters.priority.includes(normalizePriority(t.priority)));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.ticketNumber?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.requesterEmail?.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') result = result.filter(t => t.status === filterStatus);
    if (filterPriority !== 'all') result = result.filter(t => normalizePriority(t.priority) === filterPriority);
    if (filterDepartment !== 'all') result = result.filter(t => t.department?.name === filterDepartment);
    if (filterAssignedTo !== 'all') {
      if (filterAssignedTo === 'unassigned') result = result.filter(t => !t.assignedToId);
      else result = result.filter(t => t.assignedToId === filterAssignedTo);
    }

    return result;
  }, [tickets, activeSegment, advancedFilters, searchQuery, filterStatus, filterPriority, filterDepartment, filterAssignedTo, currentUser?.id]);

  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const handleClaimTicket = async (ticket, e) => {
    if (e) e.stopPropagation();
    if (!currentUser?.id) return;
    if (!confirm(`Claim ticket ${ticket.ticketNumber}?`)) return;
    try {
      const result = await ticketService.assign(ticket.id, currentUser.id);
      if (result.success && onRefresh) await onRefresh();
    } catch (err) {
      console.error('Claim error:', err);
    }
  };

  const handleExport = (format) => {
    if (filteredTickets.length === 0) return;
    const filename = `tickets_${new Date().toISOString().split('T')[0]}`;
    if (format === 'csv') exportToCSV(filteredTickets, `${filename}.csv`);
    else exportToExcel(filteredTickets, `${filename}.xlsx`);
  };

  // Linear / getdesign.md Precision Status Indicator
  const renderStatus = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-blue-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-amber-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'On Hold':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-orange-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            On Hold
          </span>
        );
      case 'Resolved':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            Closed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Linear / getdesign.md Precision Priority Indicator
  const renderPriority = (priority) => {
    const displayPriority = normalizePriority(priority);
    switch (displayPriority) {
      case 'Critical':
      case 'Very High':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-rose-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            {displayPriority}
          </span>
        );
      case 'High':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-amber-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            Medium
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
            {displayPriority || 'Low'}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <RefreshCw className="w-4 h-4 animate-spin text-[#990024]" />
          <span>QUERYING_TICKET_STREAM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* UNIFIED WORKBENCH CONTAINER */}
      <div className="border border-zinc-200 bg-white">
        
        {/* 1. LINEAR-STYLE SEGMENTED STATUS BAR */}
        <div className="border-b border-zinc-200 overflow-x-auto scrollbar-none flex items-center bg-zinc-50/50">
          {[
            { id: 'all', label: 'All Tickets', count: segmentCounts.all },
            { id: 'unassigned', label: 'Unclaimed', count: segmentCounts.unassigned },
            { id: 'my-tickets', label: 'My Tickets', count: segmentCounts.myTickets },
            { id: 'in-progress', label: 'In Progress', count: segmentCounts.inProgress },
            { id: 'on-hold', label: 'On Hold', count: segmentCounts.onHold },
            { id: 'critical', label: 'Very High', count: segmentCounts.critical, alert: segmentCounts.critical > 0 },
            { id: 'resolved', label: 'Resolved', count: segmentCounts.resolved },
            { id: 'closed', label: 'Closed', count: segmentCounts.closed }
          ].map(tab => {
            const isActive = activeSegment === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSegment(tab.id);
                  setAdvancedFilters(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono whitespace-nowrap transition-colors border-r border-zinc-200 first:border-l-0 ${
                  isActive 
                    ? 'bg-white text-zinc-900 font-bold border-b-2 border-b-[#990024] -mb-[1px]' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/70'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] tabular-nums ${
                  tab.alert 
                    ? 'bg-rose-100 text-rose-700 font-bold' 
                    : isActive ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. PRECISION TOOLBAR (Search + Hairline Dropdowns + Actions) */}
        <div className="p-3 border-b border-zinc-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search & Inline Filters */}
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by subject, requester, or ID... (Press / to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs font-sans bg-zinc-50/70 border border-zinc-200 rounded text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#990024] focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Hairline Selects */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-600 focus:outline-none focus:border-[#990024]"
            >
              <option value="all">Status: All</option>
              {TICKET_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2 py-1 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-600 focus:outline-none focus:border-[#990024]"
            >
              <option value="all">Priority: All</option>
              {PRIORITY_LEVELS.map(priority => <option key={priority} value={priority}>{priority}</option>)}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2 py-1 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-600 focus:outline-none focus:border-[#990024] max-w-[140px] truncate"
            >
              <option value="all">Dept: All</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterDepartment !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setFilterDepartment('all');
                }}
                className="font-mono text-[11px] text-zinc-400 hover:text-zinc-800"
              >
                Reset
              </button>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Switcher */}
            <div className="flex items-center border border-zinc-200 rounded p-0.5 bg-zinc-50">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-400'}`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-400'}`}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="px-2.5 py-1 text-xs font-mono border border-zinc-200 rounded hover:bg-zinc-50 text-zinc-600 flex items-center gap-1"
            >
              <Sliders className="w-3 h-3 text-zinc-400" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => handleExport('csv')}
              className="px-2.5 py-1 text-xs font-mono border border-zinc-200 rounded hover:bg-zinc-50 text-zinc-600 flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-zinc-400" />
              <span>Export</span>
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 border border-zinc-200 rounded hover:bg-zinc-50 text-zinc-500"
                title="Refresh stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* 3. HIGH-PRECISION HAIRLINE DATA TABLE */}
        {totalItems > 0 ? (
          viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-500">
                    <th className="py-2.5 px-4 font-semibold w-36">Identifier</th>
                    <th className="py-2.5 px-4 font-semibold">Subject & Requester</th>
                    <th className="py-2.5 px-4 font-semibold w-28">Priority</th>
                    <th className="py-2.5 px-4 font-semibold w-32">Status</th>
                    <th className="py-2.5 px-4 font-semibold w-40">Assignee</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-24">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedTickets.map((ticket) => {
                    const isUnclaimed = !ticket.assignedTo;
                    const initials = ticket.assignedTo?.name
                      ? ticket.assignedTo.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : null;

                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setViewingTicket(ticket)}
                        className="hover:bg-zinc-50/90 transition-colors cursor-pointer group"
                      >
                        {/* Muted Monospace Ticket ID */}
                        <td className="py-3 px-4 font-mono text-xs text-zinc-500 group-hover:text-zinc-900 group-hover:font-semibold transition-colors whitespace-nowrap">
                          #{ticket.ticketNumber}
                        </td>

                        {/* Subject & Requester */}
                        <td className="py-3 px-4">
                          <p className="font-semibold text-zinc-900 group-hover:text-[#990024] transition-colors leading-snug">
                            {ticket.subject}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-zinc-400">
                            <span>{ticket.requesterEmail}</span>
                            {ticket.department?.name && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-500">{ticket.department.name}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Minimal Priority Dot */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderPriority(ticket.priority)}
                        </td>

                        {/* Minimal Status Dot */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderStatus(ticket.status)}
                        </td>

                        {/* Refined Assignee Cell */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isUnclaimed ? (
                            <button
                              onClick={(e) => handleClaimTicket(ticket, e)}
                              className="px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-600 hover:text-[#990024] hover:border-[#990024] bg-white border border-zinc-200 rounded transition-colors"
                            >
                              + Claim
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-700 text-[9px] font-mono font-bold flex items-center justify-center border border-zinc-200 shrink-0">
                                {initials}
                              </span>
                              <span className="text-xs text-zinc-700 font-medium truncate max-w-[120px]">
                                {ticket.assignedTo.name}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Date / Timestamp */}
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-zinc-400 whitespace-nowrap tabular-nums">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTickets.map(t => (
                <TicketCard 
                  key={t.id} 
                  ticket={t} 
                  currentUser={currentUser} 
                  onClaim={() => handleClaimTicket(t)} 
                  onViewDetails={() => setViewingTicket(t)} 
                />
              ))}
            </div>
          )
        ) : (
          <div className="py-16 text-center font-mono text-xs text-zinc-400">
            NO_MATCHING_TICKETS_IN_STREAM
          </div>
        )}

        {/* 4. HAIRLINE PAGINATION FOOTER */}
        {totalItems > 0 && (
          <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3 text-zinc-500">
              <span>
                Showing <b>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</b> of <b>{totalItems}</b>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">Page size:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-zinc-800 font-bold border-none focus:ring-0 cursor-pointer text-xs"
                >
                  {[15, 30, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1 border border-zinc-200 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-zinc-700 font-bold">
                {currentPage} / {totalPages || 1}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1 border border-zinc-200 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {viewingTicket && (
        <TicketDetailModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
          onUpdate={onRefresh}
          currentUser={currentUser}
          users={users}
        />
      )}

      {showAdvancedSearch && (
        <AdvancedSearchModal
          onClose={() => setShowAdvancedSearch(false)}
          onApply={(filters) => {
            setAdvancedFilters(filters);
            setActiveSegment('all');
          }}
          departments={departments}
          users={users}
        />
      )}

    </div>
  );
};
