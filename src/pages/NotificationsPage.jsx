import { useState, useEffect, useCallback } from 'react';
import { FiBell, FiCheckCircle, FiAlertCircle, FiInfo, FiCalendar, FiFileText, FiActivity, FiTrash2, FiCheck, FiLoader } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { getNotifications, marquerLue, marquerToutesLues, supprimerNotification } from '../api/notificationAPI';

const TYPE_CONFIG = {
  resultat:  { icon: <FiActivity size={16}/>,    color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
  rdv:       { icon: <FiCalendar size={16}/>,    color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  urgence:   { icon: <FiAlertCircle size={16}/>, color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  info:      { icon: <FiInfo size={16}/>,        color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  document:  { icon: <FiFileText size={16}/>,    color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  suivi:     { icon: <FiActivity size={16}/>,    color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
};

const timeAgo = (dateStr) => {
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
};

const normalizeNotif = (n) => ({
  id:      n.id,
  type:    n.type || 'info',
  titre:   n.titre || n.type || 'Notification',
  message: n.message || n.contenu || '',
  date:    n.created_at || n.date_envoi || new Date().toISOString(),
  lu:      n.est_lue ?? false,
});

const NotificationsPage = () => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre]   = useState('Toutes');

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getNotifications();
      const data = res.data?.notifications?.data ?? res.data?.notifications ?? res.data ?? [];
      setNotifs(Array.isArray(data) ? data.map(normalizeNotif) : []);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const filtres = ['Toutes', 'Non lues', 'Lues'];
  const nonLues = notifs.filter(n => !n.lu).length;

  const filtered = notifs.filter(n =>
    filtre === 'Toutes' ? true : filtre === 'Non lues' ? !n.lu : n.lu
  );

  const handleMarquerLu = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    try { await marquerLue(id); } catch { charger(); }
  };

  const handleMarquerToutLu = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
    try { await marquerToutesLues(); } catch { charger(); }
  };

  const handleSupprimer = async (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    try { await supprimerNotification(id); } catch { charger(); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content" style={{ animation: 'fadeIn 0.4s ease' }}>

        {/* Header */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={headerIcon}>
              <FiBell size={20} color="#A78BFA" />
            </div>
            <div>
              <h1 style={titleStyle}>Notifications</h1>
              <p style={subtitleStyle}>
                {loading ? 'Chargement…' : nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout est à jour'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageSwitcher />
            {nonLues > 0 && (
              <button onClick={handleMarquerToutLu} style={markAllBtn}>
                <FiCheck size={13} /> Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {filtres.map(f => (
            <button key={f} onClick={() => setFiltre(f)} style={{ ...filterBtn, ...(filtre === f ? filterBtnActive : {}) }}>
              {f}
              {f === 'Non lues' && nonLues > 0 && (
                <span style={countBadge}>{nonLues}</span>
              )}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {loading ? (
          <div style={emptyState}>
            <FiLoader size={32} color="#D1D5DB" style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement des notifications…</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={emptyState}>
                <FiBell size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <div style={{ color: '#9CA3AF', fontSize: 14 }}>Aucune notification</div>
              </div>
            ) : filtered.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              return (
                <div key={n.id} style={{ ...notifCard, opacity: n.lu ? 0.7 : 1, animationDelay: `${i * 50}ms` }}>
                  {!n.lu && <div style={unreadDot} />}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.color }}>
                      {cfg.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: n.lu ? 500 : 700, color: n.lu ? '#6B7280' : '#111827', fontFamily: "'Outfit',sans-serif" }}>
                          {n.titre}
                        </span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginLeft: 12 }}>{timeAgo(n.date)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {!n.lu && (
                        <button onClick={() => handleMarquerLu(n.id)} title="Marquer comme lu" style={iconBtn}>
                          <FiCheckCircle size={14} color="#0ED2A0" />
                        </button>
                      )}
                      <button onClick={() => handleSupprimer(n.id)} title="Supprimer" style={iconBtn}>
                        <FiTrash2 size={14} color="#F87171" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

const titleStyle    = { fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', margin: 0 };
const subtitleStyle = { fontSize: 13, color: '#6B7280', marginTop: 2 };
const headerIcon    = { width: 48, height: 48, borderRadius: 14, background: '#F5F3FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const markAllBtn    = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(14,210,160,0.1)', border: '1px solid rgba(14,210,160,0.2)', borderRadius: 10, color: '#0ED2A0', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const filterBtn     = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
const filterBtnActive = { background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.25)', color: '#A78BFA' };
const countBadge    = { background: '#F87171', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 6px', marginLeft: 2 };
const notifCard     = { position: 'relative', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '16px 20px', animation: 'slideUp 0.4s ease both', transition: 'border-color 0.2s', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)' };
const unreadDot     = { position: 'absolute', top: 18, left: -1, width: 3, height: 28, borderRadius: '0 3px 3px 0', background: '#A78BFA' };
const iconBtn       = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' };
const emptyState    = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20 };

export default NotificationsPage;
