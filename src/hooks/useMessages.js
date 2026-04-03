import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axiosConfig';

/**
 * Hook pour la messagerie — conversations + messages temps réel
 * @param {number} pollInterval - polling en ms (défaut 10s)
 */
export function useMessages(pollInterval = 10000) {
  const [conversations, setConversations]   = useState([]);
  const [totalNonLus, setTotalNonLus]       = useState(0);
  const [loadingConvs, setLoadingConvs]     = useState(false);
  const intervalRef                         = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await API.get('/messages/conversations');
      const data = res.data ?? [];
      setConversations(Array.isArray(data) ? data : []);
      setTotalNonLus(Array.isArray(data) ? data.reduce((s, c) => s + (c.non_lus || 0), 0) : 0);
    } catch {}
  }, []);

  useEffect(() => {
    setLoadingConvs(true);
    fetchConversations().finally(() => setLoadingConvs(false));
    intervalRef.current = setInterval(fetchConversations, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [fetchConversations, pollInterval]);

  return { conversations, totalNonLus, loadingConvs, refreshConversations: fetchConversations };
}

/**
 * Hook pour les messages d'une conversation spécifique
 * @param {number|null} userId - ID de l'interlocuteur
 * @param {number} pollInterval - polling en ms
 */
export function useConversation(userId, pollInterval = 5000) {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const intervalRef               = useRef(null);

  const fetchMessages = useCallback(async (p = 1) => {
    if (!userId) return;
    if (p === 1) setLoading(true);
    try {
      const res = await API.get(`/messages/${userId}`, { params: { page: p, per_page: 50 } });
      const data = res.data;
      const items = data.data ?? data;
      if (p === 1) {
        setMessages(Array.isArray(items) ? items : []);
      } else {
        setMessages(prev => [...(Array.isArray(items) ? items : []), ...prev]);
      }
      setHasMore((data.current_page ?? 1) < (data.last_page ?? 1));
    } catch {} finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setMessages([]);
    setPage(1);
    fetchMessages(1);
    intervalRef.current = setInterval(() => fetchMessages(1), pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [userId, fetchMessages, pollInterval]);

  const sendMessage = useCallback(async (contenu, fichier = null) => {
    if (!userId || (!contenu?.trim() && !fichier)) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('destinataire_id', userId);
      if (contenu?.trim()) formData.append('contenu', contenu.trim());
      if (fichier) formData.append('fichier', fichier);

      const res = await API.post('/messages/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages(prev => [...prev, res.data]);
      return res.data;
    } finally {
      setSending(false);
    }
  }, [userId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage);
  };

  return { messages, loading, sending, hasMore, sendMessage, loadMore, refresh: () => fetchMessages(1) };
}

export default useMessages;
