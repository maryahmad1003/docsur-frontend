import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/authAPI';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiLock, FiUserCheck, FiArrowRight, FiShield } from 'react-icons/fi';

const ROLES = [
  { value: 'patient', label: 'Patient' },
];

const RegisterForm = () => {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', password: '',
    password_confirmation: '', telephone: '',
    role: 'patient', date_naissance: '', sexe: 'M',
  });
  const [loading, setLoading] = useState(false);
  const [patientWelcome, setPatientWelcome] = useState(null);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(form);
      loginUser(res.data.user, res.data.token);
      toast.success('Inscription réussie !');
      if (res.data.user.role === 'patient' && res.data.patient_qr_code) {
        setPatientWelcome({
          qrCode: res.data.patient_qr_code.qr_code,
          expiresAt: res.data.patient_qr_code.expires_at,
          numDossier: res.data.patient?.num_dossier,
          numeroDossierMedical: res.data.patient?.numero_dossier_medical,
        });
      } else {
        const role = res.data.user.role;
        navigate(`/${role === 'administrateur' ? 'admin' : role}`);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : "Erreur lors de l'inscription"
      );
    }
    setLoading(false);
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* Header */}
        <div style={headerStyle}>
          <div style={logoRowStyle}>
            <div style={logoMarkStyle}>
              <FiShield size={22} color="#16A34A" />
            </div>
            <span style={brandNameStyle}>DocSecur</span>
          </div>
          <h1 style={titleStyle}>Créer un compte</h1>
          <p style={subtitleStyle}>Rejoignez la plateforme médicale sécurisée du Sénégal</p>
        </div>

        <div style={selectorCardStyle}>
          <label style={selectorLabelStyle}>Type de compte</label>
          <select name="role" value={form.role} onChange={handleChange} style={selectorInputStyle}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Carte formulaire */}
        <div style={cardStyle}>
          <form onSubmit={handleSubmit}>
            <div style={grid2Style}>
              <Field icon={<FiUser size={15} />} label="Nom" name="nom" value={form.nom} onChange={handleChange} placeholder="Diallo" required />
              <Field icon={<FiUser size={15} />} label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Moussa" required />
            </div>

            <Field icon={<FiMail size={15} />} label="Adresse email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="moussa@docsecur.sn" required />
            <Field icon={<FiPhone size={15} />} label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} placeholder="+221 77 000 00 00" />

            <div style={grid2Style}>
              <Field icon={<FiLock size={15} />} label="Mot de passe" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
              <Field icon={<FiLock size={15} />} label="Confirmer" name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange} placeholder="••••••••" required />
            </div>

            {form.role === 'patient' && (
              <div style={patientSectionStyle}>
                <div style={patientLabelStyle}>
                  <span style={patientDotStyle} />
                  Informations patient
                </div>
                <div style={grid2Style}>
                  <Field label="Date de naissance" name="date_naissance" type="date" value={form.date_naissance} onChange={handleChange} required />
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Sexe</label>
                    <select name="sexe" value={form.sexe} onChange={handleChange} style={inputStyle}>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={loading ? { ...submitBtnStyle, opacity: 0.7, cursor: 'not-allowed' } : submitBtnStyle}
            >
              {loading
                ? <><span style={spinnerStyle} /> Inscription en cours…</>
                : <><FiUserCheck /> S'inscrire <FiArrowRight /></>
              }
            </button>
          </form>

          <p style={switchTextStyle}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#16A34A', fontWeight: 600 }}>Se connecter →</Link>
          </p>
        </div>
      </div>

      {patientWelcome && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && navigate('/patient')}>
          <div style={welcomeModalStyle}>
            <div style={welcomeBadgeStyle}>Compte patient cree</div>
            <h2 style={welcomeTitleStyle}>Votre QR code est disponible</h2>
            <p style={welcomeTextStyle}>
              Conservez ce QR code pour vos rendez-vous et l acces a vos informations patient.
            </p>

            <div style={qrCardStyle}>
              <img
                src={`data:image/svg+xml;base64,${patientWelcome.qrCode}`}
                alt="QR code patient"
                style={qrImageStyle}
              />
            </div>

            <div style={infoGridStyle}>
              <InfoItem label="Numero patient" value={patientWelcome.numDossier || '—'} />
              <InfoItem label="Dossier medical" value={patientWelcome.numeroDossierMedical || '—'} />
              <InfoItem label="Validite du QR" value={formatDate(patientWelcome.expiresAt)} />
            </div>

            <div style={welcomeActionsStyle}>
              <button type="button" style={secondaryBtnStyle} onClick={() => navigate('/patient')}>
                Fermer
              </button>
              <button type="button" style={submitBtnStyle} onClick={() => navigate('/patient')}>
                Acceder a mon espace
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const Field = ({ icon, label, name, type = 'text', value, onChange, placeholder, required }) => (
  <div style={fieldGroupStyle}>
    {label && <label style={labelStyle}>{label}</label>}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 13, color: '#4B5563', pointerEvents: 'none', zIndex: 1, display: 'flex' }}>
          {icon}
        </span>
      )}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{ ...inputStyle, paddingLeft: icon ? 40 : 14 }}
        onFocus={(e) => { e.target.style.borderColor = '#16A34A'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.12)'; }}
        onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div style={infoItemStyle}>
    <div style={infoLabelStyle}>{label}</div>
    <div style={infoValueStyle}>{value}</div>
  </div>
);

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

