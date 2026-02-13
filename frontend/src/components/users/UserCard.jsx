import React from 'react';
import { User, Mail, Building2, Edit, Trash2 } from 'lucide-react';

export const UserCard = ({ user, onEdit, onDelete }) => {
  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      staff: 'bg-blue-100 text-blue-700 border-blue-200',
      user: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[role] || colors.user;
  };

  // user.department is already a STRING (not an object), so use it directly
  const departmentName = user.department || null;
  const hasDepartment = !!departmentName && departmentName.trim() !== '';

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#911414] to-[#d20001] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{user.name || 'Unnamed User'}</h3>
            <span className={`inline-block mt-1 px-2 py-1 text-xs rounded border font-medium ${getRoleBadge(user.role)}`}>
              {user.role?.toUpperCase() || 'USER'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(user)}
            className="p-2 text-[#911414] hover:bg-red-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(user.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{user.email || 'No email'}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Building2 className={`w-4 h-4 ${hasDepartment ? 'text-[#911414]' : 'text-gray-400'}`} />
          {hasDepartment ? (
            <span className="font-medium text-[#911414]">{departmentName}</span>
          ) : (
            <span className="text-gray-500 italic">No department assigned</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-gray-400" />
          <span>@{user.username || 'no-username'}</span>
        </div>
      </div>

      {user._count?.assignedTickets > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Assigned to <span className="font-semibold text-gray-700">{user._count.assignedTickets}</span> tickets
          </p>
        </div>
      )}
    </div>
  );
};
