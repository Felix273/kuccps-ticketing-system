import { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';

export const useStatistics = (shouldFetch = true) => {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    if (!shouldFetch) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketService.getStatistics();
      if (data.success) {
        setStatistics(data.statistics);
      } else {
        setError(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      setError('Failed to fetch statistics');
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch) {
      fetchStatistics();
    }
  }, [shouldFetch]);

  return { statistics, isLoading, error, refetch: fetchStatistics };
};
