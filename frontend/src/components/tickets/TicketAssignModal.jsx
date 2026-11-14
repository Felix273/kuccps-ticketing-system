import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRightLeft,
  RefreshCw 
} from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';

export const TicketAssignModal = ({ ticket, onClose, onAssign }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedUser, setSelectedUser] = useState(ticket?.assignedToId || '');
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { departments = [] } = useDepartments(true);
  const { users = [] } = useUsers();

  // Filter users by selected department (handling both object and string department formats)
  const filteredUsers = selectedDepartment
    ? users.filter(u => {
        const deptName = u.department?.name || (typeof u.department === 'string' ? u.department : '');
        return deptName === selectedDepartment;
      })
    : users;

  useEffect(() => {
    if (ticket?.department?.name) {
      setSelectedDepartment(ticket.department.name);
    } else if (ticket?.assignedTo?.department) {
      const deptName = ticket.assignedTo.department?.name || 
        (typeof ticket.assignedTo.department === 'string' ? ticket.assignedTo.department : '');
      setSelectedDepartment(deptName);
    }
  }, [ticket]);

  const handleAssign = async () => {
    if (!selectedUser) {
      setError('Please select an officer to claim this ticket');
      return;
    }

    setIsAssigning(true);
    setError('');
    setSuccess('');

    try {
      const result = await onAssign(selectedUser);
      if (result.success) {
        setSuccess('Ticket claim transferred successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(result.message || 'Failed to transfer ticket claim');
      }
    } catch (err) {
      console.error('Claim transfer error:', err);
      setError('Failed to transfer ticket claim');
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedOfficer = filteredUsers.find(u => u.id === selectedUser);

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-slide-in">
        
        {/* 1. HEADER (No Solid Red Banner) */}
        <div className="p-5 border-b border-zinc-200 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="font-mono text-xs text-zinc-400">
                Reassign / Claim Transfer / <strong className="text-zinc-900 font-bold">#{ticket?.ticketNumber}</strong>
              </span>

              <h2 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2 mt-1 truncate">
                <ArrowRightLeft className="w-4 h-4 text-[#990024] shrink-0" />
                <span>Reassign Ticket Claim</span>
              </h2>

              <p className="font-mono text-xs text-zinc-400 truncate">
                Transfer ticket ownership to another support officer
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isAssigning}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs font-mono text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-mono text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Ticket Context Card */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60 text-xs font-mono space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-1">
              Ticket Context
            </span>
            <p className="font-sans font-bold text-zinc-900 text-sm truncate">
              {ticket?.subject}
            </p>
            <div className="flex items-center gap-3 text-zinc-600 pt-1 text-[11px] flex-wrap">
              <span>Status: <strong className="text-zinc-800">{ticket?.status}</strong></span>
              <span>•</span>
              <span>Priority: <strong className="text-zinc-800">{ticket?.priority}</strong></span>
              <span>•</span>
              <span>Current: <strong className="text-[#990024]">{ticket?.assignedTo?.name || 'Unassigned'}</strong></span>
            </div>
          </div>

          {/* Department Filter */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10.5px] uppercase tracking-wider text-zinc-500 font-semibold">
              <Building2 className="inline w-3.5 h-3.5 mr-1 text-zinc-400" />
              Filter by Department (Optional)
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedUser('');
              }}
              disabled={isAssigning}
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-700 focus:outline-none focus:border-[#990024] focus:bg-white"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] font-mono text-zinc-400">
              {selectedDepartment 
                ? `Filtering officers in ${selectedDepartment}` 
                : 'Displaying officers from all directorates'}
            </p>
          </div>

          {/* Target Officer Selection */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10.5px] uppercase tracking-wider text-zinc-500 font-semibold">
              <User className="inline w-3.5 h-3.5 mr-1 text-zinc-400" />
              Assign To Support Officer *
            </label>

            {filteredUsers.length > 0 ? (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={isAssigning}
                required
                className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-800 focus:outline-none focus:border-[#990024] focus:bg-white"
              >
                <option value="">-- Choose target officer --</option>
                {filteredUsers.map(user => {
                  const dept = user.department?.name || (typeof user.department === 'string' ? user.department : '');
                  return (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role}){dept ? ` • ${dept}` : ''}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs font-mono text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  {selectedDepartment 
                    ? `No officers found attached to "${selectedDepartment}". Try selecting a different department.`
                    : 'No officers found in directory.'}
                </p>
              </div>
            )}
          </div>

          {/* Selection Confirmation Preview */}
          {selectedOfficer && (
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-zinc-600">New Assignee:</span>
                <strong className="text-zinc-900">{selectedOfficer.name}</strong>
              </div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold">{selectedOfficer.role}</span>
            </div>
          )}

        </div>

        {/* 3. FOOTER ACTIONS */}
        <div className="border-t border-zinc-200 bg-zinc-50/80 p-3.5 px-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="px-3.5 py-1.5 text-xs font-mono font-semibold border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAssign}
            disabled={isAssigning || !selectedUser}
            className="px-4 py-1.5 text-xs font-mono font-semibold bg-[#990024] hover:bg-[#80001e] text-white rounded shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{isAssigning ? 'Transferring Claim...' : 'Confirm Transfer'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
