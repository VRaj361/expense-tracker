import { useEffect, useState } from 'react';

/**
 * Returns `intervalMs` only while the document tab is visible; `false` when hidden (no polling).
 * Avoids hammering the API when the user switches away or minimizes.
 */
export function useVisiblePollInterval(intervalMs: number): number | false {
  const [hidden, setHidden] = useState(
    () => (typeof document !== 'undefined' ? document.hidden : false),
  );

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return hidden ? false : intervalMs;
}
