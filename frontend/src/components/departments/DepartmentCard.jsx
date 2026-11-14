import React from 'react';
import { Building2, Users, Ticket, ArrowUpRight } from 'lucide-react';

export const DepartmentCard = ({ department, tickets = [], users = [], onViewDetails }) => {
  const deptUsers = users.filter(u =>
    u.departmentId === department.id ||
    u.department?.id === department.id ||
    u.department?.name === department.name ||
    u.department === department.name
  );

  const deptTickets = tickets.filter(t => 
    t.department?.name === department.name || 
    t.departmentId === department.id ||
    deptUsers.some(u => u.id === t.assignedToId)
  );

  const ticketCount = department._count?.tickets || deptTickets.length;
  const userCount = department._count?.users || deptUsers.length;

  const openTickets = deptTickets.filter(t => t.status === 'Open').length;
  const inProgressTickets = deptTickets.filter(t => t.status === 'In Progress').length;
  const resolvedTickets = deptTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const criticalTickets = deptTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;

  const resolutionRate = deptTickets.length > 0 
    ? Math.round((resolvedTickets / deptTickets.length) * 100) 
    : 0;

  return (
    <div 
      onClick={() => onViewDetails(department)}
      className="bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-zinc-300 p-5 transition-all cursor-pointer group flex flex-col justify-between font-sans"
    >
      <div>
        {/* Header: Icon, Name & Code (Zero Edit/Delete Buttons) */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 text-[#990024] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#990024] transition-colors truncate">
                {department.name}
              </h3>
              {department.code && (
                <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase rounded bg-red-50 text-[#990024] border border-red-100">
                  {department.code}
                </span>
              )}
            </div>
          </div>

          <span className="font-mono text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded shrink-0">
            AD_SYNCED
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs mb-4 font-mono">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <div>
              <span className="font-bold text-zinc-900 tabular-nums">{userCount}</span>
              <span className="text-zinc-500 text-[11px] ml-1">Staff</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <div>
              <span className="font-bold text-zinc-900 tabular-nums">{ticketCount}</span>
              <span className="text-zinc-500 text-[11px] ml-1">Tickets</span>
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="space-y-1.5 mb-4 font-mono">
          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-500">Resolution Rate</span>
            <span className="font-bold text-zinc-800 tabular-nums">{resolutionRate}%</span>
          </div>
          <div className="w-full h-1 rounded-full bg-zinc-100 overflow-hidden">
            <div 
              className="h-full rounded-full bg-[#990024] transition-all"
              style={{ width: `${resolutionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer Status Pills */}
      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            {openTickets} Open
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
            {inProgressTickets} Active
          </span>
          {criticalTickets > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold animate-pulse">
              {criticalTickets} Critical
            </span>
          )}
        </div>

        <span className="text-zinc-400 group-hover:text-[#990024] font-medium flex items-center gap-0.5 transition-colors">
          <span>Details</span>
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
