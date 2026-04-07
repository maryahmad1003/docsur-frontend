import { useState, useEffect, useCallback, useRef } from 'react';

const globalCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

function getCacheKey(apiCall, args) {
  const fnName = apiCall?.name || apiCall?.toString()?.slice(0, 50) || 'anonymous';
  const argsStr = JSON.stringify(args || []);
  return `${fnName}:${argsStr}`;
}

function getFromCache(key) {
  const cached = globalCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  globalCache.delete(key);
  return null;
}

function setToCache(key, data) {
  globalCache.set(key, { data, timestamp: Date.now() });
}

function clearApiCache(key = null) {
  if (key) {
    globalCache.delete(key);
  } else {
    globalCache.clear();
  }
}

export function useApi(apiCall, deps = [], options = {}) {
  const { immediate = true, transform, cacheKey } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const callRef = useRef(apiCall);
  const cacheKeyRef = useRef(cacheKey || getCacheKey(apiCall, deps));

  useEffect(() => { callRef.current = apiCall; });

  const execute = useCallback(async (...args) => {
    const key = cacheKeyRef.current || getCacheKey(callRef.current, args);
    const cached = getFromCache(key);
    
    if (cached && !options.force) {
      setData(cached);
      return cached;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await callRef.current(...args);
      const result = transform ? transform(res.data) : res.data;
      setToCache(key, result);
      setData(result);
      return result;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur réseau';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { data, loading, error, execute, setData, clearCache: () => clearApiCache(cacheKeyRef.current) };
}

export default useApi;