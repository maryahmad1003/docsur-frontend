import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { getStatistiques } from '../api/adminAPI';
import { FiUsers, FiClipboard, FiHome, FiBarChart2, FiTrendingUp, FiActivity } from 'react-icons/fi';
import UtilisateursPage  from '../components/admin/UtilisateursPage';
import CentresSantePage  from '../components/admin/CentresSantePage';
import CampagnesPage     from '../components/admin/CampagnesPage';
import StatistiquesPage  from '../components/admin/StatistiquesPage';
import { adminPalette } from '../components/admin/adminTheme';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const StatCard = ({ icon, label, value, color, delay = 0 }) => (
  <div className="stat-card" style={{ animation: `slideUp 0.5s ease ${delay}ms both` }}>
    <div className="stat-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
      <span style={{ color, fontSize: 22 }}>{icon}</span>
    </div>
    <div className="value">{value}</div>
    <div className="label">{label}</div>
  </div>
);

const DashboardHome = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStatistiques().then(res => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subGreetStyle}>{getGreeting()},</p>
          <h1 style={pageTitleStyle}>Administrateur {user?.prenom}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LanguageSwitcher />
          <div style={avatarStyle}>{(user?.prenom || '?')[0].toUpperCase()}</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FiUsers />}     label={t('utilisateurs')} value={stats?.total_utilisateurs  ?? '—'} color="#0ED2A0" delay={0}   />
        <StatCard icon={<FiActivity />}  label={t('patients')}      value={stats?.total_patients       ?? '—'} color="#38BDF8" delay={80}  />
        <StatCard icon={<FiClipboard />} label={t('consultations')} value={stats?.total_consultations  ?? '—'} color="#FBBF24" delay={160} />
        <StatCard icon={<FiHome />}      label={t('centres_sante')} value={stats?.total_centres_sante  ?? '—'} color="#A78BFA" delay={240} />
      </div>

      <div style={rowStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiTrendingUp color="#0ED2A0" />
            <span style={panelTitleStyle}>Vue d'ensemble</span>
          </div>
          <div style={overviewGrid}>
            {[
              { label: 'Médecins', value: stats?.total_medecins ?? '—', color: '#0ED2A0' },
              { label: 'Prescriptions', value: stats?.total_prescriptions ?? '—', color: '#38BDF8' },
              { label: 'Centres actifs', value: stats?.total_centres_sante ?? '—', color: '#A78BFA' },
            ].map((item, i) => (
              <div key={i} style={overviewItem}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiBarChart2 color="#FBBF24" />
            <span style={panelTitleStyle}>Activité du jour</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: `RDV aujourd'hui`, value: stats?.rdv_aujourdhui ?? 0, color: '#0ED2A0' },
              { label: 'RDV en attente',  value: stats?.rdv_en_attente  ?? 0, color: '#FBBF24' },
              { label: 'Consults ce mois',value: stats?.consultations_ce_mois ?? 0, color: '#38BDF8' },
            ].map((item, i) => (
              <div key={i} style={activityItem}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{item.label}</span>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
};

const AdminDashboard = () => (
  <div className="layout">
    <Sidebar />
    <div className="main-content">
      <Routes>
        <Route index                    element={<DashboardHome />} />
        <Route path="utilisateurs"      element={<UtilisateursPage />} />
        <Route path="centres-sante"     element={<CentresSantePage />} />
        <Route path="campagnes"         element={<CampagnesPage />} />
        <Route path="statistiques"      element={<StatistiquesPage />} />
      </Routes>
    </div>
  </div>
);

const subGreetStyle = { fontSize: 13, color: '#6B7280', marginBottom: 4, fontWeight: 500 };
const pageTitleStyle = { fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: '#111827' };
const avatarStyle = { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0ED2A0,#38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', flexShrink: 0 };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 };
const panelStyle = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px 26px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)' };
const panelHeaderStyle = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 };
const panelTitleStyle = { fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: '#111827' };
const overviewGrid = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 };
const overviewItem = { padding: '14px 12px', background: '#F9FAFB', borderRadius: 12, border: `1px solid ${adminPalette.border}`, textAlign: 'center' };
const activityItem = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, border: `1px solid ${adminPalette.border}` };

export default AdminDashboard;
