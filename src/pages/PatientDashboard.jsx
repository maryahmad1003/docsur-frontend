import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { FiFileText, FiCalendar, FiActivity, FiBookOpen, FiHeart, FiVideo, FiClipboard, FiPackage } from 'react-icons/fi';
import { getMesPrescriptions, getMesRendezVous, getMesResultats, getMonDossier } from '../api/patientAPI';

import DossierMedicalPage          from '../components/patient/DossierMedicalPage';
import RendezVousPatientPage       from '../components/patient/RendezVousPatientPage';
import PrescriptionsPatientPage    from '../components/patient/PrescriptionsPatientPage';
import ResultatsPatientPage        from '../components/patient/ResultatsPatientPage';
import CarnetVaccinationPage       from '../components/patient/CarnetVaccinationPage';
import TeleconsultationPatientPage from '../components/patient/TeleconsultationPatientPage';
import SensibilisationPage         from '../components/patient/SensibilisationPage';
import ConstantesVitalesPatientPage from '../components/patient/ConstantesVitalesPatientPage';
import ChatbotWidget               from '../components/patient/ChatbotWidget';

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const PATIENT_FALLBACK = {
  dossier: {
    groupe_sanguin: 'O+',
    allergies: 'Pénicilline',
  },
  prescriptions: [
    { id: 1, statut: 'active' },
    { id: 2, statut: 'active' },
    { id: 3, statut: 'terminee' },
  ],
  resultats: [
    { id: 1, statut: 'disponible' },
    { id: 2, statut: 'disponible' },
  ],
  rendezVous: [
    { id: 1, date_heure: '2026-04-08T10:00:00', motif: 'Suivi traitement', type: 'presentiel', status: 'confirme', medecin: 'Dr. Ndiaye Moussa', centre: 'Centre de Santé Médina' },
    { id: 2, date_heure: '2026-04-14T15:30:00', motif: 'Téléconsultation', type: 'teleconsultation', status: 'planifie', medecin: 'Dr. Diallo Aminata', centre: 'DocSecur en ligne' },
  ],
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const DashboardHome = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [summary, setSummary] = useState({
    prescriptions: 0,
    rendezVous: 0,
    resultats: 0,
    groupeSanguin: '—',
    allergies: 'Non renseignées',
    prochainsRendezVous: [],
  });

  const cards = [
    { icon: <FiFileText size={22} />,  label: t('nav.dossier_medical'),     color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', to: '/patient/dossier',         desc: 'Votre historique médical' },
    { icon: <FiCalendar size={22} />,  label: t('nav.rendez_vous'),         color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', to: '/patient/rendez-vous',     desc: 'Prochains rendez-vous' },
    { icon: <FiClipboard size={22} />, label: t('nav.prescriptions'),       color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', to: '/patient/prescriptions',   desc: 'Ordonnances & traitements' },
    { icon: <FiActivity size={22} />,  label: t('nav.resultats'),           color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', to: '/patient/resultats',       desc: 'Résultats d\'analyses' },
    { icon: <FiBookOpen size={22} />,  label: 'Sensibilisation',            color: '#0891B2', bg: '#F0FDFA', border: '#99F6E4', to: '/patient/sensibilisation', desc: 'Santé & prévention' },
    { icon: <FiPackage size={22} />,   label: t('nav.carnet_vaccination'),  color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', to: '/patient/vaccination',     desc: 'Historique vaccinal' },
    { icon: <FiVideo size={22} />,     label: t('nav.teleconsultation'),    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', to: '/patient/teleconsultations',desc: 'Consultation en ligne' },
  ];

  useEffect(() => {
    Promise.all([
      getMonDossier().catch(() => PATIENT_FALLBACK.dossier),
      getMesPrescriptions().catch(() => PATIENT_FALLBACK.prescriptions),
      getMesResultats().catch(() => PATIENT_FALLBACK.resultats),
      getMesRendezVous().catch(() => PATIENT_FALLBACK.rendezVous),
    ])
      .then(([dossierRes, prescriptionsRes, resultatsRes, rendezVousRes]) => {
        const dossier = dossierRes?.data?.dossier || dossierRes?.data || dossierRes || {};
        const prescriptions = normalizeCollection(prescriptionsRes);
        const resultats = normalizeCollection(resultatsRes);
        const rendezVous = normalizeCollection(rendezVousRes)
          .filter((rdv) => rdv?.date_heure)
          .sort((a, b) => new Date(a.date_heure) - new Date(b.date_heure));

        setSummary({
          prescriptions: prescriptions.length,
          rendezVous: rendezVous.filter((rdv) => ['planifie', 'confirme'].includes(rdv.status)).length,
          resultats: resultats.length,
          groupeSanguin: dossier?.groupe_sanguin || '—',
          allergies: dossier?.allergies || 'Non renseignées',
          prochainsRendezVous: rendezVous.slice(0, 2),
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 3, fontWeight: 500 }}>
            {getGreeting()},
          </p>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            {user?.prenom} {user?.nom}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageSwitcher />
          <div style={avatarStyle}>{(user?.prenom || '?')[0].toUpperCase()}</div>
        </div>
      </div>

      {/* Bannière santé */}
      <div style={healthBannerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={heartIconStyle}><FiHeart size={18} color="#DC2626" /></div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: '#111827' }}>
              Votre santé au centre de nos priorités
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Toutes vos informations médicales sécurisées en un seul endroit
            </div>
          </div>
        </div>
        <span style={statusBadgeStyle}>Actif</span>
      </div>

      <div style={summaryGridStyle}>
        {[
          { label: 'Prescriptions', value: summary.prescriptions, hint: 'actives et passées', color: '#16A34A' },
          { label: 'Rendez-vous', value: summary.rendezVous, hint: 'à venir', color: '#15803D' },
          { label: 'Résultats', value: summary.resultats, hint: 'disponibles', color: '#22C55E' },
          { label: 'Groupe sanguin', value: summary.groupeSanguin, hint: summary.allergies, color: '#166534' },
        ].map((item, index) => (
          <div key={item.label} style={{ ...summaryCardStyle, animation: `slideUp 0.4s ease ${index * 60}ms both` }}>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {item.label}
            </div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: item.color }}>
              {item.value}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{item.hint}</div>
          </div>
        ))}
      </div>

      <div style={nextPanelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Prochains rendez-vous</h2>
          <Link to="/patient/rendez-vous" style={nextPanelLinkStyle}>Voir l’agenda</Link>
        </div>
        {summary.prochainsRendezVous.length === 0 ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Aucun rendez-vous planifié pour le moment.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {summary.prochainsRendezVous.map((rdv) => {
              const date = new Date(rdv.date_heure);
              return (
                <div key={rdv.id} style={nextAppointmentCardStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{rdv.motif || 'Consultation'}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                      {date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                      {rdv.medecin || 'Médecin DocSecur'} · {rdv.centre || 'Centre de santé'}
                    </div>
                  </div>
                  <span style={appointmentTypeStyle}>
                    {rdv.type === 'teleconsultation' ? 'Téléconsultation' : 'Présentiel'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grille de navigation */}
      <div style={{ marginBottom: 16 }}>
        <h2 className="section-title">Accès rapide</h2>
      </div>
      <div style={quickAccessGrid}>
        {cards.map((card, i) => (
          <Link
            key={i}
            to={card.to}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                ...quickCardStyle,
                background: card.bg,
                border: `1px solid ${card.border}`,
                animation: `slideUp 0.4s ease ${i * 60}ms both`,
              }}
            >
              <div style={{ ...cardIconStyle, color: card.color }}>
                {card.icon}
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{card.desc}</div>
              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: card.color, letterSpacing: '0.3px' }}>
                ACCÉDER →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Profil */}
      <div style={profilePanelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827' }}>
            Mon profil
          </span>
        </div>
        <div style={infoGridStyle}>
          {[
            { label: 'Nom complet', value: `${user?.prenom || ''} ${user?.nom || ''}` },
            { label: 'Téléphone',   value: user?.telephone || '—' },
            { label: 'Email',       value: user?.email || '—' },
            { label: 'Rôle',        value: 'Patient' },
          ].map((info, i) => (
            <div key={i} style={infoItemStyle}>
              <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                {info.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{info.value}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
};

const PatientDashboard = () => (
  <div className="layout">
    <Sidebar />
    <div className="main-content">
      <Routes>
        <Route index                      element={<DashboardHome />} />
        <Route path="dossier"             element={<DossierMedicalPage />} />
        <Route path="rendez-vous"         element={<RendezVousPatientPage />} />
        <Route path="prescriptions"       element={<PrescriptionsPatientPage />} />
        <Route path="resultats"           element={<ResultatsPatientPage />} />
        <Route path="vaccination"         element={<CarnetVaccinationPage />} />
        <Route path="teleconsultations"   element={<TeleconsultationPatientPage />} />
        <Route path="sensibilisation"     element={<SensibilisationPage />} />
        <Route path="constantes-vitales"  element={<ConstantesVitalesPatientPage />} />
      </Routes>
    </div>
    <ChatbotWidget />
  </div>
);

/* ── Styles ── */
const avatarStyle = {
  width: 40, height: 40, borderRadius: '50%',
  background: '#16A34A', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16,
};

const healthBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  marginBottom: 28,
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 12,
};

const heartIconStyle = {
  width: 36, height: 36,
  borderRadius: 9,
  background: '#fff',
  border: '1px solid #FECACA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const statusBadgeStyle = {
  padding: '3px 10px',
  background: '#F0FDF4',
  color: '#16A34A',
  border: '1px solid #BBF7D0',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
  marginBottom: 24,
};

const summaryCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #DCFCE7',
  borderRadius: 14,
  padding: '18px 18px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const nextPanelStyle = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '20px 22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  marginBottom: 28,
};

const nextPanelLinkStyle = {
  color: '#16A34A',
  fontSize: 12,
  fontWeight: 700,
  textDecoration: 'none',
};

const nextAppointmentCardStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
};

const appointmentTypeStyle = {
  padding: '5px 10px',
  borderRadius: 999,
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  color: '#16A34A',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const quickAccessGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 14,
  marginBottom: 28,
};

const quickCardStyle = {
  borderRadius: 12,
  padding: '18px 16px',
  cursor: 'pointer',
  transition: 'all 0.18s ease',
};

const cardIconStyle = {
  marginBottom: 10,
};

const profilePanelStyle = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '20px 22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const infoItemStyle = {
  padding: '12px 14px',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
};

export default PatientDashboard;
