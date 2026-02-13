import React from 'react';
import { Building2, Edit, Trash2, FileText, Users, TrendingUp, AlertCircle } from 'lucide-react';

export const DepartmentCard = ({ department, tickets = [], users = [], onEdit, onDelete, onViewDetails }) => {
  const canDelete = !department._count?.tickets || department._count.tickets === 0;
  
  // Calculate department statistics
  const deptUsers = users.filter(u => u.department === department.name);
  const deptTickets = tickets.filter(t => 
    t.department?.name === department.name || 
    deptUsers.some(u => u.id === t.assignedToId)
  );
  
  const openTickets = deptTickets.filter(t => t.status === 'Open').length;
  const inProgressTickets = deptTickets.filter(t => t.status === 'In Progress').length;
  const resolvedTickets = deptTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const criticalTickets = deptTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
  
  const resolutionRate = deptTickets.length > 0 
    ? Math.round((resolvedTickets / deptTickets.length) * 100) 
    : 0;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-[#911414] hover:shadow-xl transition-all cursor-pointer"
         onClick={onViewDetails}>
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#911414] to-[#d20001] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1 truncate">{department.name}</h3>
            {department.code && (
              <span className="inline-block px-2 py-1 bg-[#911414] text-white text-xs rounded font-medium">
                {department.code}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(department); }}
            className="p-1.5 sm:p-2 text-[#911414] hover:bg-red-100 rounded-lg transition-colors"
            title="Edit Department"
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(department.id, deptTickets.length); }}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              canDelete && deptTickets.length === 0
                ? 'text-red-600 hover:bg-red-100' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={canDelete && deptTickets.length === 0 ? 'Delete Department' : 'Cannot delete - has tickets or users'}
            disabled={!canDelete || deptTickets.length > 0}
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Statistics Grid - Responsive */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-600">Staff</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{deptUsers.length}</p>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-[#911414]" />
            <span className="text-xs font-medium text-gray-600">Tickets</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{deptTickets.length}</p>
        </div>
      </div>

      {/* Ticket Status Breakdown */}
      {deptTickets.length > 0 && (
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 mb-2 sm:mb-3">
          <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
            <span className="font-medium text-gray-700">Ticket Status</span>
            {criticalTickets > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                <AlertCircle className="w-3 h-3" />
                {criticalTickets} Critical
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="font-bold text-orange-600">{openTickets}</p>
              <p className="text-gray-500">Open</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-purple-600">{inProgressTickets}</p>
              <p className="text-gray-500">Active</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-green-600">{resolvedTickets}</p>
              <p className="text-gray-500">Done</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Indicator */}
      {deptTickets.length > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 sm:p-3 border border-green-200">
          <div className="flex items-center gap-1 sm:gap-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Resolution Rate</span>
          </div>
          <span className={`text-base sm:text-lg font-bold ${
            resolutionRate >= 80 ? 'text-green-600' :
            resolutionRate >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {resolutionRate}%
          </span>
        </div>
      )}

      {department.description && (
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 line-clamp-2">
          {department.description}
        </p>
      )}

      {/* Click to view hint */}
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
        <p className="text-xs text-center text-gray-500 italic">
          Tap to view staff and manage tickets →
        </p>
      </div>
    </div>
  );
};
