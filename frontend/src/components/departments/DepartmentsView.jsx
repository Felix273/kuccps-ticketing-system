import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  RefreshCw, 
  Search, 
  Users, 
  Ticket, 
  X,
  Globe
} from 'lucide-react';
import { DepartmentCard } from './DepartmentCard';
import { DepartmentDetailModal } from './DepartmentDetailModal';
import { UserTicketsDrawer } from './UserTicketsDrawer';
import { TicketAssignModal } from '../tickets/TicketAssignModal';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { useTickets } from '../../hooks/useTickets';
import { ticketService } from '../../services/ticketService';
import { authService } from '../../services/authService';

export const DepartmentsView = ({ departments: propDepartments, isLoading: propLoading }) => {
  const [viewingDepartment, setViewingDepartment] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [reassigningTicket, setReassigningTicket] = useState(null);
  const [syncingAd, setSyncingAd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const hookData = useDepartments(!propDepartments);
  const departments = propDepartments || hookData.departments || [];
  const isLoading = propLoading !== undefined ? propLoading : hookData.isLoading;
  const { fetchDepartments } = hookData;
  const syncDepartmentsFromAd = hookData.syncFromAd;

  const { users = [] } = useUsers();
  const { tickets = [], fetchTickets } = useTickets(true);
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(d => 
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q)
    );
  }, [departments, searchQuery]);

  const stats = useMemo(() => {
    const totalDepts = departments.length;
    const staffAssigned = users.filter(u => u.departmentId || u.department).length;
    const activeTickets = tickets.filter(t => ['Open', 'In Progress', 'On Hold'].includes(t.status)).length;
    return { totalDepts, staffAssigned, activeTickets };
  }, [departments, users, tickets]);

  const handleRefresh = () => {
    if (fetchDepartments) fetchDepartments();
    if (fetchTickets) fetchTickets();
  };

  const handleSyncAd = async () => {
    if (!isAdmin || !syncDepartmentsFromAd) return;
    setSyncingAd(true);
    const result = await syncDepartmentsFromAd();
    setSyncingAd(false);
    if (result.success) {
      alert(`Synced ${result.count} directorate(s) from Active Directory`);
    } else {
      alert(result.message || 'Failed to sync directorates from Active Directory');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <RefreshCw className="w-4 h-4 animate-spin text-[#990024]" />
          <span>LOADING_DIRECTORATES...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* KPI Strip */}
      <div className="border border-zinc-200 bg-white grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold">Total Directorates</p>
            <p className="font-mono text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">{stats.totalDepts}</p>
          </div>
          <Building2 className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold">Assigned Personnel</p>
            <p className="font-mono text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">{stats.staffAssigned}</p>
          </div>
          <Users className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold">Active Inflow</p>
            <p className="font-mono text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">{stats.activeTickets}</p>
          </div>
          <Ticket className="w-4 h-4 text-zinc-400" />
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="border border-zinc-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Directorates & Staff Directory
              </h2>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                <Globe className="w-3 h-3" /> AD Authoritative
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Organizational units pulled directly from Active Directory. Manual creation/editing disabled.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleRefresh}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded hover:bg-zinc-50 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* AD SYNC IS THE ONLY ACTION */}
            {isAdmin && syncDepartmentsFromAd && (
              <button
                onClick={handleSyncAd}
                disabled={syncingAd}
                className="px-3 py-1.5 text-xs font-mono font-semibold text-zinc-700 bg-white border border-zinc-200 rounded hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncingAd ? 'animate-spin text-[#990024]' : ''}`} />
                <span>{syncingAd ? 'Syncing...' : 'Sync AD Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter directorates by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1 text-xs font-sans bg-zinc-50 border border-zinc-200 rounded text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#990024] focus:bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="font-mono text-xs text-zinc-400 shrink-0">
            {filteredDepartments.length} of {departments.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map(dept => (
          <DepartmentCard
            key={dept.id}
            department={dept}
            tickets={tickets}
            users={users}
            onViewDetails={() => setViewingDepartment(dept)}
          />
        ))}
      </div>

      {/* Modals: View & Reassign Only */}
      {viewingDepartment && (
        <DepartmentDetailModal
          department={viewingDepartment}
          tickets={tickets}
          users={users}
          currentUser={currentUser}
          onClose={() => setViewingDepartment(null)}
          onViewUserTickets={(u) => setViewingUser(u)}
        />
      )}

      {viewingUser && (
        <UserTicketsDrawer
          user={viewingUser}
          tickets={tickets}
          currentUser={currentUser}
          onClose={() => setViewingUser(null)}
          onReassign={(t) => setReassigningTicket(t)}
        />
      )}

      {reassigningTicket && (
        <TicketAssignModal
          ticket={reassigningTicket}
          onClose={() => setReassigningTicket(null)}
          onAssign={async (userId) => {
            const res = await ticketService.assign(reassigningTicket.id, userId);
            if (res.success) {
              await fetchTickets();
              setReassigningTicket(null);
            }
            return res;
          }}
        />
      )}
    </div>
  );
};
