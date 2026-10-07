import { useCallback, useEffect, useRef, useState } from 'react';

/** Loads data with loading / error / reload. Ignores stale responses. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const seq = useRef(0);
  const run = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    setError(null);
    try { const d = await fn(); if (id === seq.current) setData(d); }
    catch (e) { if (id === seq.current) setError(e); }
    finally { if (id === seq.current) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { data, loading, error, reload: () => run(), refresh: () => run(true), setData };
}
