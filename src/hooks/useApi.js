import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook générique pour appels API avec état loading/error/data
 * @param {Function} apiCall - fonction qui retourne une Promise (axios)
 * @param {Array} deps - dépendances pour re-déclencher l'appel
 * @param {Object} options - { immediate: bool, transform: fn }
 */
export function useApi(apiCall, deps = [], options = {}) {
  const { immediate = true, transform } = options;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);
  const callRef               = useRef(apiCall);

  // Garder la ref à jour sans déclencher le useEffect
  useEffect(() => { callRef.current = apiCall; });

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res    = await callRef.current(...args);
      const result = transform ? transform(res.data) : res.data;
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

  return { data, loading, error, execute, setData };
}

export default useApi;
