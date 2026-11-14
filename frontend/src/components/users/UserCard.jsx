import React from 'react';
import { Mail, Building2, Ticket, Globe } from 'lucide-react';

export const UserCard = ({ user }) => {
  const getRoleBadge = (role) => {
    const config = {
      admin: 'bg-red-50 text-[#990024] border-red-200 font-bold',
      staff: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
      user: 'bg-zinc-50 text-zinc-600 border-zinc-200 font-medium'
    };
    return config[role] || config.user;
  };

  const departmentName = user.department?.name || (typeof user.department === 'string' ? user.department : null);
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs hover:border-zinc-300 p-5 transition-all flex flex-col justify-between font-sans">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 text-[#990024] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 truncate">
                {user.name || 'Unnamed User'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">@{user.username || 'user'}</p>
            </div>
          </div>

          <span className="font-mono text-[9px] uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
            <Globe className="w-2.5 h-2.5" /> AD_SYNCED
          </span>
        </div>

        <div className="space-y-2 text-xs text-zinc-600 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-zinc-500">{user.email || 'No email registered'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            {departmentName ? (
              <span className="font-semibold text-zinc-700 truncate">{departmentName}</span>
            ) : (
              <span className="text-zinc-400 italic text-[11px]">Unassigned Directorate</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getRoleBadge(user.role)}`}>
          {user.role || 'user'}
        </span>

        {user._count?.assignedTickets > 0 && (
          <span className="text-zinc-500 text-[10px] font-medium flex items-center gap-1">
            <Ticket className="w-3 h-3 text-zinc-400" />
            {user._count.assignedTickets} claimed
          </span>
        )}
      </div>
    </div>
  );
};
