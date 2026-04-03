import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer la pagination + recherche + filtres
 * @param {Function} apiCall - fn(params) => Promise<AxiosResponse>
 * @param {Object} defaultFilters - filtres initiaux
 * @param {number} perPage - éléments par page
 */
export function usePagination(apiCall, defaultFilters = {}, perPage = 15) {
  const [items, setItems]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [page, setPage]           = useState(1);
  const [filters, setFilters]     = useState(defaultFilters);
  const [search, setSearch]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: perPage, ...filters };
      if (search.trim()) params.search = search.trim();

      const res  = await apiCall(params);
      const data = res.data;

      // Support Laravel paginator (data.data) et tableau simple
      if (data && data.data && Array.isArray(data.data)) {
        setItems(data.data);
        setPagination({
          total:        data.total,
          per_page:     data.per_page,
          current_page: data.current_page,
          last_page:    data.last_page,
        });
      } else {
        setItems(Array.isArray(data) ? data : []);
        setPagination(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters, perPage, apiCall]);

  useEffect(() => { load(); }, [load]);

  const goToPage   = (p) => setPage(p);
  const nextPage   = () => setPage(p => Math.min(p + 1, pagination?.last_page ?? p));
  const prevPage   = () => setPage(p => Math.max(p - 1, 1));
  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };
  const onSearch = (value) => { setSearch(value); setPage(1); };
  const refresh  = () => load();

  return {
    items, pagination, loading, error,
    page, search, filters,
    goToPage, nextPage, prevPage,
    onSearch, updateFilter, setFilters, refresh,
  };
}

export default usePagination;
