import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export const useIdleLogout = (isAuthenticated, onIdle, timeoutMs = 5 * 60 * 1000) => {
  const timerRef = useRef(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onIdleRef.current?.();
      }, timeoutMs);
    };

    resetTimer();

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, timeoutMs]);
};