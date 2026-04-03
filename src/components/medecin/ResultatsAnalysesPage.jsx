import React, { useState, useEffect } from 'react';
import {
  FiActivity, FiPlus, FiSearch, FiEye, FiX,
  FiCheckCircle, FiClock, FiAlertCircle, FiSend
} from 'react-icons/fi';
import { getDemandesAnalyses, creerDemandeAnalyse } from '../../api/medecinAPI';
import { formatGeneratedRef, normalizeCollection } from '../../utils/apiData';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const STATUT = {
  en_attente:          { label: 'En attente',          color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',   icon: FiClock        },
  en_cours:            { label: 'En cours',            color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',   icon: FiActivity     },
  resultat_disponible: { label: 'Résultat disponible', color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)',   icon: FiCheckCircle  },
};

const PRIORITE = {
  urgente: { label: 'Urgente', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  normale: { label: 'Normale', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)'  },
};

const FILTER_TABS = [
  { key: 'tous',               label: 'Toutes'               },
  { key: 'en_attente',         label: 'En attente'           },
  { key: 'en_cours',           label: 'En cours'             },
  { key: 'resultat_disponible', label: 'Résultats disponibles' },
];

function normalizeDemande(demande) {
  const statut = demande.resultat ? 'resultat_disponible' : (demande.statut === 'envoyee' ? 'en_attente' : demande.statut);
  return {
    id: demande.id,
    ref: demande.ref || formatGeneratedRef('DA', demande.id),
    patient: {
      nom: demande.patient?.nom || demande.patient?.user?.nom || '',
      prenom: demande.patient?.prenom || demande.patient?.user?.prenom || '',
    },
    type_analyse: demande.type_analyse,
    priorite: demande.priorite || (demande.urgence ? 'urgente' : 'normale'),
    statut: statut || 'en_attente',
    date_demande: demande.date_demande || demande.created_at?.slice(0, 10),
    resultat: demande.resultat || null,
    notes: demande.notes || '',
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function ResultatsAnalysesPage() {
  const [demandes, setDemandes]   = useState([]);
  const [search, setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast]           = useState('');
  const [form, setForm] = useState({ nom: '', prenom: '', type_analyse: '', priorite: 'normale', notes: '' });

  // ── Load ──
  useEffect(() => {
    (async () => {
      try {
        const data = await getDemandesAnalyses();
        setDemandes(normalizeCollection(data).map(normalizeDemande));
      } catch {
        setDemandes([]);
      }
    })();
  }, []);

  // ── KPIs ──
  const kpiTotal    = demandes.length;
  const kpiAttente  = demandes.filter(d => d.statut === 'en_attente').length;
  const kpiEnCours  = demandes.filter(d => d.statut === 'en_cours').length;
  const kpiResultat = demandes.filter(d => d.statut === 'resultat_disponible').length;

  // ── Filtered ──
  const filtered = demandes.filter(d => {
    const matchFilter = activeFilter === 'tous' || d.statut === activeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.patient.nom.toLowerCase().includes(q) ||
      d.patient.prenom.toLowerCase().includes(q) ||
      d.type_analyse.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // ── Toast helper ──
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  // ── Create ──
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await creerDemandeAnalyse({
        nom: form.nom,
        prenom: form.prenom,
        type_analyse: form.type_analyse,
        priorite: form.priorite,
        notes: form.notes,
      });
      showToast('Demande créée');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Création impossible sans patient et laboratoire réels');
      return;
    }
    setForm({ nom: '', prenom: '', type_analyse: '', priorite: 'normale', notes: '' });
    setShowModal(false);
  };

  return (
    <div style={styles.page}>
      <style>{keyframes}</style>

      {/* ── Toast ── */}
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Résultats d'analyses</h1>
          <p style={styles.subtitle}>Suivi des demandes et résultats laboratoire</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <FiPlus size={18} /> Nouvelle demande
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={styles.kpiGrid}>
        <KpiCard icon={<FiActivity size={20}/>}    label="Total demandes"       value={kpiTotal}    color="#FBBF24" />
        <KpiCard icon={<FiClock size={20}/>}        label="En attente"           value={kpiAttente}  color="#FBBF24" />
        <KpiCard icon={<FiActivity size={20}/>}     label="En cours"             value={kpiEnCours}  color="#38BDF8" />
        <KpiCard icon={<FiCheckCircle size={20}/>}  label="Résultats disponibles" value={kpiResultat} color="#0ED2A0" />
      </div>

      {/* ── Toolbar ── */}
      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              style={{ ...styles.tab, ...(activeFilter === tab.key ? styles.tabActive : {}) }}
              onClick={() => setActiveFilter(tab.key)}
            >{tab.label}</button>
          ))}
        </div>
        <div style={styles.searchWrap}>
          <FiSearch size={14} color="#9CA3AF" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
          <input
            style={styles.searchInput}
            placeholder="Rechercher patient ou type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Réf', 'Patient', 'Type analyse', 'Priorité', 'Statut', 'Date demande', 'Actions'].map(col => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.emptyCell}>Aucune demande trouvée</td>
              </tr>
            ) : (
              filtered.map((d, idx) => {
                const s = STATUT[d.statut];
                const p = PRIORITE[d.priorite];
                const StatutIcon = s.icon;
                return (
                  <tr key={d.id} style={{ ...styles.tr, animationDelay: `${idx * 0.05}s` }}>
                    <td style={styles.td}>
                      <span style={styles.refBadge}>{d.ref}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.patientCell}>
                        <div style={styles.avatar}>{d.patient.prenom[0]}{d.patient.nom[0]}</div>
                        <span style={styles.patientName}>{d.patient.prenom} {d.patient.nom}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.typeText}>{d.type_analyse}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color: p.color, background: p.bg }}>
                        {d.priorite === 'urgente' && <FiAlertCircle size={10} style={{ marginRight:3 }} />}
                        {p.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, color: s.color, background: s.bg, display:'inline-flex', alignItems:'center', gap:5 }}>
                        <StatutIcon size={11}/> {s.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{d.date_demande}</span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.eyeBtn} onClick={() => setDetailItem(d)} title="Voir détails">
                        <FiEye size={15}/>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detail Modal ── */}
      {detailItem && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.refBadgeLg}>{detailItem.ref}</span>
                <h2 style={styles.modalTitle}>{detailItem.type_analyse}</h2>
              </div>
              <button style={styles.closeBtn} onClick={() => setDetailItem(null)}><FiX size={18}/></button>
            </div>

            {/* Info rows */}
            <div style={styles.detailGrid}>
              <DetailRow label="Patient"       value={`${detailItem.patient.prenom} ${detailItem.patient.nom}`} />
              <DetailRow label="Priorité"      value={<span style={{ color: PRIORITE[detailItem.priorite].color }}>{PRIORITE[detailItem.priorite].label}</span>} />
              <DetailRow label="Statut"        value={<span style={{ color: STATUT[detailItem.statut].color }}>{STATUT[detailItem.statut].label}</span>} />
              <DetailRow label="Date demande"  value={detailItem.date_demande} />
            </div>

            {/* Résultat section */}
            <div style={styles.resultatSection}>
              <div style={styles.resultatTitle}>
                <FiActivity size={15} color={detailItem.resultat ? '#0ED2A0' : '#FBBF24'} />
                Résultat
              </div>
              {detailItem.resultat ? (
                <div style={styles.resultatBox}>
                  <div style={styles.resultatRow}>
                    <span style={styles.resultatLabel}>Valeurs</span>
                    <span style={styles.resultatValue}>{detailItem.resultat.valeurs}</span>
                  </div>
                  <div style={styles.resultatRow}>
                    <span style={styles.resultatLabel}>Interprétation</span>
                    <span style={styles.resultatValue}>{detailItem.resultat.interpretation}</span>
                  </div>
                  <div style={styles.resultatRow}>
                    <span style={styles.resultatLabel}>Date résultat</span>
                    <span style={styles.resultatValue}>{detailItem.resultat.date_resultat}</span>
                  </div>
                </div>
              ) : (
                <div style={styles.noResultat}>
                  <FiClock size={22} color="rgba(251,191,36,0.6)" />
                  <p style={styles.noResultatText}>En attente du laboratoire</p>
                  <p style={styles.noResultatSub}>Le résultat sera disponible dès que le laboratoire l'aura transmis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Nouvelle demande d'analyse</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}><FiX size={18}/></button>
            </div>
            <form onSubmit={handleCreate} style={styles.modalForm}>
              <div style={styles.formRow}>
                <FormGroup label="Prénom patient">
                  <input style={styles.input} required value={form.prenom} onChange={e => setForm(f=>({...f,prenom:e.target.value}))} placeholder="Prénom" />
                </FormGroup>
                <FormGroup label="Nom patient">
                  <input style={styles.input} required value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="Nom" />
                </FormGroup>
              </div>
              <FormGroup label="Type d'analyse">
                <input style={styles.input} required value={form.type_analyse} onChange={e => setForm(f=>({...f,type_analyse:e.target.value}))} placeholder="Ex: Numération Formule Sanguine" />
              </FormGroup>
              <FormGroup label="Priorité">
                <select style={styles.input} value={form.priorite} onChange={e => setForm(f=>({...f,priorite:e.target.value}))}>
                  <option value="normale">Normale</option>
                  <option value="urgente">Urgente</option>
                </select>
              </FormGroup>
              <FormGroup label="Notes (optionnel)">
                <textarea
                  style={{ ...styles.input, resize:'vertical', minHeight:80 }}
                  value={form.notes}
                  onChange={e => setForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Instructions ou informations complémentaires..."
                />
              </FormGroup>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.submitBtn}><FiSend size={14}/> Envoyer la demande</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
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
  @keyframes toast   { 0% { opacity:0; transform:translateX(-50%) translateY(20px); } 10%,85% { opacity:1; transform:translateX(-50%) translateY(0); } 100% { opacity:0; } }
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
    marginBottom: 24,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiValue: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 2,
  },
  kpiLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  toolbar: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    marginBottom: 20,
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
    flexShrink: 0,
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
    whiteSpace: 'nowrap',
  },
  tabActive: {
    background: '#F0FDF4',
    color: '#16A34A',
    fontWeight: 700,
  },
  searchWrap: {
    position: 'relative',
    flex: 1,
    minWidth: 200,
    maxWidth: 360,
  },
  searchInput: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 10,
    padding: '9px 12px 9px 36px',
    color: '#111827',
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  },
  tableWrap: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '13px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#6B7280',
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    fontFamily: "'DM Sans', sans-serif",
  },
  tr: {
    borderBottom: '1px solid #E5E7EB',
    animation: 'slideUp 0.4s ease both',
    transition: 'background 0.15s',
  },
  td: {
    padding: '13px 16px',
    fontSize: 13,
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
  },
  refBadge: {
    background: 'rgba(167,139,250,0.15)',
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 7,
    padding: '3px 10px',
    letterSpacing: '0.04em',
    fontFamily: 'monospace',
  },
  refBadgeLg: {
    background: 'rgba(167,139,250,0.15)',
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 7,
    padding: '4px 12px',
    letterSpacing: '0.04em',
    fontFamily: 'monospace',
    display: 'inline-block',
    marginBottom: 6,
  },
  patientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(14,210,160,0.12)',
    border: '1px solid rgba(14,210,160,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 12,
    color: '#0ED2A0',
    flexShrink: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  patientName: {
    fontWeight: 600,
    fontSize: 13,
  },
  typeText: {
    color: '#1F2937',
    fontSize: 13,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    padding: '4px 10px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  dateText: {
    color: '#6B7280',
    fontSize: 13,
  },
  eyeBtn: {
    background: 'rgba(14,210,160,0.1)',
    border: '1px solid rgba(14,210,160,0.2)',
    color: '#0ED2A0',
    borderRadius: 8,
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
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
    maxWidth: 540,
    animation: 'slideUp 0.3s ease',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    flexShrink: 0,
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#F9FAFB',
    borderRadius: 10,
    border: '1px solid #E5E7EB',
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 13,
  },
  detailValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 500,
  },
  resultatSection: {
    border: '1px solid #E5E7EB',
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultatTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
  },
  resultatBox: {
    background: '#F0FDF4',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  resultatRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  resultatLabel: {
    color: 'rgba(14,210,160,0.7)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  resultatValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 500,
  },
  noResultat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 20px',
    textAlign: 'center',
    gap: 8,
  },
  noResultatText: {
    color: 'rgba(251,191,36,0.8)',
    fontWeight: 600,
    margin: 0,
    fontSize: 14,
  },
  noResultatSub: {
    color: '#6B7280',
    fontSize: 12,
    margin: 0,
    maxWidth: 300,
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
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
    marginTop: 4,
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
  toast: {
    position: 'fixed',
    bottom: 30,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#16A34A',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 14,
    borderRadius: 12,
    padding: '12px 26px',
    zIndex: 9999,
    animation: 'toast 2.8s ease forwards',
    boxShadow: '0 8px 32px rgba(22,163,74,0.24)',
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap',
  },
};
