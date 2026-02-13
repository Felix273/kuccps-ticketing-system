import React, { useState, useMemo } from 'react';
import { X, User, Mail, FileText, Calendar, AlertCircle, Clock, CheckCircle, Filter, Search } from 'lucide-react';

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
      const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
      const matchesSearch = 
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
    resolved: userTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
    critical: userTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length
  };

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
      case 'Open': return <AlertCircle className="w-4 h-4" />;
      case 'In Progress': return <Clock className="w-4 h-4" />;
      case 'Resolved':
      case 'Closed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50">
      <div className="bg-white h-full w-full md:w-2/3 lg:w-1/2 shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6" />
                {user.name}'s Tickets
              </h2>
              <p className="text-white/80 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs">Total</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-xs">Open</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-xs">Active</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-xs">Done</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <p className="text-xs text-gray-600">
              Showing {filteredTickets.length} of {userTickets.length} tickets
            </p>
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTickets.length > 0 ? (
            <div className="space-y-3">
              {filteredTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-[#911414] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
                        <span className={`px-2 py-0.5 text-xs rounded border font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    {onReassign && (
                      <button
                        onClick={() => onReassign(ticket)}
                        className="px-3 py-1 bg-[#911414] text-white rounded hover:bg-[#ac0807] font-medium transition-colors"
                      >
                        Reassign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {userTickets.length === 0 ? 'No Tickets Assigned' : 'No Tickets Match Filters'}
              </h3>
              <p className="text-gray-500">
                {userTickets.length === 0 
                  ? 'This user has no tickets assigned yet.'
                  : 'Try adjusting your filters to see more tickets.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
