import React, { createContext, useContext, useRef, useCallback } from 'react';

const ApiCacheContext = createContext(null);

export function ApiCacheProvider({ children }) {
  const cacheRef = useRef(new Map());
  const cacheTimeRef = useRef(new Map());

  const CACHE_DURATION = 5 * 60 * 1000;

  const getCached = useCallback((key) => {
    const cached = cacheRef.current.get(key);
    const cachedAt = cacheTimeRef.current.get(key);
    
    if (cached && cachedAt && Date.now() - cachedAt < CACHE_DURATION) {
      return cached;
    }
    return null;
  }, []);

  const setCached = useCallback((key, data) => {
    cacheRef.current.set(key, data);
    cacheTimeRef.current.set(key, Date.now());
  }, []);

  const clearCache = useCallback((key) => {
    if (key) {
      cacheRef.current.delete(key);
      cacheTimeRef.current.delete(key);
    } else {
      cacheRef.current.clear();
      cacheTimeRef.current.clear();
    }
  }, []);

  return (
    <ApiCacheContext.Provider value={{ getCached, setCached, clearCache }}>
      {children}
    </ApiCacheContext.Provider>
  );
}

export function useApiCache(key, fetcher, options = {}) {
  const { immediate = true, cacheTime = 5 * 60 * 1000 } = options;
  const { getCached, setCached } = useContext(ApiCacheContext);
  
  const fetchData = useCallback(async () => {
    const cached = getCached(key);
    if (cached) return cached;
    
    const data = await fetcher();
    setCached(key, data);
    return data;
  }, [key, fetcher, getCached, setCached]);

  return { fetchData, clearCache: () => getCached(key) ? setCached(key, null) : null };
}

export default ApiCacheContext;