import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '../services/ticketService';

export const useTickets = (autoFetch = true) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketService.getAll();
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        setError(data.message || 'Failed to fetch tickets');
        setTickets([]);
      }
    } catch (err) {
      setError('Failed to fetch tickets');
      setTickets([]);
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTicket = async (id, updates) => {
    try {
      const data = await ticketService.update(id, updates);
      if (data.success) {
        await fetchTickets();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error('Error updating ticket:', err);
      return { success: false, message: 'Failed to update ticket' };
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchTickets();
    }
  }, [autoFetch, fetchTickets]);

  return {
    tickets,
    isLoading,
    error,
    fetchTickets,
    updateTicket
  };
};
