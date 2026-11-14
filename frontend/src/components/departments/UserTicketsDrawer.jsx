import React, { useState, useMemo } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Search, 
  ArrowRightLeft,
  FileText 
} from 'lucide-react';
import { PRIORITY_LEVELS, normalizePriority } from '../../utils/constants';

export const UserTicketsDrawer = ({ user, tickets = [], onClose, onReassign }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get user's tickets
  const userTickets = useMemo(() => {
    return tickets.filter(t => t.assignedToId === user.id);
  }, [tickets, user]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return userTickets.filter(ticket => {
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || normalizePriority(ticket.priority) === filterPriority;
      const matchesSearch = 
        !searchQuery.trim() ||
        ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [userTickets, filterStatus, filterPriority, searchQuery]);

  // Statistics
  const stats = {
    total: userTickets.length,
    open: userTickets.filter(t => t.status === 'Open').length,
    inProgress: userTickets.filter(t => t.status === 'In Progress').length,
    onHold: userTickets.filter(t => t.status === 'On Hold').length,
    resolved: userTickets.filter(t => t.status === 'Resolved').length,
    closed: userTickets.filter(t => t.status === 'Closed').length
  };

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
            {status || 'Normal'}
          </span>
        );
    }
  };

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
      default:
        return (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            {displayPriority || 'Medium'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-end justify-end z-50 font-sans">
      <div className="bg-white h-full w-full max-w-xl border-l border-zinc-200 shadow-2xl flex flex-col animate-slide-in">
        
        {/* 1. HEADER (No Solid Red Banner) */}
        <div className="p-5 border-b border-zinc-200 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="font-mono text-xs text-zinc-400">
                Personnel Queue / <strong className="text-zinc-900 font-bold">@{user.username || 'staff'}</strong>
              </span>

              <h2 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2 mt-1 truncate">
                <User className="w-4 h-4 text-[#990024] shrink-0" />
                <span>{user.name}'s Assigned Queue</span>
              </h2>

              <p className="font-mono text-xs text-zinc-400 truncate">
                {user.email}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. HAIRLINE KPI STRIP */}
        <div className="border-b border-zinc-200 bg-zinc-50/60 grid grid-cols-3 sm:grid-cols-6 divide-x divide-zinc-200 font-mono text-center">
          <div className="p-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-0.5">Total</span>
            <div className="text-xl font-bold text-zinc-900 tabular-nums">{stats.total}</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-0.5">Open</span>
            <div className="text-xl font-bold text-zinc-900 tabular-nums">{stats.open}</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-0.5">In Progress</span>
            <div className="text-xl font-bold text-amber-700 tabular-nums">{stats.inProgress}</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-0.5">On Hold</span>
            <div className="text-xl font-bold text-orange-700 tabular-nums">{stats.onHold}</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-0.5">Resolved</span>
            <div className="text-xl font-bold text-emerald-700 tabular-nums">{stats.resolved}</div>
          </div>
          <div className="p-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-0.5">Closed</span>
            <div className="text-xl font-bold text-zinc-600 tabular-nums">{stats.closed}</div>
          </div>
        </div>

        {/* 3. PRECISION TOOLBAR */}
        <div className="p-3.5 border-b border-zinc-200 bg-white space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter assigned tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs font-sans bg-zinc-50 border border-zinc-200 rounded text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#990024] focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 font-mono text-xs">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-zinc-600 focus:outline-none focus:border-[#990024] text-xs"
              >
                <option value="all">Status: All</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-zinc-600 focus:outline-none focus:border-[#990024] text-xs"
              >
                <option value="all">Priority: All</option>
                {PRIORITY_LEVELS.map(priority => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>

            <span className="font-mono text-[11px] text-zinc-400">
              {filteredTickets.length} of {userTickets.length}
            </span>
          </div>
        </div>

        {/* 4. TICKET CARDS LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTickets.length > 0 ? (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-all space-y-2.5"
              >
                {/* Identifier & Micro-dots */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-500">
                    #{ticket.ticketNumber}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    {renderPriority(ticket.priority)}
                    {renderStatus(ticket.status)}
                  </div>
                </div>

                {/* Subject & Description */}
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 leading-snug">
                    {ticket.subject}
                  </h4>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                    {ticket.description || 'No additional details provided.'}
                  </p>
                </div>

                {/* Card Footer: Date & Transfer Action */}
                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] tabular-nums">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {onReassign && (
                    <button
                      onClick={() => onReassign(ticket)}
                      className="px-2.5 py-1 text-xs font-mono font-semibold border border-zinc-200 rounded text-zinc-700 hover:text-[#990024] hover:border-[#990024] bg-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Transfer Claim</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="border border-zinc-200 rounded-lg p-10 text-center font-mono my-4">
              <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-zinc-800">NO_ASSIGNED_TICKETS</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {userTickets.length === 0 ? 'No tickets are currently assigned to this user.' : 'No tickets match the selected filters.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
