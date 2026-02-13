import React, { useState, useEffect } from 'react';
import { X, User, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';

export const TicketAssignModal = ({ ticket, onClose, onAssign }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedUser, setSelectedUser] = useState(ticket?.assignedToId || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { departments } = useDepartments(true);
  const { users } = useUsers();

  // Filter users by selected department
  const filteredUsers = selectedDepartment
    ? users.filter(u => u.department === selectedDepartment)
    : users;

  useEffect(() => {
    // Pre-select department if ticket has one
    if (ticket?.department?.name) {
      setSelectedDepartment(ticket.department.name);
    } else if (ticket?.assignedTo?.department) {
      setSelectedDepartment(ticket.assignedTo.department);
    }
  }, [ticket]);

  const handleAssign = async () => {
    if (!selectedUser) {
      setError('Please select a user to assign this ticket');
      return;
    }

    setIsAssigning(true);
    setError('');
    setSuccess('');

    try {
      const result = await onAssign(selectedUser);
      if (result.success) {
        setSuccess('Ticket assigned successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to assign ticket');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      setError('Failed to assign ticket');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Assign Ticket</h2>
              <p className="text-sm text-white/80 mt-1">{ticket?.ticketNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              disabled={isAssigning}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          )}

          {/* Ticket Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900">Ticket Details</h3>
            <p className="text-sm text-gray-600"><span className="font-medium">Subject:</span> {ticket?.subject}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Priority:</span> {ticket?.priority}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Status:</span> {ticket?.status}</p>
            {ticket?.assignedTo && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Currently Assigned To:</span> {ticket.assignedTo.name}
              </p>
            )}
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Building2 className="inline w-4 h-4 mr-1" />
              Filter by Department (Optional)
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedUser(''); // Reset user selection
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              disabled={isAssigning}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedDepartment 
                ? `Showing users from ${selectedDepartment}` 
                : 'Showing all users'}
            </p>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Assign To *
            </label>
            {filteredUsers.length > 0 ? (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                required
                disabled={isAssigning}
              >
                <option value="">-- Select a user --</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role}) {user.department ? `- ${user.department}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {selectedDepartment 
                    ? `No users found in ${selectedDepartment} department. Try selecting a different department.`
                    : 'No users available. Please create users first.'}
                </p>
              </div>
            )}
          </div>

          {/* Assignment Info */}
          {selectedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <CheckCircle className="inline w-4 h-4 mr-1" />
                Ticket will be assigned to {filteredUsers.find(u => u.id === selectedUser)?.name}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAssign}
              disabled={isAssigning || !selectedUser}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? 'Assigning...' : 'Assign Ticket'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isAssigning}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
