import { Routes, Route, Link } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { getConsultations, getDemandesAnalyses, getPatients, getPrescriptions, getRendezVousMedecin } from '../api/medecinAPI';
import { FiUsers, FiClipboard, FiCalendar, FiActivity, FiHeart, FiVideo } from 'react-icons/fi';
import { normalizeCollection } from '../utils/apiData';
import PatientsPage           from '../components/medecin/PatientsPage';
import ConsultationsPage      from '../components/medecin/ConsultationsPage';
import PrescriptionsPage      from '../components/medecin/PrescriptionsPage';
import RendezVousPage         from '../components/medecin/RendezVousPage';
import TeleconsultationsPage  from '../components/medecin/TeleconsultationsPage';
import ResultatsAnalysesPage  from '../components/medecin/ResultatsAnalysesPage';
import ConstantesVitalesPage  from '../components/medecin/ConstantesVitalesPage';

const TODAY = new Date().toISOString().slice(0, 10);

const normalizeRendezVous = (rdv) => ({
  id: rdv.id,
  date: rdv.date || rdv.date_heure?.slice(0, 10) || '',
  heure: rdv.heure || rdv.date_heure?.slice(11, 16) || '',
  motif: rdv.motif || 'Consultation',
  statut: rdv.statut || 'en_attente',
  patient: {
    nom: rdv.patient?.nom || rdv.patient?.user?.nom || '',
    prenom: rdv.patient?.prenom || rdv.patient?.user?.prenom || '',
  },
});

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const StatCard = ({ icon, label, value, color, sub, delay = 0 }) => (
  <div className="stat-card" style={{ animation: `slideUp 0.5s ease ${delay}ms both` }}>
    <div className="stat-icon" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
      <span style={{ color, fontSize: 22 }}>{icon}</span>
    </div>
    <div className="value">{value}</div>
    <div className="label">{label}</div>
    {sub && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>{sub}</div>}
  </div>
);

