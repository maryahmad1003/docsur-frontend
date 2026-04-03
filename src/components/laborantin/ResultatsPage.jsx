import { useState, useEffect } from 'react';
import { FiActivity, FiSearch, FiPlus, FiCheckCircle, FiSend, FiX, FiFileText } from 'react-icons/fi';
import { getResultats, envoyerResultat, getDemandes } from '../../api/laborantinAPI';
import { formatGeneratedRef, normalizeCollection } from '../../utils/apiData';

const normalizeResultat = (resultat) => ({
  id: resultat.id,
  ref: resultat.ref || formatGeneratedRef('RA', resultat.id),
  demande_ref: resultat.demande_ref || formatGeneratedRef('DA', resultat.demande_analyse_id),
  patient: {
    nom: resultat.patient?.nom || resultat.demandeAnalyse?.patient?.user?.nom || '',
    prenom: resultat.patient?.prenom || resultat.demandeAnalyse?.patient?.user?.prenom || '',
  },
  type_analyse: resultat.type_analyse,
  valeurs: resultat.valeurs || resultat.resultats || '',
  interpretation: resultat.interpretation || '',
  date_resultat: resultat.date_resultat || resultat.created_at,
  envoye: resultat.statut === 'envoye',
});

const ResultatsPage = () => {
  const [resultats, setResultats] = useState([]);
  const [demandesOuvertes, setDemandesOuvertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ demande_id: '', valeurs: '', interpretation: '', observations: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([getResultats(), getDemandes()])
      .then(([resR, resD]) => {
        setResultats(normalizeCollection(resR).map(normalizeResultat));
        const allDemandes = normalizeCollection(resD);
        setDemandesOuvertes(allDemandes.filter(d => d.statut !== 'termine'));
      })
      .catch(() => {
        setResultats([]);
        setDemandesOuvertes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (!form.demande_id || !form.valeurs) return;
    setSaving(true);
    try {
      await envoyerResultat({
        demande_analyse_id: form.demande_id,
        type_analyse: demandesOuvertes.find((item) => String(item.id) === String(form.demande_id))?.type_analyse || '',
        resultats: form.valeurs,
        interpretation: form.interpretation,
        valeur_normale: form.observations,
      });
      showToast('Résultat envoyé avec succès');
      setShowForm(false);
      setForm({ demande_id: '', valeurs: '', interpretation: '', observations: '' });
      const res = await getResultats();
      setResultats(normalizeCollection(res).map(normalizeResultat));
    } catch (error) {
      showToast(error?.response?.data?.message || 'Envoi impossible', 'info');
    } finally {
      setSaving(false);
    }
  };

  const filtered = resultats.filter(r =>
    !search || `${r.patient?.nom} ${r.patient?.prenom} ${r.ref} ${r.type_analyse}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Toast */}
      {toast && (
        <div style={{ ...toastStyle, background: toast.type === 'success' ? 'rgba(14,210,160,0.15)' : 'rgba(56,189,248,0.15)', borderColor: toast.type === 'success' ? 'rgba(14,210,160,0.3)' : 'rgba(56,189,248,0.3)' }}>
          <FiCheckCircle size={14} color={toast.type === 'success' ? '#0ED2A0' : '#38BDF8'} />
          <span style={{ fontSize: 13, color: '#EEF4FF' }}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={titleStyle}>Résultats d'analyses</h1>
          <p style={subtitleStyle}>{resultats.length} résultat{resultats.length !== 1 ? 's' : ''} enregistré{resultats.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} style={addBtn}>
          <FiPlus size={15} /> Saisir un résultat
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total résultats', value: resultats.length, color: '#0ED2A0', icon: <FiFileText size={18}/> },
          { label: 'Envoyés', value: resultats.filter(r => r.envoye).length, color: '#38BDF8', icon: <FiSend size={18}/> },
          { label: 'En attente d\'envoi', value: resultats.filter(r => !r.envoye).length, color: '#FBBF24', icon: <FiActivity size={18}/> },
        ].map((k, i) => (
          <div key={i} style={{ ...kpiCard, animationDelay: `${i * 60}ms` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: k.color, opacity: 0.7 }}>{k.icon}</span>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: k.color }}>{k.value}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(238,244,255,0.45)', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ ...searchWrap, marginBottom: 20 }}>
        <FiSearch size={14} color="rgba(238,244,255,0.35)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par patient, réf, type..." style={searchInput} />
      </div>

      {/* Table */}
      <div style={tableCard}>
        {loading ? (
          <div style={emptyState}><div style={spinner} /></div>
        ) : filtered.length === 0 ? (
          <div style={emptyState}>
            <FiActivity size={36} color="rgba(238,244,255,0.15)" style={{ marginBottom: 12 }} />
            <div style={{ color: 'rgba(238,244,255,0.3)', fontSize: 13 }}>Aucun résultat trouvé</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Réf.', 'Demande', 'Patient', 'Type d\'analyse', 'Valeurs', 'Interprétation', 'Date', 'Statut'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ animation: `fadeIn 0.4s ease ${i * 40}ms both`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={tdStyle}><span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: '#0ED2A0', fontWeight: 700 }}>{r.ref}</span></td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: 'rgba(238,244,255,0.5)' }}>{r.demande_ref}</span></td>
                  <td style={tdStyle}><div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>{r.patient?.prenom} {r.patient?.nom}</div></td>
                  <td style={tdStyle}><span style={{ fontSize: 13, color: 'rgba(238,244,255,0.7)' }}>{r.type_analyse}</span></td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: 'rgba(238,244,255,0.6)', fontFamily: 'monospace' }}>{r.valeurs?.slice(0, 30)}{r.valeurs?.length > 30 ? '…' : ''}</span></td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: 'rgba(238,244,255,0.55)' }}>{r.interpretation?.slice(0, 25)}{r.interpretation?.length > 25 ? '…' : ''}</span></td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: 'rgba(238,244,255,0.4)' }}>{new Date(r.date_resultat).toLocaleDateString('fr-FR')}</span></td>
                  <td style={tdStyle}>
                    <span style={{ ...envoyeBadge, ...(r.envoye ? envoyeOui : envoyeNon) }}>
                      {r.envoye ? <><FiSend size={10}/> Envoyé</> : <><FiActivity size={10}/> En attente</>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal saisie */}
      {showForm && (
        <div style={overlay} onClick={() => setShowForm(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ ...titleStyle, fontSize: 20, margin: 0 }}>Saisir un résultat</h2>
              <button onClick={() => setShowForm(false)} style={closeBtnStyle}><FiX size={16}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Demande d'analyse *</label>
                <select value={form.demande_id} onChange={e => setForm(f => ({ ...f, demande_id: e.target.value }))} style={selectStyle}>
                  <option value="">Sélectionner une demande</option>
                  {demandesOuvertes.map(d => (
                    <option key={d.id} value={d.id}>{d.ref} — {d.patient?.prenom} {d.patient?.nom} ({d.type_analyse})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Valeurs / Mesures *</label>
                <textarea value={form.valeurs} onChange={e => setForm(f => ({ ...f, valeurs: e.target.value }))} rows={3} placeholder="Ex: Hémoglobine: 12.5 g/dL, Leucocytes: 7800/mm³..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={labelStyle}>Interprétation</label>
                <input value={form.interpretation} onChange={e => setForm(f => ({ ...f, interpretation: e.target.value }))} placeholder="Normal, Anormal, À surveiller..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Observations complémentaires</label>
                <textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} placeholder="Commentaires additionnels..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={cancelBtn}>Annuler</button>
              <button onClick={handleSubmit} disabled={saving} style={{ ...submitBtn, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Envoi…' : <><FiSend size={13}/> Envoyer le résultat</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        input::placeholder, textarea::placeholder { color: rgba(238,244,255,0.25); }
        input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(14,210,160,0.4) !important; }
        select option { background: #0A1220; color: #EEF4FF; }
      `}</style>
    </div>
  );
};

const titleStyle = { fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px', margin: 0 };
const subtitleStyle = { fontSize: 13, color: 'rgba(238,244,255,0.4)', marginTop: 4 };
const kpiCard = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 18px', animation: 'slideUp 0.5s ease both' };
const searchWrap = { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px' };
const searchInput = { flex: 1, background: 'transparent', border: 'none', color: '#EEF4FF', fontSize: 13, fontFamily: "'DM Sans',sans-serif" };
const tableCard = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' };
const thStyle = { padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(238,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid rgba(255,255,255,0.06)' };
const tdStyle = { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const emptyState = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 };
const spinner = { width: 32, height: 32, border: '3px solid rgba(14,210,160,0.15)', borderTop: '3px solid #0ED2A0', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const addBtn = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#0ED2A0,#0BA882)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" };
const envoyeBadge = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 };
const envoyeOui = { color: '#0ED2A0', background: 'rgba(14,210,160,0.12)' };
const envoyeNon = { color: '#FBBF24', background: 'rgba(251,191,36,0.12)' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(7,13,26,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const modal = { background: 'linear-gradient(160deg,#0E1A2E 0%,#0A1220 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 580, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' };
const closeBtnStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(238,244,255,0.6)', cursor: 'pointer', padding: '6px 10px' };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(238,244,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#EEF4FF', fontSize: 13, fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const cancelBtn = { padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(238,244,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const submitBtn = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0ED2A0,#0BA882)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif" };
const toastStyle = { position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, border: '1px solid', backdropFilter: 'blur(12px)' };

export default ResultatsPage;
