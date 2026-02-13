import React, { useState, useMemo } from 'react';
import { X, Users, FileText, TrendingUp, AlertCircle, User, Mail, ArrowRight, Building2 } from 'lucide-react';

export const DepartmentDetailModal = ({ department, tickets = [], users = [], onClose, onViewUserTickets }) => {
  const [sortBy, setSortBy] = useState('tickets');

  const deptUsers = useMemo(() => {
    return users.filter(u => u.department === department.name);
  }, [users, department]);

  const deptTickets = useMemo(() => {
    return tickets.filter(t => 
      t.department?.name === department.name || 
      deptUsers.some(u => u.id === t.assignedToId)
    );
  }, [tickets, department, deptUsers]);

  const userStats = useMemo(() => {
    return deptUsers.map(user => {
      const userTickets = deptTickets.filter(t => t.assignedToId === user.id);
      const open = userTickets.filter(t => t.status === 'Open').length;
      const inProgress = userTickets.filter(t => t.status === 'In Progress').length;
      const resolved = userTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
      const critical = userTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
      
      return {
        ...user,
        ticketCount: userTickets.length,
        open,
        inProgress,
        resolved,
        critical,
        workload: open + inProgress
      };
    }).sort((a, b) => {
      if (sortBy === 'tickets') return b.ticketCount - a.ticketCount;
      if (sortBy === 'workload') return b.workload - a.workload;
      return a.name.localeCompare(b.name);
    });
  }, [deptUsers, deptTickets, sortBy]);

  const deptStats = {
    totalTickets: deptTickets.length,
    open: deptTickets.filter(t => t.status === 'Open').length,
    inProgress: deptTickets.filter(t => t.status === 'In Progress').length,
    resolved: deptTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
    critical: deptTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length,
    unassigned: deptTickets.filter(t => !t.assignedToId).length
  };

  const resolutionRate = deptStats.totalTickets > 0 
    ? Math.round((deptStats.resolved / deptStats.totalTickets) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-5xl h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-4 sm:p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 mb-1">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                <span className="truncate">{department.name}</span>
              </h2>
              <p className="text-white/80 text-sm sm:text-base">
                {deptUsers.length} Staff • {deptStats.totalTickets} Tickets
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Department Statistics - Mobile Optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-200">
              <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Open</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-700">{deptStats.open}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200">
              <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1">In Progress</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-700">{deptStats.inProgress}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
              <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Resolved</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-700">{deptStats.resolved}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
              <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1 truncate">Resolution</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700">{resolutionRate}%</p>
            </div>
          </div>

          {/* Alerts */}
          {deptStats.critical > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-semibold text-red-800">
                  {deptStats.critical} Critical ticket{deptStats.critical > 1 ? 's' : ''} require immediate attention
                </p>
              </div>
            </div>
          )}

          {deptStats.unassigned > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 sm:p-4 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-semibold text-yellow-800">
                  {deptStats.unassigned} unassigned ticket{deptStats.unassigned > 1 ? 's' : ''} in this department
                </p>
              </div>
            </div>
          )}

          {/* Staff List */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#911414]" />
                Department Staff
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              >
                <option value="tickets">Sort by: Most Tickets</option>
                <option value="workload">Sort by: Workload</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>

            {userStats.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {userStats.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => onViewUserTickets(user)}
                    className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-[#911414] hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#911414] to-[#d20001] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs sm:text-sm font-bold">
                            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm sm:text-base text-gray-900 truncate">{user.name}</h4>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-600 mt-1">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded font-medium flex-shrink-0">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {/* Ticket counts - Simplified on mobile */}
                        <div className="hidden sm:flex gap-3 text-sm">
                          {user.open > 0 && (
                            <div className="text-center">
                              <p className="font-bold text-orange-600">{user.open}</p>
                              <p className="text-xs text-gray-500">Open</p>
                            </div>
                          )}
                          {user.inProgress > 0 && (
                            <div className="text-center">
                              <p className="font-bold text-purple-600">{user.inProgress}</p>
                              <p className="text-xs text-gray-500">Active</p>
                            </div>
                          )}
                          {user.resolved > 0 && (
                            <div className="text-center">
                              <p className="font-bold text-green-600">{user.resolved}</p>
                              <p className="text-xs text-gray-500">Done</p>
                            </div>
                          )}
                        </div>

                        {/* Total tickets badge */}
                        <div className="bg-[#911414] text-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 min-w-[60px] sm:min-w-[80px] text-center">
                          <p className="text-lg sm:text-2xl font-bold">{user.ticketCount}</p>
                          <p className="text-xs">Ticket{user.ticketCount !== 1 ? 's' : ''}</p>
                        </div>

                        {/* Critical indicator */}
                        {user.critical > 0 && (
                          <div className="bg-red-100 text-red-700 rounded-lg px-2 py-1 sm:px-3 sm:py-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-bold">{user.critical}</span>
                          </div>
                        )}

                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hidden sm:block" />
                      </div>
                    </div>

                    {/* Mobile: Show ticket breakdown */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-gray-200 flex justify-around text-xs">
                      {user.open > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-orange-600">{user.open}</p>
                          <p className="text-gray-500">Open</p>
                        </div>
                      )}
                      {user.inProgress > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-purple-600">{user.inProgress}</p>
                          <p className="text-gray-500">Active</p>
                        </div>
                      )}
                      {user.resolved > 0 && (
                        <div className="text-center">
                          <p className="font-bold text-green-600">{user.resolved}</p>
                          <p className="text-gray-500">Done</p>
                        </div>
                      )}
                    </div>

                    {/* Workload indicator */}
                    {user.workload > 0 && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Active Workload</span>
                          <span className={`font-semibold ${
                            user.workload > 15 ? 'text-red-600' :
                            user.workload > 10 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {user.workload} active
                            {user.workload > 15 && ' - Overloaded!'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No Staff Members</h3>
                <p className="text-sm text-gray-500">
                  No users are assigned to this department yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
