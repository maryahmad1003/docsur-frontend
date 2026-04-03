import React, { useEffect, useState } from 'react';
import {
  FiCalendar, FiPlus, FiClock, FiX, FiCheck,
  FiMapPin, FiSearch
} from 'react-icons/fi';
import { getRendezVousMedecin } from '../../api/medecinAPI';
import { normalizeCollection } from '../../utils/apiData';

const TODAY = new Date().toISOString().slice(0, 10);

// ─── STATUT CONFIG ────────────────────────────────────────────────────────────
const STATUT = {
  confirme:   { label: 'Confirmé',   color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
  en_attente: { label: 'En attente', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  annule:     { label: 'Annulé',     color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
};

// ─── TYPE CONFIG ──────────────────────────────────────────────────────────────
const TYPE = {
  consultation:      { label: 'Consultation', color: '#38BDF8' },
  suivi:             { label: 'Suivi', color: '#16A34A' },
  urgence:           { label: 'Urgence', color: '#F87171' },
  presentiel:       { label: 'Présentiel',      color: '#38BDF8' },
  teleconsultation: { label: 'Téléconsultation', color: '#A78BFA' },
};

// ─── FILTERS ──────────────────────────────────────────────────────────────────
const FILTER_TABS = ['Tous', 'Confirmés', 'En attente', 'Annulés'];
const FILTER_MAP  = { 'Tous': null, 'Confirmés': 'confirme', 'En attente': 'en_attente', 'Annulés': 'annule' };

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function RendezVousPage() {
  const [rdvList, setRdvList]         = useState([]);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState({
    nom: '', prenom: '', date: '', heure: '', motif: '', lieu: '', type: 'presentiel'
  });

  useEffect(() => {
    getRendezVousMedecin()
      .then((response) => setRdvList(normalizeCollection(response).map((rdv) => ({
        id: rdv.id,
        patient: {
          nom: rdv.patient?.nom || rdv.patient?.user?.nom || '',
          prenom: rdv.patient?.prenom || rdv.patient?.user?.prenom || '',
        },
        date: rdv.date || rdv.date_heure?.slice(0, 10) || '',
        heure: rdv.heure || rdv.date_heure?.slice(11, 16) || '',
        motif: rdv.motif || '',
        lieu: rdv.lieu || 'Cabinet',
        statut: rdv.statut || 'en_attente',
        type: rdv.type || 'presentiel',
      }))))
      .catch(() => setRdvList([]));
  }, []);

  // ── KPIs ──
  const kpiTotal     = rdvList.length;
  const kpiAujourd   = rdvList.filter(r => r.date === TODAY).length;
  const kpiConfirme  = rdvList.filter(r => r.statut === 'confirme').length;
  const kpiAttente   = rdvList.filter(r => r.statut === 'en_attente').length;

  // ── Filtered list ──
  const statutFilter = FILTER_MAP[activeFilter];
  const filtered = rdvList.filter(r => {
    const matchStatut = !statutFilter || r.statut === statutFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || r.patient.nom.toLowerCase().includes(q) || r.patient.prenom.toLowerCase().includes(q) || r.motif.toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  // ── Today's agenda ──
  const todayRdv = rdvList
    .filter(r => r.date === TODAY)
    .sort((a, b) => a.heure.localeCompare(b.heure));

  // ── Actions ──
  const handleConfirm = () => {};
  const handleCancel  = () => {};

  const handleCreate = (e) => {
    e.preventDefault();
    setForm({ nom: '', prenom: '', date: '', heure: '', motif: '', lieu: '', type: 'presentiel' });
    setShowModal(false);
  };

  const initials = (p) => `${p.prenom[0]}${p.nom[0]}`.toUpperCase();

  return (
    <div style={styles.page}>
      <style>{keyframes}</style>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rendez-vous</h1>
          <p style={styles.subtitle}>Gérez votre planning de consultations</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <FiPlus size={18} /> Nouveau RDV
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={styles.kpiGrid}>
        <KpiCard icon={<FiCalendar size={20}/>} label="Total RDV"    value={kpiTotal}    color="#A78BFA" />
        <KpiCard icon={<FiCalendar size={20}/>} label="Aujourd'hui"  value={kpiAujourd}  color="#38BDF8" />
        <KpiCard icon={<FiCheck    size={20}/>} label="Confirmés"    value={kpiConfirme} color="#0ED2A0" />
        <KpiCard icon={<FiClock    size={20}/>} label="En attente"   value={kpiAttente}  color="#FBBF24" />
      </div>

      {/* ── Body: 60/40 ── */}
      <div style={styles.body}>

        {/* ── LEFT: list ── */}
        <div style={styles.left}>
          {/* Filter + search */}
          <div style={styles.toolbar}>
            <div style={styles.tabs}>
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  style={{ ...styles.tab, ...(activeFilter === tab ? styles.tabActive : {}) }}
                  onClick={() => setActiveFilter(tab)}
                >{tab}</button>
              ))}
            </div>
            <div style={styles.searchWrap}>
              <FiSearch size={15} color="#9CA3AF" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
              <input
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Cards */}
          <div>
            {filtered.length === 0 ? (
              <div style={styles.empty}>Aucun rendez-vous trouvé</div>
            ) : (
              filtered.map((rdv, idx) => (
                <RdvCard
                  key={rdv.id}
                  rdv={rdv}
                  idx={idx}
                  initials={initials}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Agenda du jour ── */}
        <div style={styles.right}>
          <div style={styles.agendaPanel}>
            <div style={styles.agendaHeader}>
              <FiCalendar size={16} color="#0ED2A0" />
              <span style={styles.agendaTitle}>Agenda du jour</span>
              <span style={styles.agendaDate}>{TODAY}</span>
            </div>
            {todayRdv.length === 0 ? (
              <div style={styles.agendaEmpty}>
                <span style={{ fontSize: 36 }}>📅</span>
                <p style={{ color: '#9CA3AF', marginTop: 10, fontSize: 14 }}>
                  Aucun rendez-vous aujourd'hui
                </p>
              </div>
            ) : (
              <div style={styles.timeline}>
                {todayRdv.map(rdv => (
                  <div key={rdv.id} style={styles.timelineItem}>
                    <div style={styles.timelineTime}>
                      <FiClock size={12} color="#0ED2A0" />
                      <span style={styles.timelineHeure}>{rdv.heure}</span>
                    </div>
                    <div style={styles.timelineDot} />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelinePatient}>{rdv.patient.prenom} {rdv.patient.nom}</div>
                      <div style={styles.timelineMotif}>{rdv.motif}</div>
                      <span style={{ ...styles.badge, color: (STATUT[rdv.statut] || STATUT.en_attente).color, background: (STATUT[rdv.statut] || STATUT.en_attente).bg }}>
                        {(STATUT[rdv.statut] || STATUT.en_attente).label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Nouveau rendez-vous</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}><FiX size={18}/></button>
            </div>
            <form onSubmit={handleCreate} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Prénom patient</label>
                  <input style={styles.input} required value={form.prenom} onChange={e => setForm(f=>({...f,prenom:e.target.value}))} placeholder="Prénom" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom patient</label>
                  <input style={styles.input} required value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="Nom" />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date</label>
                  <input style={styles.input} type="date" required value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Heure</label>
                  <input style={styles.input} type="time" required value={form.heure} onChange={e => setForm(f=>({...f,heure:e.target.value}))} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Motif</label>
                <input style={styles.input} required value={form.motif} onChange={e => setForm(f=>({...f,motif:e.target.value}))} placeholder="Motif de consultation" />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lieu</label>
                  <input style={styles.input} value={form.lieu} onChange={e => setForm(f=>({...f,lieu:e.target.value}))} placeholder="Cabinet" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Type</label>
                  <select style={styles.input} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                    <option value="presentiel">Présentiel</option>
                    <option value="teleconsultation">Téléconsultation</option>
                  </select>
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.submitBtn}><FiCheck size={15}/> Créer le RDV</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RDV CARD ─────────────────────────────────────────────────────────────────
function RdvCard({ rdv, idx, initials, onConfirm, onCancel }) {
  const s = STATUT[rdv.statut] || STATUT.en_attente;
  const t = TYPE[rdv.type] || { label: rdv.type || 'Rendez-vous', color: '#6B7280' };
  return (
    <div style={{
      ...styles.card,
      borderLeft: `3px solid ${s.color}`,
      animationDelay: `${idx * 0.06}s`,
    }}>
      {/* Avatar */}
      <div style={{ ...styles.avatar, borderColor: s.color }}>
        {initials(rdv.patient)}
      </div>

      {/* Main info */}
      <div style={{ flex: 1 }}>
        <div style={styles.cardTop}>
          <span style={styles.patientName}>{rdv.patient.prenom} {rdv.patient.nom}</span>
          <div style={styles.badgeRow}>
            <span style={{ ...styles.badge, color: t.color, background: `${t.color}18` }}>{t.label}</span>
            <span style={{ ...styles.badge, color: s.color, background: s.bg }}>{s.label}</span>
          </div>
        </div>
        <div style={styles.cardMeta}>
          <span style={styles.metaItem}><FiCalendar size={12}/> {rdv.date}</span>
          <span style={styles.metaItem}><FiClock size={12}/> {rdv.heure}</span>
          <span style={styles.metaItem}><FiMapPin size={12}/> {rdv.lieu}</span>
        </div>
        <div style={styles.motif}>{rdv.motif}</div>
      </div>

      {/* Actions (en_attente only) */}
      {rdv.statut === 'en_attente' && (
        <div style={styles.cardActions}>
          <button style={styles.confirmBtn} title="Confirmer" onClick={() => onConfirm(rdv.id)}><FiCheck size={14}/></button>
          <button style={styles.rejectBtn}  title="Annuler"   onClick={() => onCancel(rdv.id)}><FiX size={14}/></button>
        </div>
      )}
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiIcon, color, background: `${color}18` }}>{icon}</div>
      <div>
        <div style={{ ...styles.kpiValue, color }}>{value}</div>
        <div style={styles.kpiLabel}>{label}</div>
      </div>
    </div>
  );
}

// ─── KEYFRAMES ────────────────────────────────────────────────────────────────
const keyframes = `
  @keyframes fadeIn  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  title: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    margin: '6px 0 0',
    fontSize: 14,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#16A34A',
    color: '#FFFFFF',
    border: '1px solid #15803D',
    borderRadius: 12,
    padding: '10px 20px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 28,
  },
  kpiCard: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 16,
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
  },
  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiValue: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 2,
  },
  kpiLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  body: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
  },
  left: {
    flex: '0 0 60%',
    maxWidth: '60%',
  },
  right: {
    flex: '0 0 calc(40% - 20px)',
    maxWidth: 'calc(40% - 20px)',
  },
  toolbar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    border: '1px solid #E5E7EB',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#F0FDF4',
    color: '#16A34A',
    fontWeight: 700,
  },
  searchWrap: {
    position: 'relative',
    flex: 1,
    minWidth: 160,
  },
  searchInput: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 10,
    padding: '8px 12px 8px 36px',
    color: '#111827',
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    animation: 'slideUp 0.4s ease both',
    position: 'relative',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(14,210,160,0.12)',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    color: '#0ED2A0',
    flexShrink: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  patientName: {
    fontWeight: 600,
    fontSize: 15,
    fontFamily: "'Outfit', sans-serif",
  },
  badgeRow: {
    display: 'flex',
    gap: 6,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    padding: '3px 9px',
    display: 'inline-block',
  },
  cardMeta: {
    display: 'flex',
    gap: 14,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#6B7280',
    fontSize: 12,
  },
  motif: {
    color: '#4B5563',
    fontSize: 13,
    marginTop: 2,
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flexShrink: 0,
  },
  confirmBtn: {
    background: 'rgba(14,210,160,0.15)',
    border: '1px solid rgba(14,210,160,0.3)',
    color: '#0ED2A0',
    borderRadius: 8,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  rejectBtn: {
    background: 'rgba(248,113,113,0.12)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: '#F87171',
    borderRadius: 8,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: '40px 0',
    fontSize: 14,
  },
  agendaPanel: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 20,
    padding: 22,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
    minHeight: 320,
  },
  agendaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 14,
  },
  agendaTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    flex: 1,
  },
  agendaDate: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  agendaEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    textAlign: 'center',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 16,
    position: 'relative',
  },
  timelineTime: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 42,
    paddingTop: 2,
  },
  timelineHeure: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: '#0ED2A0',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#0ED2A0',
    flexShrink: 0,
    marginTop: 5,
    boxShadow: '0 0 8px rgba(14,210,160,0.35)',
  },
  timelineContent: {
    flex: 1,
    background: '#F0FDF4',
    borderRadius: 10,
    padding: '10px 14px',
    border: '1px solid #BBF7D0',
  },
  timelinePatient: {
    fontWeight: 600,
    fontSize: 13,
    fontFamily: "'Outfit', sans-serif",
    marginBottom: 2,
  },
  timelineMotif: {
    color: '#4B5563',
    fontSize: 12,
    marginBottom: 6,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(17,24,39,0.32)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 520,
    animation: 'slideUp 0.3s ease',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  modalTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  closeBtn: {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    color: '#374151',
    borderRadius: 8,
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  formRow: {
    display: 'flex',
    gap: 14,
  },
  formGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#111827',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    background: '#F9FAFB',
    border: '1px solid #D1D5DB',
    color: '#4B5563',
    borderRadius: 10,
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  submitBtn: {
    background: '#16A34A',
    border: '1px solid #15803D',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: '10px 22px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontFamily: "'DM Sans', sans-serif",
  },
};
