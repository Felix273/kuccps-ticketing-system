import React, { useState } from 'react';
import { Users as UsersIcon, Plus, RefreshCw, Search } from 'lucide-react';
import { UserCard } from './UserCard';
import { UserModal } from './UserModal';
import { useUsers } from '../../hooks/useUsers';

export const UsersView = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const { users, isLoading, createUser, updateUser, deleteUser, refetch } = useUsers();

  const handleAdd = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSave = async (data) => {
    console.log('📤 Sending user data to backend:', JSON.stringify(data, null, 2));
    
    let result;
    if (editingUser) {
      console.log('🔄 Updating existing user:', editingUser.id);
      result = await updateUser(editingUser.id, data);
    } else {
      console.log('➕ Creating new user');
      result = await createUser(data);
    }

    console.log('📥 Backend response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ User saved successfully! Refreshing list...');
      // Force refresh after save
      setTimeout(() => {
        refetch();
      }, 500);
    } else {
      console.error('❌ Failed to save user:', result.message);
    }

    return result;
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    const result = await deleteUser(id);
    if (result.success) {
      alert('User deleted successfully!');
    } else {
      alert(result.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Debug: Log users when they change
  React.useEffect(() => {
    console.log('👥 Current users count:', users.length);
    if (users.length > 0) {
      console.log('📋 Sample user data:', {
        name: users[0].name,
        departmentId: users[0].departmentId,
        department: users[0].department
      });
    }
  }, [users]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#911414] animate-spin" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage IT staff and assign them to departments • {users.length} total users
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                refetch();
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button 
              onClick={handleAdd}
              className="px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] flex items-center gap-2 font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">IT Staff</option>
            <option value="user">Regular User</option>
          </select>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredUsers.length}</span> of{' '}
            <span className="font-semibold">{users.length}</span> users
          </p>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {users.length === 0 ? 'No Users Yet' : 'No Users Found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {users.length === 0 
                ? 'Get started by adding your first user'
                : 'Try adjusting your search or filters'
              }
            </p>
            {users.length === 0 && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                Add Your First User
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
