import { useState, useEffect, useCallback } from 'react';
import { departmentService } from '../services/departmentService';

export const useDepartments = (shouldFetch = true) => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    if (!shouldFetch) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await departmentService.getAll();
      if (data.success) {
        setDepartments(data.departments || []);
      } else {
        setError(data.message || 'Failed to fetch departments');
        setDepartments([]);
      }
    } catch (error) {
      setError('Failed to fetch departments');
      setDepartments([]);
      console.error('Error fetching departments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetch]);

  const createDepartment = useCallback(async (department) => {
    try {
      const data = await departmentService.create(department);
      if (data.success) {
        await fetchDepartments();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error creating department:', error);
      return { success: false, message: 'Failed to create department' };
    }
  }, [fetchDepartments]);

  const updateDepartment = useCallback(async (id, department) => {
    try {
      const data = await departmentService.update(id, department);
      if (data.success) {
        await fetchDepartments();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error updating department:', error);
      return { success: false, message: 'Failed to update department' };
    }
  }, [fetchDepartments]);

  const deleteDepartment = useCallback(async (id) => {
    try {
      const data = await departmentService.delete(id);
      if (data.success) {
        await fetchDepartments();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error deleting department:', error);
      return { success: false, message: 'Failed to delete department' };
    }
  }, [fetchDepartments]);

  useEffect(() => {
    if (shouldFetch) {
      fetchDepartments();
    }
  }, [shouldFetch, fetchDepartments]);

  return {
    departments,
    isLoading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
  };
};
