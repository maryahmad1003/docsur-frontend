import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/authAPI';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiLock, FiUserCheck, FiArrowRight, FiShield } from 'react-icons/fi';

const ROLES = [
  { value: 'patient',        label: 'Patient',        icon: '🧑‍⚕️' },
  { value: 'medecin',        label: 'Médecin',        icon: '👨‍⚕️' },
  { value: 'pharmacien',     label: 'Pharmacien',     icon: '💊' },
  { value: 'laborantin',     label: 'Laborantin',     icon: '🔬' },
  { value: 'administrateur', label: 'Administrateur', icon: '🛡️' },
];

const RegisterForm = () => {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', password: '',
    password_confirmation: '', telephone: '',
    role: 'patient', date_naissance: '', sexe: 'M',
  });
  const [loading, setLoading] = useState(false);
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
      const role = res.data.user.role;
      navigate(`/${role === 'administrateur' ? 'admin' : role}`);
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

        {/* Sélecteur de rôle */}
        <div style={roleGridStyle}>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm({ ...form, role: r.value })}
              style={form.role === r.value ? { ...roleBtnStyle, ...roleBtnActiveStyle } : roleBtnStyle}
            >
              {r.icon} {r.label}
            </button>
          ))}
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
                  <Field label="Date de naissance" name="date_naissance" type="date" value={form.date_naissance} onChange={handleChange} />
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const Field = ({ icon, label, name, type = 'text', value, onChange, placeholder, required }) => (
  <div style={fieldGroupStyle}>
    {label && <label style={labelStyle}>{label}</label>}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 13, color: '#9CA3AF', pointerEvents: 'none', zIndex: 1, display: 'flex' }}>
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
  color: '#6B7280',
};

const roleGridStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginBottom: 20,
};

const roleBtnStyle = {
  padding: '8px 16px',
  borderRadius: 10,
  border: '1.5px solid #E5E7EB',
  background: '#fff',
  color: '#6B7280',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "'Outfit', sans-serif",
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const roleBtnActiveStyle = {
  border: '1.5px solid #16A34A',
  background: '#F0FDF4',
  color: '#16A34A',
  fontWeight: 700,
  boxShadow: '0 0 0 3px rgba(22,163,74,0.1)',
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
  color: '#6B7280',
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
  color: '#9CA3AF',
};

export default RegisterForm;
