import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { FiActivity, FiClipboard, FiCheckSquare, FiClock, FiBarChart2 } from 'react-icons/fi';
import DemandesPage from '../components/laborantin/DemandesPage';
import ResultatsPage from '../components/laborantin/ResultatsPage';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const DashboardHome = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subGreetStyle}>{getGreeting()},</p>
          <h1 style={pageTitleStyle}>Laborantin {user?.prenom}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LanguageSwitcher />
          <div style={avatarStyle}>{(user?.prenom || '?')[0].toUpperCase()}</div>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { icon: <FiClipboard size={22} />,   label: "Demandes d'analyses", value: '—', color: '#FBBF24', delay: 0,   sub: 'demandes reçues' },
          { icon: <FiClock size={22} />,        label: 'En cours',            value: '—', color: '#38BDF8', delay: 80,  sub: 'analyses en cours' },
          { icon: <FiCheckSquare size={22} />, label: t('resultats'),         value: '—', color: '#0ED2A0', delay: 160, sub: 'résultats envoyés' },
          { icon: <FiActivity size={22} />,     label: 'Urgences',            value: '—', color: '#F87171', delay: 240, sub: 'priorité haute' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ animation: `slideUp 0.5s ease ${s.delay}ms both` }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(238,244,255,0.3)', marginTop: 5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={rowStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiClipboard color="#FBBF24" size={16} />
            <span style={panelTitleStyle}>Demandes récentes</span>
          </div>
          <div style={emptyState}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔬</div>
            <div style={{ fontSize: 13, color: 'rgba(238,244,255,0.35)', textAlign: 'center' }}>
              Aucune demande d'analyse<br />en attente
            </div>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiBarChart2 color="#0ED2A0" size={16} />
            <span style={panelTitleStyle}>Accès rapide</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Toutes les demandes',    color: '#FBBF24' },
              { label: 'Saisir un résultat',     color: '#0ED2A0' },
              { label: 'Envoyer les résultats',  color: '#38BDF8' },
              { label: 'Analyses urgentes',      color: '#F87171' },
            ].map((action, i) => (
              <div key={i} style={{ ...actionItem, borderLeftColor: action.color }}>
                <span style={{ fontSize: 13, color: 'rgba(238,244,255,0.75)' }}>{action.label}</span>
                <span style={{ color: action.color }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
};

const LaborantinDashboard = () => (
  <div className="layout">
    <Sidebar />
    <div className="main-content">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="demandes"  element={<DemandesPage />} />
        <Route path="resultats" element={<ResultatsPage />} />
      </Routes>
    </div>
  </div>
);

const subGreetStyle = { fontSize: 13, color: 'rgba(238,244,255,0.4)', marginBottom: 4, fontWeight: 500 };
const pageTitleStyle = {
  fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
  background: 'linear-gradient(135deg, #EEF4FF 0%, rgba(238,244,255,0.6) 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
};
const avatarStyle = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'linear-gradient(135deg, #FBBF24 0%, #0ED2A0 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff',
};
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 };
const panelStyle = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20, padding: '24px 26px', backdropFilter: 'blur(20px)',
};
const panelHeaderStyle = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 };
const panelTitleStyle = { fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: '#EEF4FF' };
const emptyState = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', minHeight: 120, padding: 20,
};
const actionItem = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
  borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
  borderLeft: '3px solid', cursor: 'pointer',
};

export default LaborantinDashboard;
