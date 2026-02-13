import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

export const useUsers = (role = null) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getAll(role);
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.message || 'Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      setError('Failed to fetch users');
      setUsers([]);
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  const createUser = useCallback(async (user) => {
    try {
      const data = await userService.create(user);
      if (data.success) {
        // Add the new user to the list immediately
        if (data.user) {
          setUsers(prev => [data.user, ...prev]);
        } else {
          await fetchUsers();
        }
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id, user) => {
    try {
      const data = await userService.update(id, user);
      console.log('📦 Full API response:', data);
      
      if (data.success) {
        // Update the user in the list immediately
        if (data.user) {
          setUsers(prev => prev.map(u => u.id === id ? data.user : u));
          return { success: true, user: data.user };
        } else {
          await fetchUsers();
          return { success: true };
        }
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: 'Failed to update user' };
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id) => {
    try {
      const data = await userService.delete(id);
      if (data.success) {
        // Remove from list immediately
        setUsers(prev => prev.filter(u => u.id !== id));
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { 
    users, 
    isLoading, 
    error, 
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};
