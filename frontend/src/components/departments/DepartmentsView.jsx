import React, { useState } from 'react';
import { Building2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { DepartmentCard } from './DepartmentCard';
import { DepartmentModal } from './DepartmentModal';
import { DepartmentDetailModal } from './DepartmentDetailModal';
import { UserTicketsDrawer } from './UserTicketsDrawer';
import { TicketAssignModal } from '../tickets/TicketAssignModal';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { useTickets } from '../../hooks/useTickets';
import { ticketService } from '../../services/ticketService';

export const DepartmentsView = ({ departments: propDepartments, isLoading: propLoading }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [viewingDepartment, setViewingDepartment] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [reassigningTicket, setReassigningTicket] = useState(null);

  const hookData = useDepartments(!propDepartments);
  const departments = propDepartments || hookData.departments;
  const isLoading = propLoading !== undefined ? propLoading : hookData.isLoading;
  const { createDepartment, updateDepartment, deleteDepartment, fetchDepartments } = hookData;

  const { users } = useUsers();
  const { tickets, fetchTickets } = useTickets(true);

  const handleAdd = () => {
    setEditingDepartment(null);
    setShowModal(true);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setShowModal(true);
  };

  const handleSave = async (data) => {
    if (editingDepartment) {
      return await updateDepartment(editingDepartment.id, data);
    } else {
      return await createDepartment(data);
    }
  };

  const handleDelete = async (id, ticketCount) => {
    if (ticketCount > 0) {
      alert(`Cannot delete department with ${ticketCount} tickets. Please reassign or close tickets first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    const result = await deleteDepartment(id);
    if (result.success) {
      alert('Department deleted successfully!');
    } else {
      alert(result.message || 'Failed to delete department');
    }
  };

  const handleViewDetails = (department) => {
    setViewingDepartment(department);
  };

  const handleViewUserTickets = (user) => {
    setViewingUser(user);
  };

  const handleReassign = (ticket) => {
    setReassigningTicket(ticket);
  };

  const handleAssignSubmit = async (userId) => {
    try {
      const result = await ticketService.assign(reassigningTicket.id, userId);
      if (result.success) {
        await fetchTickets();
        setReassigningTicket(null);
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Assignment error:', error);
      return { success: false, message: 'Failed to assign ticket' };
    }
  };

  const handleRefresh = () => {
    if (fetchDepartments) {
      fetchDepartments();
    }
    if (fetchTickets) {
      fetchTickets();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#911414] animate-spin" />
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
        {/* Header - Mobile Optimized */}
        <div className="space-y-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Department Management</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Manage departments, staff, and ticket distribution
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {departments.length} department{departments.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Action Buttons - Stacked on Mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {fetchDepartments && (
              <button
                onClick={handleRefresh}
                className="w-full sm:w-auto px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            )}
            <button 
              onClick={handleAdd}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* Department Cards Grid - Responsive */}
        {departments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {departments.map(dept => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                tickets={tickets}
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={() => handleViewDetails(dept)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No Departments Yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">
              Get started by adding your first department
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Your First Department
            </button>
          </div>
        )}
      </div>

      {/* Modals and Drawers */}
      {showModal && (
        <DepartmentModal
          department={editingDepartment}
          onClose={() => {
            setShowModal(false);
            setEditingDepartment(null);
          }}
          onSave={handleSave}
        />
      )}

      {viewingDepartment && (
        <DepartmentDetailModal
          department={viewingDepartment}
          tickets={tickets}
          users={users}
          onClose={() => setViewingDepartment(null)}
          onViewUserTickets={handleViewUserTickets}
        />
      )}

      {viewingUser && (
        <UserTicketsDrawer
          user={viewingUser}
          tickets={tickets}
          onClose={() => setViewingUser(null)}
          onReassign={handleReassign}
        />
      )}

      {reassigningTicket && (
        <TicketAssignModal
          ticket={reassigningTicket}
          onClose={() => setReassigningTicket(null)}
          onAssign={handleAssignSubmit}
        />
      )}
    </div>
  );
};
