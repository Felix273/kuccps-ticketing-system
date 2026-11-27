import { useCallback, useEffect, useState } from 'react';
import { ticketService } from '../services/ticketService';

const EMPTY_PAGE = {
  tickets: [],
  pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
  segmentCounts: {}
};

/**
 * Loads one server-side page of tickets for the given filter params.
 * Re-fetches when params, refreshKey or reload() change. While a new page loads the
 * previous page stays visible (isLoading is true) to avoid flicker.
 */
export const useTicketPage = (params, { enabled = true, refreshKey = 0 } = {}) => {
  const paramsKey = JSON.stringify(params);
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${paramsKey}|${refreshKey}|${reloadCount}`;
  const [result, setResult] = useState({ key: null, data: EMPTY_PAGE, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    ticketService.list(JSON.parse(paramsKey))
      .then(data => {
        if (!active) return;
        if (data.success) {
          setResult({ key: requestKey, data: { ...EMPTY_PAGE, ...data }, error: null });
        } else {
          setResult(previous => ({ ...previous, key: requestKey, error: data.message || 'Failed to fetch tickets' }));
        }
      })
      .catch(error => {
        if (active) setResult(previous => ({ ...previous, key: requestKey, error: error.message || 'Failed to fetch tickets' }));
      });
    return () => { active = false; };
  }, [enabled, paramsKey, requestKey]);

  const reload = useCallback(() => setReloadCount(count => count + 1), []);

  return {
    tickets: result.data.tickets,
    pagination: result.data.pagination,
    segmentCounts: result.data.segmentCounts,
    isLoading: enabled && result.key !== requestKey,
    hasLoaded: result.key !== null,
    error: result.error,
    reload
  };
};
