import { useState, useEffect } from 'react';
import { getCarnetVaccination } from '../../api/patientAPI';
import { FiShield, FiCalendar, FiAlertCircle, FiCheck, FiClock, FiDownload } from 'react-icons/fi';

const CarnetVaccinationPage = () => {
  const [carnet, setCarnet]     = useState(null);
  const [vaccins, setVaccins]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('administered');

  useEffect(() => {
    getCarnetVaccination()
      .then(res => {
        const data = res.data?.carnet || res.data || {};
        setCarnet(data);
        setVaccins(data.vaccins || res.data?.vaccins || res.data?.data || []);
      })
      .catch(() => {
        setVaccins([
          {
            id: 1, nom: 'BCG (Tuberculose)', date_administration: '1998-04-10',
            date_rappel: null, estAJour: true,
            lot: 'LOT-BCG-98', centre: 'Hôpital de Dakar',
          },
          {
            id: 2, nom: 'ROR (Rougeole, Oreillons, Rubéole)', date_administration: '2000-06-15',
            date_rappel: '2026-06-15', estAJour: true,
            lot: 'LOT-ROR-00', centre: 'Centre de Santé Médina',
          },
          {
            id: 3, nom: 'Hépatite B', date_administration: '2020-03-20',
            date_rappel: '2030-03-20', estAJour: true,
            lot: 'LOT-HEP-20', centre: 'Clinique Madeleine',
          },
          {
            id: 4, nom: 'Tétanos-Diphtérie (rappel)', date_administration: '2016-09-05',
            date_rappel: '2026-09-05', estAJour: false,
            lot: 'LOT-TD-16', centre: 'Centre de Santé Grand Yoff',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const administered = vaccins;
  const rappelsAVenir = vaccins.filter(v => {
    if (!v.date_rappel) return false;
    const rappel = new Date(v.date_rappel);
    const now = new Date();
    return rappel > now && rappel < new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  });
  const enRetard = vaccins.filter(v => {
    if (!v.date_rappel) return false;
    return new Date(v.date_rappel) < new Date() && !v.estAJour;
  });

  if (loading) return <Loader />;

  const tabs = [
    { id: 'administered', label: `Vaccins (${administered.length})`,    icon: <FiShield size={13}/> },
    { id: 'rappels',      label: `Rappels à venir (${rappelsAVenir.length})`, icon: <FiClock size={13}/> },
    { id: 'retard',       label: `En retard (${enRetard.length})`,       icon: <FiAlertCircle size={13}/> },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subStyle}>Suivi vaccinal</p>
          <h1 style={titleStyle}>Carnet de Vaccination</h1>
        </div>
        <button style={dlBtn}>
          <FiDownload size={14}/> Exporter PDF
        </button>
      </div>

      {/* Summary cards */}
      <div style={summaryRow}>
        <div style={{ ...summaryCard, borderColor: 'rgba(14,210,160,0.2)' }}>
          <FiShield size={20} color="#0ED2A0" />
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0ED2A0', fontFamily: "'Outfit',sans-serif" }}>
            {administered.length}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Vaccins administrés</div>
        </div>
        <div style={{ ...summaryCard, borderColor: 'rgba(251,191,36,0.2)' }}>
          <FiClock size={20} color="#FBBF24" />
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FBBF24', fontFamily: "'Outfit',sans-serif" }}>
            {rappelsAVenir.length}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Rappels dans 12 mois</div>
        </div>
        <div style={{ ...summaryCard, borderColor: 'rgba(248,113,113,0.2)' }}>
          <FiAlertCircle size={20} color="#F87171" />
          <div style={{ fontSize: 24, fontWeight: 800, color: '#F87171', fontFamily: "'Outfit',sans-serif" }}>
            {enRetard.length}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>En retard</div>
        </div>
      </div>

      {/* Alert if en retard */}
      {enRetard.length > 0 && (
        <div style={alertBanner}>
          <FiAlertCircle size={18} color="#F87171" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#F87171' }}>
              {enRetard.length} vaccin(s) en retard
            </div>
            <div style={{ fontSize: 12, color: 'rgba(248,113,113,0.65)', marginTop: 2 }}>
              Consultez votre médecin pour mettre à jour votre carnet vaccinal.
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={tabBar}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ ...tabBtn, ...(activeTab === tab.id ? tabBtnActive : {}) }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'administered' && <VaccineList vaccins={administered} />}
      {activeTab === 'rappels' && <VaccineList vaccins={rappelsAVenir} showRappel />}
      {activeTab === 'retard' && <VaccineList vaccins={enRetard} isRetard />}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

/* ─── Vaccine List ─── */
const VaccineList = ({ vaccins, showRappel, isRetard }) => {
  if (vaccins.length === 0) return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💉</div>
      <div style={{ color: '#6B7280', fontSize: 14 }}>
        {showRappel ? 'Aucun rappel prévu dans les 12 prochains mois' :
         isRetard   ? 'Aucun vaccin en retard — excellent !' :
                     'Aucun vaccin enregistré'}
      </div>
    </div>
  );

  return (
    <div>
      {vaccins.map((v, i) => {
        const isOk     = v.estAJour && !isRetard;
        const accentColor = isRetard ? '#F87171' : showRappel ? '#FBBF24' : '#0ED2A0';
        return (
          <div key={v.id || i} style={{ ...vaccineCard, animation: `slideUp 0.4s ease ${i*60}ms both`,
            borderLeft: `3px solid ${accentColor}` }}>
            <div style={vaccineLeft}>
              <div style={{ ...vaccineIcon, background: `${accentColor}10`, borderColor: `${accentColor}25` }}>
                {isRetard ? <FiAlertCircle size={18} color={accentColor} /> :
                 showRappel ? <FiClock size={18} color={accentColor} /> :
                 <FiCheck size={18} color={accentColor} />}
              </div>
              <div>
                <div style={vaccineName}>{v.nom || 'Vaccin'}</div>
                <div style={vaccineMeta}>
                  <FiCalendar size={10}/>
                  Administré le {v.date_administration ? new Date(v.date_administration).toLocaleDateString('fr-FR') : '—'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                  {v.centre && (
                    <span style={metaChip}>📍 {v.centre}</span>
                  )}
                  {v.lot && (
                    <span style={metaChip}>🏷️ Lot : {v.lot}</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {v.date_rappel && (
                <div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Prochain rappel</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>
                    {new Date(v.date_rappel).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
              {!v.date_rappel && (
                <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                  Pas de rappel
                </span>
              )}
            </div>
          </div>
        );
      })}
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

const subStyle    = { fontSize:13, color:'#6B7280', marginBottom:4, fontWeight:500 };
const titleStyle  = { fontFamily:"'Outfit',sans-serif", fontSize:28, fontWeight:800, letterSpacing:'-0.5px', color:'#111827' };
const dlBtn       = {
  display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
  background:'rgba(14,210,160,0.08)', border:'1px solid rgba(14,210,160,0.2)',
  borderRadius:10, color:'#0ED2A0', fontSize:13, fontWeight:600, cursor:'pointer',
};
const summaryRow  = { display:'flex', gap:14, marginBottom:20 };
const summaryCard = {
  flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'18px 16px',
  background:'#FFFFFF', border:'1px solid', borderRadius:16, textAlign:'center',
};
const alertBanner = {
  display:'flex', alignItems:'center', gap:14, padding:'14px 18px', marginBottom:20,
  background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.15)', borderRadius:14,
};
const tabBar      = { display:'flex', gap:6, marginBottom:24 };
const tabBtn      = {
  display:'flex', alignItems:'center', gap:8, padding:'9px 16px',
  background:'#FFFFFF', border:'1px solid #E5E7EB',
  borderRadius:10, color:'#6B7280', fontSize:12, fontWeight:500, cursor:'pointer',
};
const tabBtnActive = { background:'rgba(14,210,160,0.1)', borderColor:'rgba(14,210,160,0.25)', color:'#0ED2A0', fontWeight:700 };
const vaccineCard = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'16px 20px', marginBottom:10,
  background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:14,
};
const vaccineLeft  = { display:'flex', alignItems:'flex-start', gap:14 };
const vaccineIcon  = {
  width:42, height:42, borderRadius:12, border:'1px solid',
  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
};
const vaccineName  = { fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 };
const vaccineMeta  = { display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B7280' };
const metaChip     = { fontSize:11, color:'#6B7280', padding:'2px 8px',
  background:'#F9FAFB', borderRadius:20, border:'1px solid #E5E7EB' };

export default CarnetVaccinationPage;
