import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiVideo, FiPlus, FiSearch, FiEye, FiX, FiUser,
  FiCalendar, FiExternalLink, FiAlertCircle,
  FiCheckCircle, FiLoader, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import {
  getTeleconsultations,
  creerTeleconsultation,
  demarrerTeleconsultation,
  terminerTeleconsultation,
  getPatients,
} from '../../api/medecinAPI';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const STATUT = {
  planifiee: { label: 'Planifiée', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)'  },
  en_cours:  { label: 'En cours',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)'  },
  terminee:  { label: 'Terminée',  color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)'  },
  annulee:   { label: 'Annulée',   color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
};

function formatDT(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}
function initials(p) {
  const prenom = p?.user?.prenom || p?.prenom || '?';
  const nom    = p?.user?.nom    || p?.nom    || '?';
  return `${prenom[0]}${nom[0]}`.toUpperCase();
}
function patientFullName(p) {
  return `${p?.user?.prenom || p?.prenom || ''} ${p?.user?.nom || p?.nom || ''}`.trim();
}

// ─── JITSI EMBED ──────────────────────────────────────────────────────────────
function JitsiMeetEmbed({ roomName, displayName, onClose }) {
  const containerRef = useRef(null);
  const apiRef       = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    // Charger le script Jitsi si pas encore chargé
    const loadJitsiScript = () => {
      return new Promise((resolve) => {
        if (window.JitsiMeetExternalAPI) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadJitsiScript().then(() => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: containerRef.current,
        displayName,
        lang: 'fr',
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup',
            'chat', 'recording', 'sharedvideo', 'tileview',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      });

      apiRef.current.addEventListener('readyToClose', onClose);
    });

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, onClose]);

  return (
    <div style={{ ...styles.jitsiOverlay, ...(fullscreen ? styles.jitsiFullscreen : {}) }}>
      <div style={styles.jitsiHeader}>
        <span style={styles.jitsiTitle}><FiVideo size={16}/> Téléconsultation en cours</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.jitsiBtn} onClick={() => setFullscreen(f => !f)}>
            {fullscreen ? <FiMinimize2 size={16}/> : <FiMaximize2 size={16}/>}
          </button>
          <button style={{ ...styles.jitsiBtn, color: '#F87171' }} onClick={onClose}>
            <FiX size={16}/>
          </button>
        </div>
      </div>
      <div ref={containerRef} style={styles.jitsiContainer} />
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function TeleconsultationsPage() {
  const [telecList, setTelecList]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [activeSession, setActiveSession] = useState(null); // { roomName, displayName, telecId }
  const [toast, setToast]           = useState({ msg: '', type: 'success' });
  const [patients, setPatients]     = useState([]);
  const [form, setForm]             = useState({
    patient_id: '', date_debut: '', motif: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage]             = useState(1);

  // ── Load téléconsultations ──
  const loadTelec = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search)       params.search = search;
      if (filtreStatut) params.statut = filtreStatut;
      const res = await getTeleconsultations(params);
      const data = res.data;
      setTelecList(data.data ?? data);
      if (data.meta || data.last_page) setPagination(data);
    } catch {
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filtreStatut]);

  useEffect(() => { loadTelec(); }, [loadTelec]);

  // ── Load patients pour le formulaire ──
  useEffect(() => {
    getPatients({ per_page: 100 })
      .then(res => {
        const data = res.data;
        setPatients(data.data ?? data);
      })
      .catch(() => {});
  }, []);

  // ── KPIs ──
  const kpiTotal    = pagination?.total ?? telecList.length;
  const kpiPlan     = telecList.filter(t => t.statut === 'planifiee').length;
  const kpiEnCours  = telecList.filter(t => t.statut === 'en_cours').length;
  const kpiTerminee = telecList.filter(t => t.statut === 'terminee').length;

  // ── Toast ──
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  // ── Rejoindre une session ──
  const handleJoin = async (t) => {
    try {
      // Si planifiée, démarrer d'abord
      if (t.statut === 'planifiee') {
        const res = await demarrerTeleconsultation(t.id);
        const roomName = res.data.room_name || basename(t.lien_video);
        setActiveSession({ roomName, displayName: 'Dr. Médecin', telecId: t.id });
        setTelecList(prev => prev.map(item =>
          item.id === t.id ? { ...item, statut: 'en_cours' } : item
        ));
      } else if (t.statut === 'en_cours') {
        const roomName = basename(t.lien_video);
        setActiveSession({ roomName, displayName: 'Dr. Médecin', telecId: t.id });
      }
    } catch {
      showToast('Impossible de démarrer la session', 'error');
    }
  };

  const basename = (url) => url ? url.split('/').pop() : '';

  // ── Terminer une session ──
  const handleCloseSession = async () => {
    if (activeSession?.telecId) {
      try {
        await terminerTeleconsultation(activeSession.telecId);
        setTelecList(prev => prev.map(item =>
          item.id === activeSession.telecId ? { ...item, statut: 'terminee' } : item
        ));
        showToast('Session terminée');
      } catch {}
    }
    setActiveSession(null);
  };

  // ── Créer téléconsultation ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.date_debut) return;
    setSubmitting(true);
    try {
      await creerTeleconsultation({
        patient_id:  Number(form.patient_id),
        date_debut:  form.date_debut,
        motif:       form.motif,
      });
      showToast('Téléconsultation planifiée — le patient a été notifié');
      setShowModal(false);
      setForm({ patient_id: '', date_debut: '', motif: '' });
      loadTelec();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de la création';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{keyframes}</style>

      {/* ── Jitsi Session ── */}
      {activeSession && (
        <JitsiMeetEmbed
          roomName={activeSession.roomName}
          displayName={activeSession.displayName}
          onClose={handleCloseSession}
        />
      )}

      {/* ── Toast ── */}
      {toast.msg && (
        <div style={{ ...styles.toast, background: toast.type === 'error' ? 'linear-gradient(135deg,#F87171,#DC2626)' : 'linear-gradient(135deg,#0ED2A0,#059669)' }}>
          {toast.type === 'error' ? <FiAlertCircle size={15}/> : <FiCheckCircle size={15}/>}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Téléconsultations</h1>
          <p style={styles.subtitle}>Consultations vidéo via Jitsi Meet</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <FiPlus size={18}/> Nouvelle session
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={styles.kpiGrid}>
        <KpiCard label="Total"      value={kpiTotal}    color="#A78BFA" />
        <KpiCard label="Planifiées" value={kpiPlan}     color="#38BDF8" />
        <KpiCard label="En cours"   value={kpiEnCours}  color="#FBBF24" />
        <KpiCard label="Terminées"  value={kpiTerminee} color="#0ED2A0" />
      </div>

      {/* ── Filtres ── */}
      <div style={styles.filterRow}>
        <div style={styles.searchWrap}>
          <FiSearch size={15} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={styles.searchInput}
            placeholder="Rechercher un patient..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          style={styles.selectFilter}
          value={filtreStatut}
          onChange={e => { setFiltreStatut(e.target.value); setPage(1); }}
        >
          <option value="">Tous les statuts</option>
          <option value="planifiee">Planifiée</option>
          <option value="en_cours">En cours</option>
          <option value="terminee">Terminée</option>
        </select>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={styles.loadingWrap}>
          <FiLoader size={24} color="#0ED2A0" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#6B7280', fontSize: 14 }}>Chargement...</span>
        </div>
      ) : (
        <div style={styles.grid}>
          {telecList.length === 0 ? (
            <div style={styles.empty}>Aucune téléconsultation trouvée</div>
          ) : (
            telecList.map((t, idx) => (
              <TelecCard
                key={t.id}
                t={t}
                idx={idx}
                onJoin={() => handleJoin(t)}
                onDetail={() => setDetailItem(t)}
              />
            ))
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.last_page > 1 && (
        <div style={styles.paginationRow}>
          <button style={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
          <span style={styles.pageInfo}>Page {page} / {pagination.last_page}</span>
          <button style={styles.pageBtn} disabled={page >= pagination.last_page} onClick={() => setPage(p => p + 1)}>Suivant</button>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Nouvelle téléconsultation</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}><FiX size={18}/></button>
            </div>
            <form onSubmit={handleCreate} style={styles.modalForm}>
              <FormGroup label="Patient">
                <select
                  style={styles.input}
                  required
                  value={form.patient_id}
                  onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{patientFullName(p)}</option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label="Date et heure">
                <input
                  style={styles.input}
                  type="datetime-local"
                  required
                  value={form.date_debut}
                  onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                />
              </FormGroup>
              <FormGroup label="Motif (optionnel)">
                <input
                  style={styles.input}
                  value={form.motif}
                  onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
                  placeholder="Motif de la téléconsultation"
                />
              </FormGroup>
              <p style={{ color: '#6B7280', fontSize: 12, margin: '4px 0 0' }}>
                Un lien Jitsi Meet sera généré automatiquement. Le patient sera notifié.
              </p>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.submitBtn} disabled={submitting}>
                  <FiVideo size={15}/> {submitting ? 'Création...' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailItem && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Détails téléconsultation</h2>
              <button style={styles.closeBtn} onClick={() => setDetailItem(null)}><FiX size={18}/></button>
            </div>
            <div style={styles.detailBody}>
              <DetailRow label="Patient"    value={patientFullName(detailItem.patient)} />
              <DetailRow label="Date/heure" value={formatDT(detailItem.date_debut)} />
              <DetailRow label="Statut"     value={<span style={{ color: STATUT[detailItem.statut]?.color }}>{STATUT[detailItem.statut]?.label}</span>} />
              {detailItem.motif && <DetailRow label="Motif" value={detailItem.motif} />}
              <div style={styles.detailLien}>
                <span style={styles.detailLabel}>Lien Jitsi Meet</span>
                <a
                  href={detailItem.lien_video}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0ED2A0', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}
                >
                  {detailItem.lien_video} <FiExternalLink size={11}/>
                </a>
              </div>
              {(detailItem.statut === 'planifiee' || detailItem.statut === 'en_cours') && (
                <button
                  style={{ ...styles.submitBtn, width: '100%', justifyContent: 'center' }}
                  onClick={() => { handleJoin(detailItem); setDetailItem(null); }}
                >
                  <FiVideo size={15}/> Rejoindre la session
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TELEC CARD ───────────────────────────────────────────────────────────────
function TelecCard({ t, idx, onJoin, onDetail }) {
  const s = STATUT[t.statut] || STATUT.planifiee;
  const isActive  = t.statut === 'planifiee' || t.statut === 'en_cours';
  const isEnCours = t.statut === 'en_cours';

  return (
    <div style={{ ...styles.card, ...(isEnCours ? styles.cardEnCours : {}), animationDelay: `${idx * 0.07}s` }}>
      {isEnCours && (
        <div style={styles.pulseWrap}>
          <span style={styles.pulseDot} />
          <span style={styles.enCoursLabel}>EN COURS</span>
        </div>
      )}

      <div style={styles.cardTopRow}>
        <span style={{ ...styles.statutBadge, color: s.color, background: s.bg }}>{s.label}</span>
        <span style={styles.dateSmall}><FiCalendar size={11}/> {formatDT(t.date_debut)}</span>
      </div>

      <div style={styles.patientRow}>
        <div style={styles.avatar}>{initials(t.patient)}</div>
        <div>
          <div style={styles.patientName}>{patientFullName(t.patient)}</div>
          <div style={styles.patientSub}><FiUser size={11}/> Patient</div>
        </div>
      </div>

      {t.motif && <div style={styles.motif}>{t.motif}</div>}

      <div style={styles.lienDisplay}>
        <FiExternalLink size={11}/>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t.lien_video}
        </span>
      </div>

      <div style={styles.cardActions}>
        {isActive && (
          <button style={styles.joinBtn} onClick={onJoin}>
            <FiVideo size={14}/> Rejoindre
          </button>
        )}
        <button style={styles.detailBtn} onClick={onDetail}>
          <FiEye size={14}/> Détails
        </button>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiValue, color }}>{value}</div>
      <div style={styles.kpiLabel}>{label}</div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

// ─── KEYFRAMES ────────────────────────────────────────────────────────────────
const keyframes = `
  @keyframes fadeIn  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse   { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
  @keyframes toast   { 0% { opacity:0; transform:translateY(20px); } 10%,85% { opacity:1; transform:translateY(0); } 100% { opacity:0; } }
  @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
`;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    background: '#F6FBF8',
    minHeight: '100vh',
    padding: '32px 36px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#111827',
    animation: 'fadeIn 0.5s ease',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 28, fontWeight: 700, margin: 0,
    color: '#111827',
  },
  subtitle: { color: '#6B7280', margin: '6px 0 0', fontSize: 14 },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#16A34A',
    color: '#FFFFFF', border: '1px solid #15803D', borderRadius: 12,
    padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  kpiCard: {
    background: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: 16, padding: '20px 22px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
  },
  kpiValue: { fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  kpiLabel: { color: '#6B7280', fontSize: 13 },
  filterRow: { display: 'flex', gap: 12, marginBottom: 24 },
  searchWrap: { position: 'relative', flex: 1, maxWidth: 360 },
  searchInput: {
    width: '100%', background: '#FFFFFF', border: '1px solid #D1D5DB',
    borderRadius: 12, padding: '10px 14px 10px 40px', color: '#111827', fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  },
  selectFilter: {
    background: '#FFFFFF', border: '1px solid #D1D5DB',
    borderRadius: 12, padding: '10px 16px', color: '#111827', fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer',
    minWidth: 160,
  },
  loadingWrap: { display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0', justifyContent: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 },
  card: {
    background: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: 20, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)', animation: 'slideUp 0.4s ease both',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardEnCours: { borderColor: 'rgba(251,191,36,0.35)', boxShadow: '0 10px 32px rgba(251,191,36,0.12)' },
  pulseWrap: { position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6 },
  pulseDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#FBBF24', animation: 'pulse 1.4s ease-in-out infinite' },
  enCoursLabel: { color: '#FBBF24', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statutBadge: { fontSize: 11, fontWeight: 600, borderRadius: 7, padding: '3px 10px' },
  dateSmall: { display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 12 },
  patientRow: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: '50%',
    background: 'rgba(14,210,160,0.12)', border: '2px solid rgba(14,210,160,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, color: '#0ED2A0', flexShrink: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  patientName: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 15 },
  patientSub: { color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 },
  motif: { color: '#4B5563', fontSize: 13 },
  lienDisplay: {
    display: 'flex', alignItems: 'center', gap: 5,
    color: '#15803D', fontSize: 11, fontFamily: 'monospace',
    background: '#F0FDF4', borderRadius: 7, padding: '5px 10px',
    overflow: 'hidden',
  },
  cardActions: { display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #E5E7EB', marginTop: 2 },
  joinBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#16A34A',
    color: '#FFFFFF', border: '1px solid #15803D', borderRadius: 9, padding: '8px 16px',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  detailBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#F9FAFB', border: '1px solid #D1D5DB',
    color: '#4B5563', borderRadius: 9, padding: '8px 14px',
    fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 },
  pageBtn: {
    background: '#FFFFFF', border: '1px solid #D1D5DB',
    color: '#111827', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  pageInfo: { color: '#6B7280', fontSize: 13 },
  empty: { gridColumn: '1 / -1', textAlign: 'center', color: '#9CA3AF', padding: '50px 0', fontSize: 14 },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.32)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB', borderRadius: 24, padding: 28,
    width: '100%', maxWidth: 520, animation: 'slideUp 0.3s ease',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, margin: 0 },
  closeBtn: {
    background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151',
    borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: {
    background: '#FFFFFF', border: '1px solid #D1D5DB',
    borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: {
    background: '#F9FAFB', border: '1px solid #D1D5DB',
    color: '#4B5563', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  submitBtn: {
    background: '#16A34A',
    border: '1px solid #15803D', color: '#FFFFFF', borderRadius: 10, padding: '10px 22px',
    cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7,
    fontFamily: "'DM Sans', sans-serif",
  },
  detailBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  detailRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: '#F9FAFB',
    borderRadius: 10, border: '1px solid #E5E7EB',
  },
  detailLabel: { color: '#6B7280', fontSize: 13 },
  detailValue: { color: '#111827', fontSize: 13, fontWeight: 500 },
  detailLien: {
    display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px',
    background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0',
  },
  toast: {
    position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
    color: '#FFFFFF', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '12px 26px',
    zIndex: 9999, animation: 'toast 3s ease forwards',
    boxShadow: '0 8px 32px rgba(22,163,74,0.24)', fontFamily: "'DM Sans', sans-serif",
    display: 'flex', alignItems: 'center', gap: 8,
  },
  jitsiOverlay: {
    position: 'fixed', bottom: 20, right: 20, width: 700, height: 500,
    background: '#FFFFFF', border: '2px solid #BBF7D0', borderRadius: 20,
    zIndex: 2000, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.2)',
  },
  jitsiFullscreen: {
    inset: 0, width: '100%', height: '100%', borderRadius: 0, bottom: 0, right: 0,
  },
  jitsiHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', background: '#F0FDF4',
    borderBottom: '1px solid #BBF7D0', flexShrink: 0,
  },
  jitsiTitle: { display: 'flex', alignItems: 'center', gap: 8, color: '#0ED2A0', fontWeight: 700, fontSize: 14 },
  jitsiBtn: {
    background: '#FFFFFF', border: '1px solid #D1D5DB',
    color: '#374151', borderRadius: 6, width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  jitsiContainer: { flex: 1, minHeight: 0 },
};
