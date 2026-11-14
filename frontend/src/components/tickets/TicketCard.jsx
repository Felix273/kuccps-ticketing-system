import React from 'react';
import { 
  Mail, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ArrowRightLeft,
  Hand
} from 'lucide-react';
import { normalizePriority } from '../../utils/constants';

export const TicketCard = ({ ticket, onClaim, onViewDetails, currentUser }) => {
  const isClaimedByMe = ticket.assignedToId === currentUser?.id;
  const isUnclaimed = !ticket.assignedToId;

  // Linear / getdesign.md Precision Status Dot
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

  // Linear Priority Dot
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

  const initials = ticket.assignedTo?.name
    ? ticket.assignedTo.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : null;

  return (
    <div 
      onClick={onViewDetails}
      className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3 font-sans cursor-pointer group"
    >
      <div>
        {/* 1. Header: Identifier + Linear Dots */}
        <div className="flex items-center justify-between gap-2 mb-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-900 transition-colors">
              #{ticket.ticketNumber}
            </span>
            {ticket.emailMessageId && (
              <span title="Created via inbound email">
                <Mail className="w-3 h-3 text-zinc-400" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {ticket.isOverdue && (
              <span className="text-[9px] uppercase font-bold text-rose-700 bg-rose-50 px-1 py-0.2 border border-rose-200">
                Overdue
              </span>
            )}
            {renderPriority(ticket.priority)}
            {renderStatus(ticket.status)}
          </div>
        </div>

        {/* 2. Subject & Description */}
        <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#990024] transition-colors leading-snug line-clamp-1">
          {ticket.subject}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
          {ticket.description || 'No additional details provided.'}
        </p>

        {/* 3. Clean Metadata Row (No Clipping) */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 text-[11px] font-mono text-zinc-400">
          <span className="truncate max-w-[170px]">{ticket.requesterEmail}</span>
          <span className="tabular-nums">
            {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* 4. Footer: Assignee & Action Buttons */}
      <div 
        className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Assignee Info */}
        <div className="min-w-0 flex items-center gap-1.5 font-mono text-[11px]">
          {ticket.assignedTo ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-700 font-bold text-[8px] flex items-center justify-center border border-zinc-200 shrink-0">
                {initials}
              </span>
              <span className="text-zinc-700 font-medium truncate max-w-[110px]">
                {ticket.assignedTo.name}
              </span>
            </div>
          ) : (
            <span className="text-zinc-400 italic text-[11px]">Unassigned</span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono">
          {onClaim && !isClaimedByMe && (
            <button
              onClick={onClaim}
              className="px-2 py-0.5 text-[10px] font-semibold border border-zinc-200 rounded text-zinc-700 hover:text-[#990024] hover:border-[#990024] bg-white transition-colors cursor-pointer"
            >
              {isUnclaimed ? '+ Claim' : 'Transfer'}
            </button>
          )}

          {isClaimedByMe && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Claimed
            </span>
          )}

          <button
            onClick={onViewDetails}
            className="p-1 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
            title="View Details"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
