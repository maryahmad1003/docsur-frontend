import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, sendOtp, verifyOtp } from '../../api/authAPI';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiArrowRight, FiShield, FiPhone, FiKey, FiUser } from 'react-icons/fi';

const LoginForm = () => {
  const [activeTab, setActiveTab]     = useState('pro');   // 'pro' | 'patient'
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [phone, setPhone]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [otpSent, setOtpSent]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);

  const { loginUser } = useAuth();
  const navigate = useNavigate();
  useTranslation();

  /* ── Connexion professionnels (email + mot de passe) ── */
  const handleProLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      loginUser(res.data.user, res.data.token);
      toast.success(res.data.message || 'Connexion réussie');
      const role = res.data.user.role;
      navigate(`/${role === 'administrateur' ? 'admin' : role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects');
    }
    setLoading(false);
  };

  /* ── Envoi OTP patient ── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error('Saisissez votre numéro de téléphone'); return; }
    setLoading(true);
    try {
      await sendOtp({ telephone: phone });
      setOtpSent(true);
      toast.success('Code OTP envoyé par SMS!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi du code OTP');
    }
    setLoading(false);
  };

  /* ── Vérification OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOtp({ telephone: phone, code: otp });
      loginUser(res.data.user, res.data.token);
      toast.success(res.data.message || 'Connexion réussie');
      navigate('/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code OTP incorrect');
    }
    setLoading(false);
  };

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>

        {/* ── Panneau gauche ── */}
        <div style={leftPanelStyle}>
          <div style={brandAreaStyle}>
            <div style={logoMarkStyle}>
              <FiShield size={24} color="#16A34A" />
            </div>
            <span style={brandNameStyle}>DocSecur</span>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={heroTitleStyle}>
              Votre santé,<br />
              <span style={{ color: '#16A34A' }}>sécurisée.</span>
            </h2>
            <p style={heroSubStyle}>
              Plateforme numérique sécurisée de gestion des dossiers médicaux au Sénégal.
            </p>
          </div>

          <div style={pillsStyle}>
            {[
              { icon: '🔒', text: 'Données chiffrées' },
              { icon: '🏥', text: 'Multi-établissements' },
              { icon: '🌍', text: 'FR · WO · EN' },
            ].map((p, i) => (
              <div key={i} style={pillStyle}>
                <span>{p.icon}</span>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{p.text}</span>
              </div>
            ))}
          </div>

          <div style={statusCardStyle}>
            <div style={statusDotStyle} />
            <div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Système actif</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>Protection en temps réel</div>
            </div>
          </div>
        </div>

        {/* ── Panneau droit — formulaire ── */}
        <div style={rightPanelStyle}>
          <div style={formCardStyle}>
            <h2 style={formTitleStyle}>Connexion</h2>
            <p style={formSubStyle}>Bienvenue sur DocSecur</p>

            {/* Onglets */}
            <div style={tabsStyle}>
              <button
                style={activeTab === 'pro' ? { ...tabBtnStyle, ...tabActivStyle } : tabBtnStyle}
                onClick={() => setActiveTab('pro')}
              >
                <FiUser size={14} /> Professionnel
              </button>
              <button
                style={activeTab === 'patient' ? { ...tabBtnStyle, ...tabActivStyle } : tabBtnStyle}
                onClick={() => setActiveTab('patient')}
              >
                <FiPhone size={14} /> Patient
              </button>
            </div>

            {/* ── Formulaire Professionnel ── */}
            {activeTab === 'pro' && (
              <form onSubmit={handleProLogin} style={{ marginTop: 24 }}>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Adresse email</label>
                  <div style={inputWrapperStyle}>
                    <FiMail size={15} style={inputIconStyle} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@docsecur.sn"
                      required
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.12)'; }}
                      onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Mot de passe</label>
                  <div style={inputWrapperStyle}>
                    <FiLock size={15} style={inputIconStyle} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      required
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.12)'; }}
                      onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={loading ? { ...submitBtnStyle, opacity: 0.7, cursor: 'not-allowed' } : submitBtnStyle}>
                  {loading ? <><span style={spinnerStyle} /> Connexion…</> : <>Se connecter <FiArrowRight /></>}
                </button>
              </form>
            )}

            {/* ── Formulaire Patient (OTP) ── */}
            {activeTab === 'patient' && (
              <div style={{ marginTop: 24 }}>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp}>
                    <div style={infoBannerStyle}>
                      <FiPhone size={14} color="#2563EB" />
                      <span style={{ fontSize: 13, color: '#1D4ED8' }}>
                        Connectez-vous avec votre numéro de téléphone
                      </span>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Numéro de téléphone</label>
                      <div style={inputWrapperStyle}>
                        <FiPhone size={15} style={inputIconStyle} />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+221 77 000 0000"
                          required
                          style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.12)'; }}
                          onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>
                    <button type="submit" style={submitBtnStyle}>
                      Envoyer le code OTP <FiArrowRight />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div style={{ ...infoBannerStyle, background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                      <FiKey size={14} color="#16A34A" />
                      <span style={{ fontSize: 13, color: '#15803D' }}>
                        Code envoyé au {phone} (vérifiez la notification toast)
                      </span>
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Code OTP à 6 chiffres</label>
                      <div style={inputWrapperStyle}>
                        <FiKey size={15} style={inputIconStyle} />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          required
                          style={{ ...inputStyle, letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
                          onFocus={(e) => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.12)'; }}
                          onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>
                    <button type="submit" style={submitBtnStyle}>
                      Vérifier le code <FiArrowRight />
                    </button>
                    <button
                      type="button"
                      style={{ ...submitBtnStyle, background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB', boxShadow: 'none', marginTop: 8 }}
                      onClick={() => setOtpSent(false)}
                    >
                      Changer le numéro
                    </button>
                  </form>
                )}
              </div>
            )}

            <p style={switchTextStyle}>
              Pas encore de compte ?{' '}
              <Link to="/register" style={{ color: '#16A34A', fontWeight: 600 }}>
                Créer un compte →
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ── Styles ── */
const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F0FDF4',
  padding: '24px',
};

const wrapperStyle = {
  display: 'flex',
  width: '100%',
  maxWidth: 900,
  minHeight: 560,
  borderRadius: 20,
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  background: '#fff',
};

const leftPanelStyle = {
  flex: '0 0 40%',
  background: '#F0FDF4',
  borderRight: '1px solid #D1FAE5',
  padding: '40px 32px',
  display: 'flex',
  flexDirection: 'column',
};

const brandAreaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 40,
};

const logoMarkStyle = {
  width: 42, height: 42,
  borderRadius: 11,
  background: '#fff',
  border: '1px solid #BBF7D0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(22,163,74,0.12)',
};

const brandNameStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 22,
  fontWeight: 800,
  color: '#16A34A',
};

const heroTitleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 34,
  fontWeight: 900,
  lineHeight: 1.2,
  color: '#111827',
  marginBottom: 14,
  letterSpacing: '-0.5px',
};

const heroSubStyle = {
  fontSize: 14,
  color: '#6B7280',
  lineHeight: 1.7,
  maxWidth: 240,
};

const pillsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 32,
  marginBottom: 24,
};

const pillStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '7px 12px',
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
};

const statusCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  background: '#fff',
  border: '1px solid #BBF7D0',
  borderRadius: 10,
  marginTop: 'auto',
};

const statusDotStyle = {
  width: 8, height: 8,
  borderRadius: '50%',
  background: '#16A34A',
  boxShadow: '0 0 6px #16A34A',
  flexShrink: 0,
  animation: 'pulse 2s ease-in-out infinite',
};

const rightPanelStyle = {
  flex: 1,
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 44px',
};

const formCardStyle = {
  width: '100%',
  maxWidth: 360,
};

const formTitleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 26,
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.5px',
  marginBottom: 4,
};

const formSubStyle = {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 0,
};

const tabsStyle = {
  display: 'flex',
  gap: 6,
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: 4,
  marginTop: 20,
};

const tabBtnStyle = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 7,
  border: 'none',
  background: 'transparent',
  fontSize: 13,
  fontWeight: 500,
  color: '#6B7280',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'all 0.15s ease',
};

const tabActivStyle = {
  background: '#fff',
  color: '#16A34A',
  fontWeight: 700,
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
};

const fieldGroupStyle = {
  marginBottom: 16,
};

const labelStyle = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: 6,
};

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputIconStyle = {
  position: 'absolute',
  left: 13,
  color: '#9CA3AF',
  pointerEvents: 'none',
  zIndex: 1,
};

const inputStyle = {
  width: '100%',
  padding: '11px 14px 11px 40px',
  borderRadius: 8,
  border: '1.5px solid #E5E7EB',
  background: '#fff',
  fontSize: 14,
  color: '#111827',
  transition: 'all 0.18s ease',
  outline: 'none',
};

const submitBtnStyle = {
  width: '100%',
  padding: '12px 20px',
  borderRadius: 8,
  background: '#16A34A',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Outfit', sans-serif",
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 2px 10px rgba(22,163,74,0.25)',
  transition: 'all 0.18s ease',
};

const spinnerStyle = {
  display: 'inline-block',
  width: 15, height: 15,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
};

const infoBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  background: '#EFF6FF',
  borderRadius: 8,
  border: '1px solid #BFDBFE',
  marginBottom: 16,
};


const switchTextStyle = {
  textAlign: 'center',
  fontSize: 13,
  color: '#9CA3AF',
};

export default LoginForm;
