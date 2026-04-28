import React, { useState, useEffect, useCallback } from 'react';
import {
  FiClipboard, FiSearch, FiPlus, FiEye, FiEdit3, FiTrash2,
  FiX, FiUser, FiCalendar, FiFileText, FiMic
} from 'react-icons/fi';
import { getConsultations, creerConsultation, supprimerConsultation, getPatients } from '../../api/medecinAPI';
import { formatGeneratedRef, normalizeCollection, normalizeItem } from '../../utils/apiData';
import VoiceInput from './VoiceInput';

const STATUT_MAP = {
  planifiee: { label: 'Planifiée', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  en_cours:  { label: 'En cours',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  terminee:  { label: 'Terminée',  color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
};

const FILTER_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'planifiee', label: 'Planifiées' },
  { key: 'en_cours',  label: 'En cours' },
  { key: 'terminee',  label: 'Terminées' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncate(str, n) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function normalizeConsultation(consultation) {
  return {
    id: consultation.id,
    ref: consultation.ref || formatGeneratedRef('CONS', consultation.id),
    patient: {
      nom: consultation.patient?.nom || consultation.dossierMedical?.patient?.user?.nom || '',
      prenom: consultation.patient?.prenom || consultation.dossierMedical?.patient?.user?.prenom || '',
    },
    date_consultation: consultation.date_consultation || consultation.date,
    motif: consultation.motif || '',
    diagnostic: consultation.diagnostic || '—',
    traitement: consultation.traitement || consultation.recommandations || consultation.notes || '—',
    statut: consultation.statut || 'terminee',
    created_at: consultation.created_at,
  };
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState('all');
  const [selected, setSelected]           = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [deleteId, setDeleteId]           = useState(null);
  const [toast, setToast]                 = useState(null);
  const [form, setForm]                   = useState({ patient_id: '', date_consultation: '', motif: '', notes: '' });
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [consultationsRes, patientsRes] = await Promise.all([getConsultations(), getPatients()]);
        setConsultations(normalizeCollection(consultationsRes).map(normalizeConsultation));
        setPatients(normalizeCollection(patientsRes));
      } catch {
        setConsultations([]);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const filtered = consultations.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = (
      c.patient?.nom?.toLowerCase().includes(q) ||
      c.patient?.prenom?.toLowerCase().includes(q) ||
      c.ref?.toLowerCase().includes(q) ||
      c.motif?.toLowerCase().includes(q)
    );
    const matchTab = activeTab === 'all' || c.statut === activeTab;
    return matchSearch && matchTab;
  });

  const kpis = [
    { label: 'Total', value: consultations.length, color: '#111827', bg: '#F3F4F6' },
    { label: 'Planifiées', value: consultations.filter(c => c.statut === 'planifiee').length, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    { label: 'En cours',   value: consultations.filter(c => c.statut === 'en_cours').length,  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
    { label: 'Terminées',  value: consultations.filter(c => c.statut === 'terminee').length,  color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
  ];

  const selectedPatient = patients.find((patient) => String(patient.id) === String(form.patient_id));

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    let created = false;
    const payload = {
      patient_id: Number(form.patient_id),
      date_consultation: form.date_consultation,
      motif: form.motif,
      notes: form.notes,
    };
    try {
      const res = await creerConsultation(payload);
      const createdConsultation = normalizeConsultation(normalizeItem(res, 'consultation'));
      setConsultations(prev => [createdConsultation, ...prev]);
      created = true;
      showToast('Consultation créée avec succès');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Création impossible', 'error');
      setSubmitting(false);
      return;
    } finally {
      setSubmitting(false);
      if (created) {
        setShowCreate(false);
        setForm({ patient_id: '', date_consultation: '', motif: '', notes: '' });
      }
    }
  }

  async function handleDelete(id) {
    try {
      await supprimerConsultation(id);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Suppression impossible', 'error');
      return;
    }
    setConsultations(prev => prev.filter(c => c.id !== id));
    setDeleteId(null);
    showToast('Consultation supprimée');
  }

  return (
    <div style={pageStyle}>
      <style>{keyframesCSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{ ...toastStyle, background: toast.type === 'success' ? 'rgba(14,210,160,0.18)' : 'rgba(248,113,113,0.18)', borderColor: toast.type === 'success' ? 'rgba(14,210,160,0.35)' : 'rgba(248,113,113,0.35)' }}>
          <span style={{ color: toast.type === 'success' ? '#0ED2A0' : '#F87171', fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={headerRow}>
        <div>
          <h1 style={titleStyle}>Consultations</h1>
          <p style={subtitleStyle}>{consultations.length} consultation{consultations.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button style={addBtn} onClick={() => setShowCreate(true)}>
          <FiPlus size={16} /> Nouvelle consultation
        </button>
      </div>

      {/* KPIs */}
      <div style={kpiGrid}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...kpiCard, animationDelay: `${i * 80}ms` }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: k.color, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={toolbarRow}>
        <div style={searchWrap}>
          <FiSearch size={15} color="#9CA3AF" />
          <input style={searchInput} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={clearBtn}><FiX size={13} /></button>}
        </div>
        <div style={tabsRow}>
          {FILTER_TABS.map(t => (
            <button key={t.key} style={activeTab === t.key ? activeTabBtn : tabBtn} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={tableCard}>
        {loading ? (
          <div style={emptyState}><div style={spinner} /><p style={{ color: '#6B7280', marginTop: 16, fontSize: 13 }}>Chargement…</p></div>
        ) : filtered.length === 0 ? (
          <div style={emptyState}><FiClipboard size={40} color="#D1D5DB" /><p style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Aucune consultation</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Réf','Patient','Date','Motif','Statut','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const s = STATUT_MAP[c.statut] || STATUT_MAP.planifiee;
                return (
                  <tr key={c.id} style={{ ...trStyle, animationDelay: `${idx * 50}ms` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}><span style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.3px' }}>{c.ref}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={avatarSm}>{((c.patient?.prenom || '')[0] || '') + ((c.patient?.nom || '')[0] || '')}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.patient?.prenom} {c.patient?.nom}</span>
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: 13, color: '#4B5563' }}>{formatDate(c.date_consultation)}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 13, color: '#4B5563' }}>{truncate(c.motif, 30)}</span></td>
                    <td style={tdStyle}><span style={{ ...badge, color: s.color, background: s.bg }}>{s.label}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={iconBtn} onClick={() => setSelected(c)} title="Voir"><FiEye size={14} /></button>
                        <button style={{ ...iconBtn, color: '#F87171', borderColor: 'rgba(248,113,113,0.2)' }} onClick={() => setDeleteId(c.id)} title="Supprimer"><FiTrash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={overlay} onClick={() => setSelected(null)}>
          <div style={{ ...modal, animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ ...titleStyle, fontSize: 20 }}>Détail consultation</h2>
                <p style={subtitleStyle}>{selected.ref}</p>
              </div>
              <button style={closeBtn} onClick={() => setSelected(null)}><FiX size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <DetailBox label="Patient" value={`${selected.patient?.prenom} ${selected.patient?.nom}`} />
              <DetailBox label="Date" value={formatDate(selected.date_consultation)} />
              <DetailBox label="Statut" value={STATUT_MAP[selected.statut]?.label || selected.statut} />
              <DetailBox label="Créée le" value={formatDate(selected.created_at)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <DetailBox label="Motif" value={selected.motif} full />
            </div>
            <div style={{ marginBottom: 12 }}>
              <DetailBox label="Diagnostic" value={selected.diagnostic} full />
            </div>
            <div>
              <DetailBox label="Traitement" value={selected.traitement} full />
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={overlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...modal, animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ ...titleStyle, fontSize: 20 }}>Nouvelle consultation</h2>
              <button style={closeBtn} onClick={() => setShowCreate(false)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Patient</label>
                  <div style={inputWrap}>
                    <FiUser size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
                    <select
                      style={inputStyle}
                      value={form.patient_id}
                      onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                      required
                    >
                      <option value="">Selectionner un patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {(patient.ref || patient.num_dossier || 'Sans numero')} - {(patient.prenom || patient.user?.prenom || '')} {(patient.nom || patient.user?.nom || '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Date de consultation</label>
                  <div style={inputWrap}>
                    <FiCalendar size={14} color="#9CA3AF" />
                    <input
                      style={{ ...inputStyle, colorScheme: 'light' }}
                      type="date"
                      value={form.date_consultation}
                      onChange={e => setForm(f => ({ ...f, date_consultation: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>
              {selectedPatient && (
                <div style={selectedPatientCardStyle}>
                  <div style={selectedPatientTitleStyle}>Patient selectionne</div>
                  <div style={selectedPatientTextStyle}>
                    {(selectedPatient.ref || selectedPatient.num_dossier || 'Sans numero')} · {(selectedPatient.prenom || selectedPatient.user?.prenom || '')} {(selectedPatient.nom || selectedPatient.user?.nom || '')}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Motif de consultation</label>
                <div style={inputWrap}>
                  <FiFileText size={14} color="#9CA3AF" />
                  <input style={inputStyle} placeholder="Motif principal…" value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} required />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Notes / Observations</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    style={{ ...inputStyle, width: '100%', minHeight: 90, padding: '10px 14px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 10, resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Notes additionnelles…"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                  <div style={{ position: 'absolute', right: 10, bottom: 10 }}>
                    <VoiceInput
                      onTranscript={(text) => setForm(f => ({ ...f, notes: f.notes + ' ' + text }))}
                      compact
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" style={cancelBtn} onClick={() => setShowCreate(false)}>Annuler</button>
                <button type="submit" style={submitBtn} disabled={submitting}>
                  {submitting ? <div style={{ ...spinner, width: 16, height: 16, borderWidth: 2 }} /> : <FiPlus size={14} />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={overlay} onClick={() => setDeleteId(null)}>
          <div style={{ ...modal, maxWidth: 400, textAlign: 'center', animation: 'slideUp 0.2s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FiTrash2 size={22} color="#F87171" />
            </div>
            <h3 style={{ ...titleStyle, fontSize: 18, marginBottom: 8 }}>Supprimer la consultation ?</h3>
            <p style={{ ...subtitleStyle, marginBottom: 28 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={cancelBtn} onClick={() => setDeleteId(null)}>Annuler</button>
              <button style={{ ...submitBtn, background: 'linear-gradient(135deg,#F87171,#EF4444)' }} onClick={() => handleDelete(deleteId)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBox({ label, value, full }) {
  return (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const keyframesCSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
`;

const pageStyle = {
  fontFamily: "'DM Sans',sans-serif",
  minHeight: '100vh',
  padding: '32px 28px',
  background: '#F6FBF8',
  color: '#111827',
  animation: 'fadeIn 0.4s ease',
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 28,
};

const titleStyle = {
  fontFamily: "'Outfit',sans-serif",
  fontSize: 26,
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.5px',
  margin: 0,
};

const subtitleStyle = {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 4,
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 24,
};

const kpiCard = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: '20px 22px',
  animation: 'slideUp 0.35s ease both',
};

const toolbarRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  flexWrap: 'wrap',
};

const searchWrap = {
  flex: 1,
  minWidth: 200,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: 10,
  padding: '10px 14px',
};

const searchInput = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#111827',
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: 'none',
};

const clearBtn = {
  background: 'transparent',
  border: 'none',
  color: '#9CA3AF',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const tabsRow = {
  display: 'flex',
  gap: 6,
};

const tabBtn = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  background: 'transparent',
  color: '#6B7280',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'DM Sans',sans-serif",
  transition: 'all 0.15s',
};

const activeTabBtn = {
  ...tabBtn,
  background: 'rgba(14,210,160,0.12)',
  border: '1px solid rgba(14,210,160,0.3)',
  color: '#0ED2A0',
};

const addBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 20px',
  background: '#16A34A',
  border: '1px solid #15803D',
  borderRadius: 12,
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: "'Outfit',sans-serif",
};

const tableCard = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 20,
  overflow: 'hidden',
};

const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  borderBottom: '1px solid #E5E7EB',
  background: '#F9FAFB',
};

const tdStyle = {
  padding: '14px 16px',
  borderBottom: '1px solid #E5E7EB',
};

const trStyle = {
  transition: 'background 0.15s',
  animation: 'fadeIn 0.3s ease both',
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
};

const avatarSm = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: 'linear-gradient(135deg,#16A34A,#15803D)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 800,
  color: '#FFFFFF',
  flexShrink: 0,
  fontFamily: "'Outfit',sans-serif",
  textTransform: 'uppercase',
};

const iconBtn = {
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  background: '#F9FAFB',
  color: '#4B5563',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.32)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};

const modal = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 24,
  padding: 32,
  width: '100%',
  maxWidth: 640,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
};

const closeBtn = {
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  color: '#4B5563',
  cursor: 'pointer',
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
};

const inputWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: 10,
  padding: '10px 14px',
};

const inputStyle = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#111827',
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 8,
};

const selectedPatientCardStyle = {
  marginBottom: 16,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(14,210,160,0.2)',
  background: 'rgba(14,210,160,0.08)',
};

const selectedPatientTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#15803D',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 4,
};

const selectedPatientTextStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
};

const submitBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 24px',
  borderRadius: 10,
  border: '1px solid #15803D',
  background: '#16A34A',
  color: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'Outfit',sans-serif",
};

const cancelBtn = {
  padding: '10px 20px',
  borderRadius: 10,
  border: '1px solid #D1D5DB',
  background: '#F9FAFB',
  color: '#4B5563',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const emptyState = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 180,
};

const spinner = {
  width: 32,
  height: 32,
  border: '3px solid rgba(14,210,160,0.15)',
  borderTop: '3px solid #0ED2A0',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const toastStyle = {
  position: 'fixed',
  top: 24,
  right: 24,
  zIndex: 2000,
  padding: '12px 20px',
  borderRadius: 12,
  border: '1px solid',
  backdropFilter: 'blur(10px)',
  animation: 'toastIn 0.3s ease',
  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.18)',
};
