import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  FiHome, FiUsers, FiCalendar, FiFileText, FiVideo,
  FiActivity, FiBell, FiLogOut, FiSettings, FiBarChart2,
  FiClipboard, FiPackage, FiShield, FiHeart, FiBookOpen,
} from 'react-icons/fi';

const ROLE_META = {
  medecin:        { label: 'Médecin',        color: '#16A34A' },
  patient:        { label: 'Patient',         color: '#2563EB' },
  administrateur: { label: 'Administrateur',  color: '#DC2626' },
  pharmacien:     { label: 'Pharmacien',      color: '#7C3AED' },
  laborantin:     { label: 'Laborantin',      color: '#D97706' },
};

const Sidebar = () => {
  const { user, logoutUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const medecinLinks = [
    { to: '/medecin',                    icon: <FiHome />,      label: t('nav.dashboard') },
    { to: '/medecin/patients',           icon: <FiUsers />,     label: t('nav.patients') },
    { to: '/medecin/consultations',      icon: <FiClipboard />, label: t('nav.consultations') },
    { to: '/medecin/prescriptions',      icon: <FiFileText />,  label: t('nav.prescriptions') },
    { to: '/medecin/constantes-vitales', icon: <FiHeart />,     label: 'Constantes vitales' },
    { to: '/medecin/rendez-vous',        icon: <FiCalendar />,  label: t('nav.rendez_vous') },
    { to: '/medecin/teleconsultations',  icon: <FiVideo />,     label: t('nav.teleconsultation') },
    { to: '/medecin/analyses',           icon: <FiActivity />,  label: t('nav.resultats') },
  ];

  const patientLinks = [
    { to: '/patient',                   icon: <FiHome />,      label: t('nav.dashboard') },
    { to: '/patient/dossier',           icon: <FiFileText />,  label: t('nav.dossier_medical') },
    { to: '/patient/rendez-vous',       icon: <FiCalendar />,  label: t('nav.rendez_vous') },
    { to: '/patient/prescriptions',     icon: <FiClipboard />, label: t('nav.prescriptions') },
    { to: '/patient/resultats',         icon: <FiActivity />,  label: t('nav.resultats') },
    { to: '/patient/sensibilisation',   icon: <FiBookOpen />,  label: 'Sensibilisation' },
    { to: '/patient/vaccination',       icon: <FiPackage />,   label: t('nav.carnet_vaccination') },
    { to: '/patient/teleconsultations', icon: <FiVideo />,     label: t('nav.teleconsultation') },
  ];

  const adminLinks = [
    { to: '/admin',                icon: <FiHome />,      label: t('nav.dashboard') },
    { to: '/admin/utilisateurs',   icon: <FiUsers />,     label: t('nav.utilisateurs') },
    { to: '/admin/centres-sante',  icon: <FiSettings />,  label: t('nav.centres_sante') },
    { to: '/admin/campagnes',      icon: <FiBell />,      label: t('nav.campagnes') },
    { to: '/admin/statistiques',   icon: <FiBarChart2 />, label: t('nav.statistiques') },
  ];

  const pharmacienLinks = [
    { to: '/pharmacien',             icon: <FiHome />,     label: t('nav.dashboard') },
    { to: '/pharmacien/ordonnances', icon: <FiFileText />, label: t('nav.ordonnances') },
  ];

  const laborantinLinks = [
    { to: '/laborantin',             icon: <FiHome />,      label: t('nav.dashboard') },
    { to: '/laborantin/demandes',    icon: <FiClipboard />, label: 'Demandes' },
    { to: '/laborantin/resultats',   icon: <FiActivity />,  label: t('nav.resultats') },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'medecin':        return medecinLinks;
      case 'patient':        return patientLinks;
      case 'administrateur': return adminLinks;
      case 'pharmacien':     return pharmacienLinks;
      case 'laborantin':     return laborantinLinks;
      default:               return [];
    }
  };

  const meta = ROLE_META[user?.role] || { label: user?.role, color: '#16A34A' };
  const initials = `${(user?.prenom || '')[0] || ''}${(user?.nom || '')[0] || ''}`.toUpperCase();

  return (
    <aside style={sidebarStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={logoRowStyle}>
          <div style={logoIconStyle}>
            <FiShield size={18} color="#16A34A" />
          </div>
          <span style={logoTextStyle}>DocSecur</span>
        </div>

        {/* User card */}
        <div style={userCardStyle}>
          <div style={{ ...avatarStyle, background: meta.color }}>
            {initials || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={userNameStyle}>{user?.prenom} {user?.nom}</div>
            <span style={{ ...roleBadgeStyle, color: meta.color, background: `${meta.color}15`, borderColor: `${meta.color}30` }}>
              {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={navStyle}>
        <div style={navSectionLabel}>Navigation</div>
        {getLinks().map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to.split('/').length === 2}
            style={({ isActive }) => isActive ? { ...navLinkStyle, ...navLinkActiveStyle } : navLinkStyle}
          >
            <span style={iconWrapStyle}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}

        <div style={{ ...navSectionLabel, marginTop: 18 }}>Compte</div>
        <NavLink to="/notifications" style={({ isActive }) => isActive ? { ...navLinkStyle, ...navLinkActiveStyle } : navLinkStyle}>
          <span style={iconWrapStyle}><FiBell /></span>
          {t('nav.notifications')}
        </NavLink>
        <NavLink to="/profil" style={({ isActive }) => isActive ? { ...navLinkStyle, ...navLinkActiveStyle } : navLinkStyle}>
          <span style={iconWrapStyle}><FiSettings /></span>
          {t('nav.profil')}
        </NavLink>
      </nav>

      {/* Logout */}
      <div style={footerStyle}>
        <button
          onClick={handleLogout}
          style={logoutBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FEF2F2';
            e.currentTarget.style.color = '#DC2626';
            e.currentTarget.style.borderColor = '#FECACA';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.color = '#6B7280';
            e.currentTarget.style.borderColor = '#E5E7EB';
          }}
        >
          <FiLogOut size={15} />
          {t('auth.logout')}
        </button>
      </div>
    </aside>
  );
};

const sidebarStyle = {
  width: 260,
  background: '#FFFFFF',
  borderRight: '1px solid #E5E7EB',
  position: 'fixed',
  top: 0, left: 0, bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  zIndex: 100,
  boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
};

const headerStyle = {
  padding: '22px 16px 16px',
  borderBottom: '1px solid #E5E7EB',
  flexShrink: 0,
};

const logoRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 18,
};

