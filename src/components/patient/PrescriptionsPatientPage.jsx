import { useState, useEffect } from 'react';
import { getMesPrescriptions } from '../../api/patientAPI';
import { FiFileText, FiPackage, FiCalendar, FiUser, FiDownload, FiSearch } from 'react-icons/fi';

const normalizeDoctorName = (medecin) => {
  if (!medecin) return '';
  if (typeof medecin === 'string') return medecin;

  if (medecin.user) {
    return `Dr. ${medecin.user.prenom} ${medecin.user.nom}`;
  }

  const fullName = [medecin.prenom, medecin.nom].filter(Boolean).join(' ').trim();
  return fullName ? `Dr. ${fullName}` : '';
};

const normalizePrescription = (prescription = {}) => ({
  ...prescription,
  date_prescription: prescription.date_prescription || prescription.date_emission || '',
  medecin: normalizeDoctorName(prescription.medecin),
  consultation_motif: prescription.consultation_motif || prescription.consultation?.motif || 'Ordonnance',
  medicaments: Array.isArray(prescription.medicaments)
    ? prescription.medicaments.map((medicament) => ({
        ...medicament,
        dosage: medicament.dosage || '—',
        posologie: medicament.posologie || medicament.pivot?.posologie || '—',
        duree: medicament.duree || medicament.duree_traitement || medicament.pivot?.duree_traitement || '—',
      }))
    : [],
});

const PrescriptionsPatientPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState(null);

  useEffect(() => {
    getMesPrescriptions()
      .then(res => setPrescriptions((res.data?.data || res.data || []).map(normalizePrescription)))
      .catch(() => setPrescriptions([
        {
          id: 1, date_prescription: '2026-03-10', statut: 'active',
          medecin: 'Dr. Ndiaye Moussa', consultation_motif: 'Grippe saisonnière',
          notes: 'Prendre les médicaments après les repas.',
          medicaments: [
            { nom: 'Paracétamol 500mg', dosage: '1 comprimé', posologie: '3 fois/jour', duree: '5 jours' },
            { nom: 'Ibuprofène 200mg',  dosage: '1 comprimé', posologie: '2 fois/jour', duree: '3 jours' },
          ],
        },
        {
          id: 2, date_prescription: '2026-02-05', statut: 'terminee',
          medecin: 'Dr. Diallo Aminata', consultation_motif: 'Suivi hypertension',
          notes: 'Surveiller la tension artérielle quotidiennement.',
          medicaments: [
            { nom: 'Amlodipine 5mg', dosage: '1 comprimé', posologie: '1 fois/jour', duree: '30 jours' },
          ],
        },
      ].map(normalizePrescription)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = prescriptions.filter(p =>
    (p.medecin || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.consultation_motif || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.medicaments || []).some(m => (m.nom || '').toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Loader />;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subStyle}>Mes ordonnances</p>
          <h1 style={titleStyle}>Prescriptions</h1>
        </div>
        <div style={searchBox}>
          <FiSearch size={14} color="#9CA3AF" />
          <input style={searchInput} placeholder="Rechercher…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      <div style={summaryRow}>
        {[
          { label: 'Total',    value: prescriptions.length,                                     color: '#111827' },
          { label: 'Actives',  value: prescriptions.filter(p => p.statut === 'active').length,   color: '#0ED2A0' },
          { label: 'Terminées',value: prescriptions.filter(p => p.statut === 'terminee').length, color: '#FBBF24' },
        ].map((s, i) => (
          <div key={i} style={summaryCard}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
          <div style={{ color: '#6B7280', fontSize: 14 }}>Aucune prescription trouvée</div>
        </div>
      ) : (
        <div style={listGrid}>
          {filtered.map((presc, i) => (
            <div key={presc.id || i} style={{ ...prescCard, animation: `slideUp 0.4s ease ${i*60}ms both` }}
              onClick={() => setSelected(selected?.id === presc.id ? null : presc)}>
              <div style={prescHeader}>
                <div style={iconWrap}><FiFileText size={18} color="#0ED2A0" /></div>
                <div style={{ flex: 1 }}>
                  <div style={prescTitle}>{presc.consultation_motif || 'Ordonnance'}</div>
                  <div style={prescMeta}>
                    <FiUser size={11}/> {presc.medecin || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ ...statusBadge,
                    color: presc.statut === 'active' ? '#0ED2A0' : '#FBBF24',
                    background: presc.statut === 'active' ? 'rgba(14,210,160,0.1)' : 'rgba(251,191,36,0.1)' }}>
                    {presc.statut === 'active' ? 'Active' : 'Terminée'}
                  </span>
                  <span style={dateMeta}>
                    <FiCalendar size={10}/>
                    {presc.date_prescription ? new Date(presc.date_prescription).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </div>
              </div>

              {/* Medicaments preview */}
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(presc.medicaments || []).slice(0, 3).map((m, j) => (
                  <span key={j} style={medChip}><FiPackage size={10}/> {m.nom}</span>
                ))}
                {(presc.medicaments || []).length > 3 && (
                  <span style={medChip}>+{(presc.medicaments || []).length - 3} autres</span>
                )}
              </div>

              {/* Detail (when selected) */}
              {selected?.id === presc.id && (
                <div style={detailPanel} onClick={e => e.stopPropagation()}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0ED2A0', marginBottom: 12 }}>
                    Médicaments prescrits
                  </div>
                  {(presc.medicaments || []).map((m, j) => (
                    <div key={j} style={medRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={medIcon}><FiPackage size={14} color="#A78BFA"/></div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{m.nom}</span>
                      </div>
                      <div style={medDetail}>
                        <span>Dosage : {m.dosage || '—'}</span>
                        <span>Posologie : {m.posologie || '—'}</span>
                        <span>Durée : {m.duree || '—'}</span>
                      </div>
                    </div>
                  ))}
                  {presc.notes && (
                    <div style={notesBox}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>NOTES DU MÉDECIN</div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{presc.notes}</div>
                    </div>
                  )}
                  <button style={dlBtn}>
                    <FiDownload size={13}/> Télécharger l'ordonnance PDF
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

const Loader = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
    <div style={{ width:36, height:36, border:'3px solid rgba(14,210,160,0.2)',
      borderTopColor:'#0ED2A0', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
  </div>
);

const subStyle   = { fontSize:13, color:'#6B7280', marginBottom:4, fontWeight:500 };
const titleStyle = { fontFamily:"'Outfit',sans-serif", fontSize:28, fontWeight:800, letterSpacing:'-0.5px', color:'#111827' };
const searchBox   = {
  display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
  background:'#FFFFFF', border:'1px solid #D1D5DB', borderRadius:12,
};
const searchInput = { background:'none', border:'none', outline:'none', color:'#111827', fontSize:13, width:180 };
const summaryRow  = { display:'flex', gap:14, marginBottom:24 };
const summaryCard = {
  flex:1, padding:'16px 20px', background:'#FFFFFF',
  border:'1px solid #E5E7EB', borderRadius:14, textAlign:'center',
};
const listGrid   = { display:'grid', gap:12 };
const prescCard  = {
  background:'#FFFFFF', border:'1px solid #E5E7EB',
  borderRadius:16, padding:'18px 22px', cursor:'pointer', transition:'border-color 0.2s',
};
const prescHeader = { display:'flex', alignItems:'flex-start', gap:14 };
const iconWrap    = {
  width:42, height:42, borderRadius:12, background:'rgba(14,210,160,0.1)',
  border:'1px solid rgba(14,210,160,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
};
const prescTitle  = { fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 };
const prescMeta   = { display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6B7280' };
const statusBadge = { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 };
const dateMeta    = { display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#9CA3AF' };
const medChip     = {
  display:'flex', alignItems:'center', gap:5, padding:'4px 10px',
  background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)',
  borderRadius:20, fontSize:11, color:'#A78BFA',
};
const detailPanel = {
  marginTop:16, paddingTop:16, borderTop:'1px solid #E5E7EB',
};
const medRow   = { marginBottom:14, padding:'12px 14px', background:'#F9FAFB', borderRadius:10 };
const medIcon  = { width:28, height:28, borderRadius:8, background:'rgba(167,139,250,0.1)',
  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
const medDetail = {
  display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'#6B7280', marginTop:4, paddingLeft:38,
};
const notesBox = { padding:'12px 14px', background:'rgba(56,189,248,0.05)', border:'1px solid rgba(56,189,248,0.1)',
  borderRadius:10, marginBottom:14 };
const dlBtn = {
  display:'flex', alignItems:'center', gap:8, padding:'9px 18px',
  background:'rgba(14,210,160,0.1)', border:'1px solid rgba(14,210,160,0.2)',
  borderRadius:10, color:'#0ED2A0', fontSize:12, fontWeight:600, cursor:'pointer',
};
const emptyState = { textAlign:'center', padding:'60px 20px' };

export default PrescriptionsPatientPage;
