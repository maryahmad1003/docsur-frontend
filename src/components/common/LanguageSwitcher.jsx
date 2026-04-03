import { useTranslation } from 'react-i18next';
import { changerLangue } from '../../api/authAPI';

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'wo', flag: '🇸🇳', label: 'WO' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleChange = async (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('langue', lng);
    try { await changerLangue({ langue: lng }); } catch (_) {}
  };

  return (
    <div style={wrapStyle}>
      {LANGS.map((lng) => {
        const isActive = i18n.language === lng.code;
        return (
          <button
            key={lng.code}
            onClick={() => handleChange(lng.code)}
            style={{
              ...btnStyle,
              ...(isActive ? activeBtnStyle : {}),
            }}
            onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)', e.currentTarget.style.color = 'rgba(238,244,255,0.8)')}
            onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)', e.currentTarget.style.color = 'rgba(238,244,255,0.4)')}
          >
            <span style={{ fontSize: 14 }}>{lng.flag}</span>
            <span>{lng.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const wrapStyle = {
  display: 'flex',
  gap: 6,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding: 4,
};

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 12px',
  borderRadius: 8,
  border: 'none',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(238,244,255,0.4)',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '0.3px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const activeBtnStyle = {
  background: 'rgba(14,210,160,0.15)',
  color: '#0ED2A0',
  border: '1px solid rgba(14,210,160,0.2)',
};

export default LanguageSwitcher;
