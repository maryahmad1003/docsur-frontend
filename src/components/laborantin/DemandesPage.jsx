import { useState, useEffect } from 'react';
import { FiClipboard, FiSearch, FiFilter, FiAlertCircle, FiClock, FiCheckCircle, FiEye, FiRefreshCw } from 'react-icons/fi';
import { getDemandes } from '../../api/laborantinAPI';
import { formatGeneratedRef, normalizeCollection } from '../../utils/apiData';

const STATUTS = ['Tous', 'En attente', 'En cours', 'Terminée'];
const PRIORITES = { urgente: { label: 'Urgente', color: '#F87171', bg: 'rgba(248,113,113,0.12)' }, normale: { label: 'Normale', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' } };
const STATUT_STYLE = {
  en_attente: { label: 'En attente', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', icon: <FiClock size={12} /> },
  en_cours:   { label: 'En cours',   color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', icon: <FiRefreshCw size={12} /> },
  termine:    { label: 'Terminée',   color: '#0ED2A0', bg: 'rgba(14,210,160,0.12)', icon: <FiCheckCircle size={12} /> },
};

const DemandesPage = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getDemandes()
      .then((res) => setDemandes(normalizeCollection(res).map((demande) => ({
        id: demande.id,
        ref: demande.ref || formatGeneratedRef('DA', demande.id),
        patient: {
          nom: demande.patient?.nom || demande.patient?.user?.nom || '',
          prenom: demande.patient?.prenom || demande.patient?.user?.prenom || '',
        },
        type_analyse: demande.type_analyse,
        statut: demande.statut === 'envoyee' ? 'en_attente' : demande.statut,
        priorite: demande.priorite || (demande.urgence ? 'urgente' : 'normale'),
        created_at: demande.created_at,
        medecin: demande.medecin?.user ? `Dr. ${demande.medecin.user.prenom} ${demande.medecin.user.nom}` : (demande.medecin || '—'),
      }))))
      .catch(() => setDemandes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = demandes.filter(d => {
    const matchSearch = !search || `${d.patient?.nom} ${d.patient?.prenom} ${d.ref} ${d.type_analyse}`.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filtreStatut === 'Tous' || (
      filtreStatut === 'En attente' ? d.statut === 'en_attente' :
      filtreStatut === 'En cours'   ? d.statut === 'en_cours'   :
      filtreStatut === 'Terminée'   ? d.statut === 'termine'    : true
    );
    return matchSearch && matchStatut;
  });

  const counts = {
    total: demandes.length,
    attente: demandes.filter(d => d.statut === 'en_attente').length,
    cours: demandes.filter(d => d.statut === 'en_cours').length,
    urgentes: demandes.filter(d => d.priorite === 'urgente').length,
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={titleStyle}>Demandes d'analyses</h1>
          <p style={subtitleStyle}>{counts.total} demande{counts.total !== 1 ? 's' : ''} reçue{counts.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total', value: counts.total, color: '#EEF4FF', icon: <FiClipboard size={18}/> },
          { label: 'En attente', value: counts.attente, color: '#FBBF24', icon: <FiClock size={18}/> },
          { label: 'En cours', value: counts.cours, color: '#38BDF8', icon: <FiRefreshCw size={18}/> },
          { label: 'Urgentes', value: counts.urgentes, color: '#F87171', icon: <FiAlertCircle size={18}/> },
        ].map((k, i) => (
          <div key={i} style={{ ...kpiCard, animationDelay: `${i * 60}ms` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: k.color, opacity: 0.7 }}>{k.icon}</span>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: k.color }}>{k.value}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(238,244,255,0.45)', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={searchWrap}>
          <FiSearch size={14} color="rgba(238,244,255,0.35)" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par patient, réf, type..."
            style={searchInput}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUTS.map(s => (
            <button key={s} onClick={() => setFiltreStatut(s)} style={{ ...filterBtn, ...(filtreStatut === s ? filterBtnActive : {}) }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={tableCard}>
        {loading ? (
          <div style={emptyState}><div style={spinner} /></div>
        ) : filtered.length === 0 ? (
          <div style={emptyState}>
            <FiClipboard size={36} color="rgba(238,244,255,0.15)" style={{ marginBottom: 12 }} />
            <div style={{ color: 'rgba(238,244,255,0.3)', fontSize: 13 }}>Aucune demande trouvée</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Réf.', 'Patient', 'Type d\'analyse', 'Médecin', 'Priorité', 'Statut', 'Date', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const st = STATUT_STYLE[d.statut] || STATUT_STYLE.en_attente;
                const pr = PRIORITES[d.priorite] || PRIORITES.normale;
                return (
                  <tr key={d.id} style={{ ...trStyle, animationDelay: `${i * 40}ms` }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: '#0ED2A0', fontWeight: 700 }}>{d.ref || `DA-${String(d.id).padStart(6,'0')}`}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>{d.patient?.prenom} {d.patient?.nom}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: 'rgba(238,244,255,0.7)' }}>{d.type_analyse}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: 'rgba(238,244,255,0.5)' }}>{d.medecin || '—'}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ ...badge, color: pr.color, background: pr.bg }}>{pr.label}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ ...badge, color: st.color, background: st.bg, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: 'rgba(238,244,255,0.4)' }}>
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button style={actionBtn} onClick={() => setSelected(d)} title="Voir détails">
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal détail */}
      {selected && (
        <div style={overlay} onClick={() => setSelected(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ ...titleStyle, fontSize: 20, marginBottom: 4 }}>Détail de la demande</h2>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#0ED2A0', fontWeight: 700 }}>
                  {selected.ref || `DA-${String(selected.id).padStart(6,'0')}`}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Patient', value: `${selected.patient?.prenom} ${selected.patient?.nom}` },
                { label: 'Type d\'analyse', value: selected.type_analyse },
                { label: 'Médecin prescripteur', value: selected.medecin || '—' },
                { label: 'Priorité', value: PRIORITES[selected.priorite]?.label || '—' },
                { label: 'Statut', value: STATUT_STYLE[selected.statut]?.label || '—' },
                { label: 'Date de demande', value: new Date(selected.created_at).toLocaleString('fr-FR') },
              ].map(f => (
                <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(238,244,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{f.label}</div>
                  <div style={{ fontSize: 14, color: '#EEF4FF', fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelected(null)} style={cancelBtn}>Fermer</button>
              {selected.statut !== 'termine' && (
                <button style={submitBtn}>Saisir un résultat</button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: rgba(238,244,255,0.25); }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
};

const titleStyle = { fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px', margin: 0 };
const subtitleStyle = { fontSize: 13, color: 'rgba(238,244,255,0.4)', marginTop: 4 };
const kpiCard = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 18px', animation: 'slideUp 0.5s ease both' };
const searchWrap = { flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px' };
const searchInput = { flex: 1, background: 'transparent', border: 'none', color: '#EEF4FF', fontSize: 13, fontFamily: "'DM Sans',sans-serif" };
const filterBtn = { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(238,244,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
const filterBtnActive = { background: 'rgba(14,210,160,0.12)', borderColor: 'rgba(14,210,160,0.25)', color: '#0ED2A0' };
const tableCard = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' };
const thStyle = { padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(238,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid rgba(255,255,255,0.06)' };
const tdStyle = { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const trStyle = { transition: 'background 0.15s', animation: 'fadeIn 0.4s ease both' };
const badge = { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 };
const actionBtn = { padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(238,244,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' };
const emptyState = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 };
const spinner = { width: 32, height: 32, border: '3px solid rgba(14,210,160,0.15)', borderTop: '3px solid #0ED2A0', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(7,13,26,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const modal = { background: 'linear-gradient(160deg,#0E1A2E 0%,#0A1220 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 600, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' };
const closeBtnStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(238,244,255,0.6)', cursor: 'pointer', padding: '6px 10px', fontSize: 14 };
const cancelBtn = { padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(238,244,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const submitBtn = { padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0ED2A0,#0BA882)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif" };

export default DemandesPage;
