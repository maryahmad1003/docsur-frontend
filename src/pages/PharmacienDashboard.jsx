import { Routes, Route, Link } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useEffect, useState } from 'react';
import { FiFileText, FiCheckCircle, FiClock, FiPackage, FiTrendingUp } from 'react-icons/fi';
import OrdonnancesPage from '../components/pharmacien/OrdonnancesPage';
import { getOrdonnances } from '../api/pharmacienAPI';
import { normalizeCollection, formatGeneratedRef } from '../utils/apiData';

const normalizeOrdonnance = (item) => ({
  id: item.id,
  ref: item.ref || item.numero || formatGeneratedRef('ORD', item.id),
  statut: item.statut || 'en_attente',
  patient: {
    nom: item.patient?.nom || item.consultation?.dossierMedical?.patient?.user?.nom || '',
    prenom: item.patient?.prenom || item.consultation?.dossierMedical?.patient?.user?.prenom || '',
  },
  medicaments: Array.isArray(item.medicaments) ? item.medicaments : [],
});

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const DashboardHome = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total: 0,
    delivrees: 0,
    attente: 0,
    references: 0,
    recentes: [],
  });

  useEffect(() => {
    getOrdonnances()
      .then((response) => {
        const ordonnances = normalizeCollection(response).map(normalizeOrdonnance);
        const enAttente = ordonnances.filter((item) => item.statut === 'en_attente');
        const delivrees = ordonnances.filter((item) => item.statut === 'delivree');
        const references = new Set(
          ordonnances.flatMap((item) => (item.medicaments || []).map((medicament) => medicament.nom))
        );

        setStats({
          total: ordonnances.length,
          delivrees: delivrees.length,
          attente: enAttente.length,
          references: references.size,
          recentes: enAttente.slice(0, 4),
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subGreetStyle}>{getGreeting()},</p>
          <h1 style={pageTitleStyle}>Pharmacien {user?.prenom}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LanguageSwitcher />
          <div style={avatarStyle}>{(user?.prenom || '?')[0].toUpperCase()}</div>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { icon: <FiFileText size={22} />,    label: t('ordonnances'),   value: stats.total,     color: '#16A34A', delay: 0,   sub: 'ordonnances totales' },
          { icon: <FiCheckCircle size={22} />, label: 'Délivrées',         value: stats.delivrees, color: '#0ED2A0', delay: 80,  sub: 'traitées avec succès' },
          { icon: <FiClock size={22} />,       label: 'En attente',        value: stats.attente,   color: '#FBBF24', delay: 160, sub: 'à traiter aujourd’hui' },
          { icon: <FiPackage size={22} />,     label: 'Références',        value: stats.references,color: '#38BDF8', delay: 240, sub: 'médicaments prescrits' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ animation: `slideUp 0.5s ease ${s.delay}ms both` }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
            <div style={{ fontSize: 11, color: '#4B5563', marginTop: 5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={rowStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiTrendingUp color="#16A34A" size={16} />
            <span style={panelTitleStyle}>Ordonnances récentes</span>
          </div>
          {stats.recentes.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💊</div>
              <div style={{ fontSize: 13, color: '#4B5563', textAlign: 'center' }}>
                Aucune ordonnance<br />en attente de traitement
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentes.map((ordonnance) => (
                <div key={ordonnance.id} style={recentItemStyle}>
                  <div>
                    <div style={recentRefStyle}>{ordonnance.ref || `ORD-${ordonnance.id}`}</div>
                    <div style={recentPatientStyle}>
                      {ordonnance.patient?.prenom} {ordonnance.patient?.nom}
                    </div>
                    <div style={recentMetaStyle}>
                      {(ordonnance.medicaments || []).length} médicament{(ordonnance.medicaments || []).length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <span style={waitingBadgeStyle}>En attente</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FiPackage color="#38BDF8" size={16} />
            <span style={panelTitleStyle}>Accès rapide</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Voir toutes les ordonnances', color: '#16A34A', to: '/pharmacien/ordonnances', meta: `${stats.total} document(s)` },
              { label: 'Valider une délivrance', color: '#0ED2A0', to: '/pharmacien/ordonnances', meta: `${stats.attente} en attente` },
              { label: 'Historique des délivrances', color: '#38BDF8', to: '/pharmacien/ordonnances', meta: `${stats.delivrees} délivrée(s)` },
            ].map((action, i) => (
              <Link key={i} to={action.to} style={{ textDecoration: 'none' }}>
                <div style={{ ...actionItem, borderLeftColor: action.color }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{action.label}</div>
                    <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>{action.meta}</div>
                  </div>
                  <span style={{ color: action.color }}>→</span>
                </div>
              </Link>
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

const PharmacienDashboard = () => (
  <div className="layout">
    <Sidebar />
    <div className="main-content">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="ordonnances" element={<OrdonnancesPage />} />
      </Routes>
    </div>
  </div>
);

const subGreetStyle = { fontSize: 13, color: '#4B5563', marginBottom: 4, fontWeight: 500 };
const pageTitleStyle = {
  fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
  color: '#111827',
};
const avatarStyle = {
  width: 44, height: 44, borderRadius: '50%',
  background: '#16A34A',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff',
};
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 };
const panelStyle = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 20, padding: '24px 26px', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
};
const panelHeaderStyle = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 };
const panelTitleStyle = { fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: '#111827' };
const emptyState = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', minHeight: 120, padding: 20,
};
const actionItem = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 14px', background: '#F9FAFB',
  borderRadius: 10, border: '1px solid #E5E7EB',
  borderLeft: '3px solid', cursor: 'pointer',
};
const recentItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  background: '#F9FAFB',
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  gap: 12,
};
const recentRefStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: '#16A34A',
  letterSpacing: '0.4px',
  marginBottom: 4,
};
const recentPatientStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#111827',
};
const recentMetaStyle = {
  fontSize: 11,
  color: '#4B5563',
  marginTop: 2,
};
const waitingBadgeStyle = {
  padding: '6px 10px',
  borderRadius: 999,
  background: '#FFFBEB',
  color: '#D97706',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

export default PharmacienDashboard;