/* ── Styles (même charte que LoginForm) ── */
const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F0FDF4',
  padding: '32px 16px',
};

const containerStyle = {
  width: '100%',
  maxWidth: 640,
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: 24,
};

const logoRowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 16,
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

const titleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 30,
  fontWeight: 900,
  color: '#111827',
  letterSpacing: '-0.5px',
  marginBottom: 6,
};

const subtitleStyle = {
  fontSize: 14,
  color: '#4B5563',
};

const selectorCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #DCFCE7',
  borderRadius: 18,
  padding: 18,
  marginBottom: 20,
  boxShadow: '0 8px 24px rgba(22,163,74,0.06)',
};

const selectorLabelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#166534',
  marginBottom: 8,
};

const selectorInputStyle = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #BBF7D0',
  padding: '12px 14px',
  fontSize: 14,
  color: '#111827',
  background: '#F9FFFB',
  outline: 'none',
};

const cardStyle = {
  background: '#fff',
  borderRadius: 20,
  padding: '36px 40px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
  border: '1px solid #E5E7EB',
};

const grid2Style = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const fieldGroupStyle = {
  marginBottom: 16,
};

const labelStyle = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 700,
  color: '#4B5563',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 8,
  border: '1.5px solid #E5E7EB',
  background: '#fff',
  fontSize: 14,
  color: '#111827',
  transition: 'all 0.18s ease',
  outline: 'none',
};

const patientSectionStyle = {
  marginBottom: 16,
  padding: '16px 18px',
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: 12,
};

const patientLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 11.5,
  fontWeight: 700,
  color: '#16A34A',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: 14,
};

const patientDotStyle = {
  width: 7, height: 7,
  borderRadius: '50%',
  background: '#16A34A',
  boxShadow: '0 0 6px #16A34A',
  display: 'inline-block',
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
  marginTop: 8,
  boxShadow: '0 2px 10px rgba(22,163,74,0.25)',
  transition: 'all 0.18s ease',
};

const secondaryBtnStyle = {
  ...submitBtnStyle,
  width: 'auto',
  background: '#FFFFFF',
  color: '#166534',
  border: '1px solid #BBF7D0',
  boxShadow: 'none',
};

const spinnerStyle = {
  display: 'inline-block',
  width: 15, height: 15,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
};

const switchTextStyle = {
  textAlign: 'center',
  marginTop: 24,
  fontSize: 13,
  color: '#4B5563',
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  zIndex: 1000,
};

const welcomeModalStyle = {
  width: '100%',
  maxWidth: 520,
  background: '#FFFFFF',
  borderRadius: 24,
  padding: '28px 28px 24px',
  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)',
  border: '1px solid #DCFCE7',
  textAlign: 'center',
};

const welcomeBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 12px',
  borderRadius: 999,
  background: '#F0FDF4',
  color: '#166534',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 12,
};

const welcomeTitleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 28,
  fontWeight: 800,
  color: '#111827',
  margin: 0,
};

const welcomeTextStyle = {
  margin: '10px 0 20px',
  color: '#4B5563',
  fontSize: 14,
  lineHeight: 1.6,
};

const qrCardStyle = {
  background: '#F8FAFC',
  border: '1px solid #E5E7EB',
  borderRadius: 20,
  padding: 18,
  marginBottom: 18,
};

const qrImageStyle = {
  width: 220,
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
  margin: '0 auto',
};

const infoGridStyle = {
  display: 'grid',
  gap: 10,
  marginBottom: 18,
};

const infoItemStyle = {
  background: '#F9FFFB',
  border: '1px solid #DCFCE7',
  borderRadius: 14,
  padding: '12px 14px',
  textAlign: 'left',
};

const infoLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#166534',
  marginBottom: 4,
};

const infoValueStyle = {
  fontSize: 14,
  color: '#111827',
  wordBreak: 'break-word',
};

const welcomeActionsStyle = {
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
  flexWrap: 'wrap',
};

export default RegisterForm;
