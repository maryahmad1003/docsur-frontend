import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axiosConfig';

/**
 * Hook pour gérer les notifications en temps réel (polling)
 * @param {number} pollInterval - intervalle de polling en ms (défaut 30s)
 */
export function useNotifications(pollInterval = 30000) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const intervalRef                       = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get('/notifications');
      const data = res.data?.data ?? res.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(Array.isArray(data) ? data.filter(n => !n.lu).length : 0);
    } catch {
      // Silencieux — ne pas spammer la console si l'utilisateur est déconnecté
    }
  }, []);

  // Démarrer/arrêter le polling
  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications, pollInterval]);

  const markAsRead = useCallback(async (id) => {
    try {
      await API.put(`/notifications/${id}/lue`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.lu);
    await Promise.allSettled(unread.map(n => API.put(`/notifications/${n.id}/lue`)));
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    setUnreadCount(0);
  }, [notifications]);

  return {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, refresh: fetchNotifications,
  };
}

export default useNotifications;
