import { useState, useEffect } from 'react';
import { FiFileText, FiSearch, FiCheckCircle, FiClock, FiEye, FiX, FiPackage, FiUser, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import { getOrdonnances, validerDelivrance } from '../../api/pharmacienAPI';
import { formatGeneratedRef, normalizeCollection } from '../../utils/apiData';

const STATUT = {
  envoyee:    { label: 'En attente', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', icon: <FiClock size={11}/> },
  en_attente: { label: 'En attente', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', icon: <FiClock size={11}/> },
  delivree:   { label: 'Délivrée',   color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)', icon: <FiCheckCircle size={11}/> },
  expiree:    { label: 'Expirée',    color: '#F87171', bg: 'rgba(248,113,113,0.1)', icon: <FiAlertCircle size={11}/> },
};

const isExpiringSoon = (dateStr) => {
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
};

const OrdonnancesPage = () => {
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState(null);
  const [delivering, setDelivering] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getOrdonnances()
      .then((res) => setOrdonnances(normalizeCollection(res).map((ordonnance) => ({
        id: ordonnance.id,
        ref: ordonnance.ref || ordonnance.numero || formatGeneratedRef('ORD', ordonnance.id),
        patient: {
          nom: ordonnance.patient?.nom || ordonnance.consultation?.dossierMedical?.patient?.user?.nom || '',
          prenom: ordonnance.patient?.prenom || ordonnance.consultation?.dossierMedical?.patient?.user?.prenom || '',
          date_naissance: ordonnance.patient?.date_naissance || ordonnance.consultation?.dossierMedical?.patient?.date_naissance || '',
        },
        medecin: ordonnance.medecin?.user ? `Dr. ${ordonnance.medecin.user.prenom} ${ordonnance.medecin.user.nom}` : (ordonnance.medecin || '—'),
        date_emission: ordonnance.date_emission,
        date_expiration: ordonnance.date_expiration,
        statut: ordonnance.statut || 'envoyee',
        medicaments: Array.isArray(ordonnance.medicaments) ? ordonnance.medicaments.map((medicament) => ({
          nom: medicament.nom,
          posologie: medicament.pivot?.posologie || medicament.posologie || '—',
          duree: medicament.pivot?.duree_traitement || medicament.duree_traitement || '—',
          quantite: medicament.pivot?.quantite || medicament.quantite || '—',
        })) : [],
      }))))
      .catch(() => setOrdonnances([]))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeliver = async (ord) => {
    setDelivering(true);
    try {
      await validerDelivrance(ord.id);
      setOrdonnances(prev => prev.map(o => o.id === ord.id ? { ...o, statut: 'delivree' } : o));
      if (selected?.id === ord.id) setSelected(s => ({ ...s, statut: 'delivree' }));
      showToast('Délivrance validée avec succès');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Délivrance impossible', 'error');
    } finally {
      setDelivering(false);
    }
  };

  const filtres = ['Tous', 'En attente', 'Délivrées', 'Expirées'];
  const filtered = ordonnances.filter(o => {
    const matchSearch = !search || `${o.patient?.nom} ${o.patient?.prenom} ${o.ref} ${o.medecin}`.toLowerCase().includes(search.toLowerCase());
    const matchStatut =
      filtreStatut === 'Tous'        ? true :
      filtreStatut === 'En attente'  ? ['en_attente', 'envoyee'].includes(o.statut) :
      filtreStatut === 'Délivrées'   ? o.statut === 'delivree' :
      filtreStatut === 'Expirées'    ? o.statut === 'expiree' : true;
    return matchSearch && matchStatut;
  });

  const counts = {
    total:    ordonnances.length,
    attente:  ordonnances.filter(o => ['en_attente', 'envoyee'].includes(o.statut)).length,
    delivree: ordonnances.filter(o => o.statut === 'delivree').length,
    expir:    ordonnances.filter(o => o.statut === 'expiree').length,
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(14,210,160,0.25)', background: '#ECFDF5', boxShadow: '0 16px 30px rgba(15, 23, 42, 0.12)' }}>
          <FiCheckCircle size={14} color="#0ED2A0" />
          <span style={{ fontSize: 13, color: '#065F46' }}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={titleStyle}>Ordonnances</h1>
          <p style={subtitleStyle}>{counts.total} ordonnance{counts.total !== 1 ? 's' : ''} · {counts.attente} en attente de traitement</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total', value: counts.total, color: '#A78BFA', icon: <FiFileText size={18}/> },
          { label: 'En attente', value: counts.attente, color: '#FBBF24', icon: <FiClock size={18}/> },
          { label: 'Délivrées', value: counts.delivree, color: '#0ED2A0', icon: <FiCheckCircle size={18}/> },
          { label: 'Expirées', value: counts.expir, color: '#F87171', icon: <FiAlertCircle size={18}/> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '16px 18px', boxShadow: '0 16px 30px rgba(15, 23, 42, 0.06)', animation: `slideUp 0.5s ease ${i*60}ms both` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: k.color, opacity: 0.7 }}>{k.icon}</span>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: k.color }}>{k.value}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={searchWrap}>
          <FiSearch size={14} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par patient, réf, médecin..." style={searchInput} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}><FiX size={14}/></button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {filtres.map(f => (
            <button key={f} onClick={() => setFiltreStatut(f)} style={{ ...filterBtn, ...(filtreStatut === f ? filterActive : {}) }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={tableCard}>
        {loading ? (
          <div style={emptyState}><div style={spinner} /></div>
        ) : filtered.length === 0 ? (
          <div style={emptyState}>
            <FiFileText size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <div style={{ color: '#6B7280', fontSize: 13 }}>Aucune ordonnance trouvée</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Réf.', 'Patient', 'Médecin', 'Médicaments', 'Émission', 'Expiration', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const st = STATUT[o.statut] || STATUT.envoyee;
                const expireSoon = ['en_attente', 'envoyee'].includes(o.statut) && isExpiringSoon(o.date_expiration);
                return (
                  <tr key={o.id}
                    style={{ animation: `fadeIn 0.4s ease ${i*40}ms both`, transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setSelected(o)}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: '#A78BFA', fontWeight: 700 }}>{o.ref}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#A78BFAcc,#A78BFA55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {(o.patient?.prenom || '?')[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{o.patient?.prenom} {o.patient?.nom}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>
                            {o.patient?.date_naissance ? new Date().getFullYear() - new Date(o.patient.date_naissance).getFullYear() + ' ans' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{o.medecin}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {o.medicaments?.length} médicament{o.medicaments?.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{new Date(o.date_emission).toLocaleDateString('fr-FR')}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: expireSoon ? '#D97706' : '#6B7280', fontWeight: expireSoon ? 700 : 400 }}>
                        {expireSoon && '⚠ '}{new Date(o.date_expiration).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ ...badge, color: st.color, background: st.bg, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={iconBtn} onClick={() => setSelected(o)} title="Voir détails"><FiEye size={13}/></button>
                        {['en_attente', 'envoyee'].includes(o.statut) && (
                          <button style={{ ...iconBtn, background: 'rgba(14,210,160,0.1)', borderColor: 'rgba(14,210,160,0.2)', color: '#0ED2A0' }}
                            onClick={() => handleDeliver(o)} title="Valider la délivrance">
                            <FiCheckCircle size={13}/>
                          </button>
                        )}
                      </div>
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
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#A78BFA', fontWeight: 700 }}>{selected.ref}</span>
                  <span style={{ ...badge, color: STATUT[selected.statut]?.color, background: STATUT[selected.statut]?.bg, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {STATUT[selected.statut]?.icon}{STATUT[selected.statut]?.label}
                  </span>
                </div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
                  Ordonnance — {selected.patient?.prenom} {selected.patient?.nom}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} style={closeBtnStyle}><FiX size={16}/></button>
            </div>

            {/* Infos patient + médecin */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={infoBox}>
                <div style={infoLabel}><FiUser size={11}/> Patient</div>
                <div style={infoVal}>{selected.patient?.prenom} {selected.patient?.nom}</div>
                {selected.patient?.date_naissance && (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    Né(e) le {new Date(selected.patient.date_naissance).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
              <div style={infoBox}>
                <div style={infoLabel}><FiUser size={11}/> Médecin prescripteur</div>
                <div style={infoVal}>{selected.medecin}</div>
              </div>
              <div style={infoBox}>
                <div style={infoLabel}><FiCalendar size={11}/> Date d'émission</div>
                <div style={infoVal}>{new Date(selected.date_emission).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</div>
              </div>
              <div style={infoBox}>
                <div style={infoLabel}><FiCalendar size={11}/> Date d'expiration</div>
                <div style={{ ...infoVal, color: isExpiringSoon(selected.date_expiration) && selected.statut === 'en_attente' ? '#D97706' : '#111827' }}>
                  {isExpiringSoon(selected.date_expiration) && selected.statut === 'en_attente' ? '⚠ ' : ''}
                  {new Date(selected.date_expiration).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                </div>
              </div>
            </div>

            {/* Médicaments */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiPackage size={12}/> Médicaments prescrits ({selected.medicaments?.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.medicaments?.map((m, i) => (
                  <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: "'Outfit',sans-serif" }}>{m.nom}</span>
                      <span style={{ fontSize: 11, background: 'rgba(167,139,250,0.12)', color: '#7C3AED', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>Qté : {m.quantite}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ fontSize: 12, color: '#4B5563' }}>💊 {m.posologie}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>⏱ {m.duree}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => setSelected(null)} style={cancelBtn}>Fermer</button>
              {selected.statut === 'en_attente' && (
                <button
                  onClick={() => handleDeliver(selected)}
                  disabled={delivering}
                  style={{ ...deliverBtn, opacity: delivering ? 0.7 : 1 }}
                >
                  <FiCheckCircle size={14}/>
                  {delivering ? 'Validation…' : 'Valider la délivrance'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: #9CA3AF; }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
};

const titleStyle = { fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', margin: 0 };
const subtitleStyle = { fontSize: 13, color: '#6B7280', marginTop: 4 };
const searchWrap = { flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 10, padding: '10px 14px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)' };
const searchInput = { flex: 1, background: 'transparent', border: 'none', color: '#111827', fontSize: 13, fontFamily: "'DM Sans',sans-serif" };
const filterBtn = { padding: '8px 14px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#FFFFFF', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' };
const filterActive = { background: '#ECFDF5', borderColor: '#A7F3D0', color: '#059669' };
const tableCard = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, overflow: 'hidden', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)' };
const thStyle = { padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' };
const tdStyle = { padding: '14px 16px', borderBottom: '1px solid #F3F4F6' };
const badge = { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 };
const iconBtn = { padding: '6px 8px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#F9FAFB', color: '#4B5563', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center' };
const emptyState = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 };
const spinner = { width: 32, height: 32, border: '3px solid rgba(167,139,250,0.15)', borderTop: '3px solid #A78BFA', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.32)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const modal = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 24, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 70px rgba(15, 23, 42, 0.2)' };
const closeBtnStyle = { background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: 8, color: '#4B5563', cursor: 'pointer', padding: '7px 11px', display: 'flex', alignItems: 'center' };
const infoBox = { background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' };
const infoLabel = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };
const infoVal = { fontSize: 14, fontWeight: 600, color: '#111827' };
const cancelBtn = { padding: '10px 20px', borderRadius: 10, border: '1px solid #D1D5DB', background: '#F9FAFB', color: '#4B5563', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const deliverBtn = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0ED2A0,#0BA882)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif" };

export default OrdonnancesPage;