const logoIconStyle = {
  width: 36, height: 36,
  borderRadius: 9,
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const logoTextStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 19,
  fontWeight: 800,
  color: '#16A34A',
};

const userCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
};

const avatarStyle = {
  width: 36, height: 36,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 800,
  fontSize: 13,
  color: '#fff',
  flexShrink: 0,
};

const userNameStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginBottom: 3,
};

const roleBadgeStyle = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 20,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  border: '1px solid',
};

const navStyle = {
  flex: 1,
  padding: '10px 8px',
  overflowY: 'auto',
};

const navSectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  padding: '0 8px',
  marginBottom: 4,
  marginTop: 8,
};

const navLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 12px',
  margin: '1px 0',
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 500,
  color: '#6B7280',
  transition: 'all 0.15s ease',
  border: '1px solid transparent',
  textDecoration: 'none',
};

const navLinkActiveStyle = {
  background: '#F0FDF4',
  color: '#16A34A',
  borderColor: '#BBF7D0',
  fontWeight: 600,
};

const iconWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 16,
  flexShrink: 0,
};

const footerStyle = {
  padding: '12px 8px',
  borderTop: '1px solid #E5E7EB',
  flexShrink: 0,
};

const logoutBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
  color: '#6B7280',
  fontSize: 13.5,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export default Sidebar;
