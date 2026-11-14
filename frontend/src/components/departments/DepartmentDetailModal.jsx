import React, { useState, useMemo } from 'react';
import { 
  X, 
  Users, 
  Building2, 
  AlertTriangle, 
  Clock, 
  Mail, 
  ChevronRight, 
  ArrowUpRight,
  CheckCircle2,
  Ticket
} from 'lucide-react';

export const DepartmentDetailModal = ({ department, tickets = [], users = [], onClose, onViewUserTickets }) => {
  const [sortBy, setSortBy] = useState('tickets');

  const deptUsers = useMemo(() => {
    return users.filter(u =>
      u.departmentId === department.id ||
      u.department?.id === department.id ||
      u.department?.name === department.name ||
      u.department === department.name
    );
  }, [users, department]);

  const deptTickets = useMemo(() => {
    return tickets.filter(t => 
      t.department?.name === department.name || 
      t.departmentId === department.id ||
      deptUsers.some(u => u.id === t.assignedToId)
    );
  }, [tickets, department, deptUsers]);

  const userStats = useMemo(() => {
    return deptUsers.map(user => {
      const userTickets = deptTickets.filter(t => t.assignedToId === user.id);
      const open = userTickets.filter(t => t.status === 'Open').length;
      const inProgress = userTickets.filter(t => t.status === 'In Progress').length;
      const onHold = userTickets.filter(t => t.status === 'On Hold').length;
      const resolved = userTickets.filter(t => t.status === 'Resolved').length;
      const closed = userTickets.filter(t => t.status === 'Closed').length;
      const critical = userTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
      
      return {
        ...user,
        ticketCount: userTickets.length,
        open,
        inProgress,
        onHold,
        resolved,
        closed,
        critical,
        workload: open + inProgress + onHold
      };
    }).sort((a, b) => {
      if (sortBy === 'tickets') return b.ticketCount - a.ticketCount;
      if (sortBy === 'workload') return b.workload - a.workload;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [deptUsers, deptTickets, sortBy]);

  const deptStats = {
    totalTickets: deptTickets.length,
    open: deptTickets.filter(t => t.status === 'Open').length,
    inProgress: deptTickets.filter(t => t.status === 'In Progress').length,
    onHold: deptTickets.filter(t => t.status === 'On Hold').length,
    resolved: deptTickets.filter(t => t.status === 'Resolved').length,
    closed: deptTickets.filter(t => t.status === 'Closed').length,
    critical: deptTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length,
    unclaimed: deptTickets.filter(t => !t.assignedToId).length
  };

  const resolutionRate = deptStats.totalTickets > 0 
    ? Math.round(((deptStats.resolved + deptStats.closed) / deptStats.totalTickets) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* 1. HEADER (No Solid Red Banner) */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 bg-white">
          <div className="flex items-start justify-between gap-4">
            
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-zinc-400">
                  Departments / <strong className="text-zinc-900 font-bold">{department.code || 'DIRECTORATE'}</strong>
                </span>
                {department.code && (
                  <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-red-50 text-[#990024] border border-red-100">
                    {department.code}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5 truncate mt-1">
                <Building2 className="w-5 h-5 text-[#990024] shrink-0" />
                <span className="truncate">{department.name}</span>
              </h2>

              <p className="font-mono text-xs text-zinc-500 tabular-nums">
                {deptUsers.length} Staff Assigned • {deptStats.totalTickets} Active Logged Tickets
              </p>
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

        {/* 2. MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Hairline Connected KPI Strip (NO Pastel Cartoon Boxes) */}
          <div className="border border-zinc-200 bg-white grid grid-cols-2 sm:grid-cols-3 divide-x divide-y sm:divide-y-0 divide-zinc-200 font-mono">
            <div className="p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                Open Queue
              </span>
              <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                {deptStats.open}
              </div>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                In Progress
              </span>
              <div className="text-2xl font-bold text-amber-700 tabular-nums">
                {deptStats.inProgress}
              </div>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                On Hold
              </span>
              <div className="text-2xl font-bold text-orange-700 tabular-nums">
                {deptStats.onHold}
              </div>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                Resolved
              </span>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                {deptStats.resolved}
              </div>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                Closed
              </span>
              <div className="text-2xl font-bold text-zinc-600 tabular-nums">
                {deptStats.closed}
              </div>
            </div>

            <div className="p-3.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                Throughput
              </span>
              <div className="text-2xl font-bold text-zinc-900 tabular-nums">
                {resolutionRate}%
              </div>
              <div className="w-full h-1 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#990024]" style={{ width: `${resolutionRate}%` }} />
              </div>
            </div>
          </div>

          {/* Hairline Warning Notices */}
          {(deptStats.critical > 0 || deptStats.unclaimed > 0) && (
            <div className="space-y-2">
              {deptStats.critical > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-rose-200 bg-rose-50/60 text-xs font-mono text-rose-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    <span className="font-semibold">{deptStats.critical} critical ticket(s) require immediate officer escalation</span>
                  </div>
                  <span className="font-bold underline cursor-pointer">View</span>
                </div>
              )}

              {deptStats.unclaimed > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-xs font-mono text-amber-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{deptStats.unclaimed} unassigned ticket(s) awaiting claim in this directorate</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. DEPARTMENT STAFF LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-500" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Assigned Department Staff
                </h3>
                <span className="font-mono text-xs text-zinc-400">({userStats.length})</span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-mono bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-zinc-700 focus:outline-none"
              >
                <option value="tickets">Sort: Most Tickets</option>
                <option value="workload">Sort: Active Workload</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
            </div>

            {userStats.length > 0 ? (
              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden bg-white">
                {userStats.map(user => {
                  const initials = user.name
                    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <div 
                      key={user.id}
                      onClick={() => onViewUserTickets(user)}
                      className="p-3.5 flex items-center justify-between hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-[#990024] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 group-hover:text-[#990024] transition-colors truncate">
                            {user.name}
                          </h4>
                          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
                            <span className="truncate">{user.email}</span>
                            <span>•</span>
                            <span className="uppercase text-zinc-600">{user.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-bold tabular-nums text-[11px]">
                            {user.ticketCount} tickets
                          </span>
                          {user.workload > 0 && (
                            <span className="text-[10px] text-amber-700 font-semibold">
                              ({user.workload} active)
                            </span>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-lg p-10 text-center font-mono">
                <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-zinc-800">NO_ASSIGNED_PERSONNEL</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  No staff members are currently attached to this directorate.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* 4. FOOTER */}
        <div className="border-t border-zinc-200 bg-zinc-50/80 p-3.5 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-mono font-semibold rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