const DashboardHome = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    patients: 0,
    consultations: 0,
    prescriptions: 0,
    analysesPending: 0,
    rdvToday: 0,
    agendaToday: [],
  });

  useEffect(() => {
    Promise.all([
      getPatients(),
      getConsultations(),
      getPrescriptions(),
      getDemandesAnalyses(),
      getRendezVousMedecin({ date: TODAY }),
    ])
      .then(([patientsRes, consultationsRes, prescriptionsRes, analysesRes, rdvRes]) => {
        const patients = normalizeCollection(patientsRes);
        const consultations = normalizeCollection(consultationsRes);
        const prescriptions = normalizeCollection(prescriptionsRes);
        const analyses = normalizeCollection(analysesRes);
        const agendaToday = normalizeCollection(rdvRes)
          .map(normalizeRendezVous)
          .filter((rdv) => rdv.date === TODAY)
          .sort((a, b) => a.heure.localeCompare(b.heure));

        setStats({
          patients: patients.length,
          consultations: consultations.length,
          prescriptions: prescriptions.length,
          analysesPending: analyses.filter((item) => ['en_attente', 'en_cours', 'envoyee'].includes(item.statut)).length,
          rdvToday: agendaToday.length,
          agendaToday,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subGreetStyle}>{getGreeting()},</p>
          <h1 style={pageTitleStyle}>Dr. {user?.prenom} {user?.nom}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LanguageSwitcher />
          <div style={avatarStyle}>
            {(user?.prenom || '?')[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FiUsers />}    label={t('patients')}      value={stats.patients}      color="#0ED2A0" sub="patients suivis"     delay={0}   />
        <StatCard icon={<FiClipboard />}label={t('consultations')} value={stats.consultations} color="#38BDF8" sub="consultations totales" delay={80}  />
        <StatCard icon={<FiCalendar />} label={t('rendez_vous')}   value={stats.rdvToday}      color="#FBBF24" sub="aujourd'hui"           delay={160} />
        <StatCard icon={<FiActivity />} label={t('resultats')}     value={stats.analysesPending} color="#16A34A" sub="à traiter"         delay={240} />
      </div>

      <div style={rowStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiHeart color="#0ED2A0" size={16} />
            <span style={panelTitleStyle}>Accès rapide</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <FiUsers size={18} />,    label: 'Mes patients',      color: '#0ED2A0', to: '/medecin/patients', meta: `${stats.patients} suivis` },
              { icon: <FiClipboard size={18} />,label: 'Prescriptions',     color: '#38BDF8', to: '/medecin/prescriptions', meta: `${stats.prescriptions} actives` },
              { icon: <FiCalendar size={18} />, label: 'Rendez-vous',       color: '#FBBF24', to: '/medecin/rendez-vous', meta: `${stats.rdvToday} aujourd'hui` },
              { icon: <FiVideo size={18} />,    label: 'Téléconsultation',  color: '#16A34A', to: '/medecin/teleconsultations', meta: 'Lancer une session' },
            ].map((item, i) => (
              <Link key={i} to={item.to} style={{ textDecoration: 'none' }}>
              <div style={{ ...quickCard, borderColor: `${item.color}20` }}>
                <span style={{ color: item.color }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.label}</span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>{item.meta}</span>
              </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiActivity color="#38BDF8" size={16} />
            <span style={panelTitleStyle}>Agenda du jour</span>
          </div>
          {stats.agendaToday.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                Aucun rendez-vous planifié<br />pour aujourd'hui
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.agendaToday.map((rdv) => (
                <div key={rdv.id} style={agendaItemStyle}>
                  <div style={agendaHourStyle}>{rdv.heure}</div>
                  <div>
                    <div style={agendaPatientStyle}>{rdv.patient.prenom} {rdv.patient.nom}</div>
                    <div style={agendaMetaStyle}>{rdv.motif}</div>
                  </div>
                  <span style={{
                    ...agendaBadgeStyle,
                    color: rdv.statut === 'confirme' ? '#16A34A' : '#D97706',
                    background: rdv.statut === 'confirme' ? '#F0FDF4' : '#FFFBEB',
                  }}>
                    {rdv.statut === 'confirme' ? 'Confirmé' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
};

const MedecinDashboard = () => (
  <div className="layout">
    <Sidebar />
    <div className="main-content">
      <Routes>
        <Route index                   element={<DashboardHome />} />
        <Route path="patients"         element={<PatientsPage />} />
        <Route path="consultations"    element={<ConsultationsPage />} />
        <Route path="prescriptions"    element={<PrescriptionsPage />} />
        <Route path="rendez-vous"      element={<RendezVousPage />} />
        <Route path="teleconsultations"  element={<TeleconsultationsPage />} />
        <Route path="analyses"           element={<ResultatsAnalysesPage />} />
        <Route path="constantes-vitales" element={<ConstantesVitalesPage />} />
      </Routes>
    </div>
  </div>
);

const subGreetStyle = { fontSize: 13, color: '#6B7280', marginBottom: 4, fontWeight: 500 };
const pageTitleStyle = {
  fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
  color: '#111827',
};
const avatarStyle = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'linear-gradient(135deg, #0ED2A0 0%, #38BDF8 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', flexShrink: 0,
};
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 };
const panelStyle = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 20, padding: '24px 26px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
};
const panelHeaderStyle = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 };
const panelTitleStyle = { fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: '#111827' };
const quickCard = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '18px 12px', background: '#F9FAFB',
  border: '1px solid', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
};
const emptyStateStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  minHeight: 130, padding: '20px',
};
const agendaItemStyle = {
  display: 'grid',
  gridTemplateColumns: '64px 1fr auto',
  gap: 12,
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
};
const agendaHourStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 16,
  fontWeight: 700,
  color: '#111827',
};
const agendaPatientStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#111827',
};
const agendaMetaStyle = {
  fontSize: 12,
  color: '#6B7280',
  marginTop: 2,
};
const agendaBadgeStyle = {
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

export default MedecinDashboard;
