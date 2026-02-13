import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';

export const UserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    password: '',
    role: user?.role || 'staff',
    departmentId: user?.departmentId || user?.department?.id || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { departments, isLoading: deptLoading } = useDepartments(true);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.username.trim()) {
      setError('Name, email, and username are required');
      return;
    }

    if (!user && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const dataToSave = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        role: formData.role,
        departmentId: formData.departmentId ? String(formData.departmentId) : null
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        dataToSave.password = formData.password;
      }

      console.log('Saving user with data:', dataToSave);

      const result = await onSave(dataToSave);

      if (result.success) {
        setSuccess(user ? 'User updated successfully!' : 'User created successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to save user');
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save user: ' + error.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">
              {user ? 'Edit User' : 'Add New User'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              disabled={isSaving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                placeholder="John Doe"
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                placeholder="johndoe"
                required
                disabled={isSaving || !!user}
              />
              {user && <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              placeholder="john.doe@kuccps.ac.ke"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password {user ? '(optional)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              placeholder={user ? 'Leave blank to keep current password' : 'Enter password'}
              required={!user}
              disabled={isSaving}
            />
            {user && <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                required
                disabled={isSaving}
              >
                <option value="staff">IT Staff</option>
                <option value="admin">Admin</option>
                <option value="user">Regular User</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department
              </label>
              {deptLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-500">Loading departments...</p>
                </div>
              ) : departments.length === 0 ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-yellow-50">
                  <p className="text-sm text-yellow-700">No departments available. Create one first!</p>
                </div>
              ) : (
                <>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleChange('departmentId', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                    disabled={isSaving}
                  >
                    <option value="">-- No Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code ? `(${dept.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.departmentId ? 'User will be assigned to this department' : 'User will not be assigned to any department'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
