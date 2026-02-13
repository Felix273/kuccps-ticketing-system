import React from 'react';
import { Mail, Calendar, User, UserPlus, AlertCircle, Clock, CheckCircle, Eye } from 'lucide-react';

export const TicketCard = ({ ticket, onAssign, onViewDetails }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-green-100 text-green-700 border-green-200',
      Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      High: 'bg-orange-100 text-orange-700 border-orange-200',
      Critical: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[priority] || colors.Medium;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'Resolved':
      case 'Closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-100 text-blue-700',
      'In Progress': 'bg-purple-100 text-purple-700',
      Resolved: 'bg-green-100 text-green-700',
      Closed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.Open;
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#911414] hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {ticket.ticketNumber}
            </span>
            <span className={`px-2 py-1 text-xs rounded border font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
            <span className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              {ticket.status}
            </span>
            {ticket.emailMessageId && (
              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                From Email
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 break-words">{ticket.subject}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 break-words overflow-hidden">{ticket.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{ticket.requesterEmail}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {ticket.assignedTo ? (
            <span className="font-medium text-[#911414] truncate">{ticket.assignedTo.name}</span>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </div>

        {ticket.department && (
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
            <span className="font-medium truncate">{ticket.department.name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all flex items-center justify-center gap-2 border border-gray-300"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={onAssign}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {ticket.assignedTo ? 'Reassign' : 'Assign'}
        </button>
      </div>
    </div>
  );
};
