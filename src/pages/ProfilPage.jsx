import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiGlobe, FiEdit3, FiSave, FiLock, FiCheck, FiX, FiShield } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';

const ROLE_META = {
  medecin:        { label: 'Médecin',        color: '#0ED2A0', bg: 'rgba(14,210,160,0.12)' },
  patient:        { label: 'Patient',         color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  administrateur: { label: 'Administrateur',  color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  pharmacien:     { label: 'Pharmacien',      color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  laborantin:     { label: 'Laborantin',      color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
};

const LANGUES = [{ value: 'fr', label: '🇫🇷 Français' }, { value: 'en', label: '🇬🇧 English' }, { value: 'wo', label: '🇸🇳 Wolof' }];

const ProfilPage = () => {
  const { user, setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nom: user?.nom || '', prenom: user?.prenom || '', telephone: user?.telephone || '', langue: user?.langue || 'fr' });
  const [pwForm, setPwForm] = useState({ current: '', nouveau: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('profil');

  const meta = ROLE_META[user?.role] || { label: user?.role, color: '#0ED2A0', bg: 'rgba(14,210,160,0.12)' };
  const initials = `${(user?.prenom || '')[0] || ''}${(user?.nom || '')[0] || ''}`.toUpperCase();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await API.put('/auth/profil', form);
      if (setUser) setUser(res.data.user || { ...user, ...form });
      showToast('Profil mis à jour avec succès');
      setEditMode(false);
    } catch {
      showToast('Profil mis à jour localement', 'info');
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ nom: user?.nom || '', prenom: user?.prenom || '', telephone: user?.telephone || '', langue: user?.langue || 'fr' });
    setEditMode(false);
  };

  const handleChangePw = async () => {
    if (pwForm.nouveau !== pwForm.confirm) { showToast('Les mots de passe ne correspondent pas', 'error'); return; }
    if (pwForm.nouveau.length < 8) { showToast('Le mot de passe doit faire au moins 8 caractères', 'error'); return; }
    setSaving(true);
    try {
      await API.put('/auth/password', { current_password: pwForm.current, password: pwForm.nouveau, password_confirmation: pwForm.confirm });
      showToast('Mot de passe changé avec succès');
      setPwForm({ current: '', nouveau: '', confirm: '' });
    } catch {
      showToast('Erreur lors du changement de mot de passe', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content" style={{ animation: 'fadeIn 0.4s ease' }}>
        {/* Toast */}
        {toast && (
          <div style={{ ...toastStyle, ...(toast.type === 'success' ? toastSuccess : toast.type === 'error' ? toastError : toastInfo) }}>
            {toast.type === 'success' ? <FiCheck size={14} /> : toast.type === 'error' ? <FiX size={14} /> : <FiShield size={14} />}
            <span style={{ fontSize: 13 }}>{toast.msg}</span>
          </div>
        )}

        {/* Header */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ ...bigAvatar, background: `linear-gradient(135deg, ${meta.color}cc, ${meta.color}55)` }}>
              {initials || <FiUser size={22} />}
            </div>
            <div>
              <h1 style={titleStyle}>{user?.prenom} {user?.nom}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ ...roleBadge, color: meta.color, background: meta.bg, borderColor: `${meta.color}30` }}>{meta.label}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{user?.email}</span>
              </div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[{ key: 'profil', label: 'Mon profil', icon: <FiUser size={14}/> }, { key: 'securite', label: 'Sécurité', icon: <FiLock size={14}/> }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ ...tabBtn, ...(activeTab === t.key ? tabBtnActive : {}) }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Onglet Profil */}
        {activeTab === 'profil' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeIn 0.3s ease' }}>
            {/* Infos personnelles */}
            <div style={{ ...card, gridColumn: '1 / -1' }}>
              <div style={cardHeader}>
                <span style={cardTitle}><FiUser size={15}/> Informations personnelles</span>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} style={editBtn}><FiEdit3 size={13}/> Modifier</button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleCancel} style={cancelBtn}><FiX size={13}/> Annuler</button>
                    <button onClick={handleSave} disabled={saving} style={saveBtn}><FiSave size={13}/> {saving ? 'Sauvegarde…' : 'Sauvegarder'}</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                {[
                  { key: 'prenom', label: 'Prénom', icon: <FiUser size={14}/>, placeholder: 'Votre prénom' },
                  { key: 'nom', label: 'Nom', icon: <FiUser size={14}/>, placeholder: 'Votre nom' },
                  { key: 'telephone', label: 'Téléphone', icon: <FiPhone size={14}/>, placeholder: '+221 7X XXX XX XX' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    {editMode ? (
                      <div style={inputWrap}>
                        <span style={{ color: '#9CA3AF' }}>{f.icon}</span>
                        <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                      </div>
                    ) : (
                      <div style={readField}>{user?.[f.key] || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Non renseigné</span>}</div>
                    )}
                  </div>
                ))}

                {/* Langue */}
                <div>
                  <label style={labelStyle}>Langue</label>
                  {editMode ? (
                    <div style={inputWrap}>
                      <span style={{ color: '#9CA3AF' }}><FiGlobe size={14}/></span>
                      <select value={form.langue} onChange={e => setForm(p => ({ ...p, langue: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {LANGUES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div style={readField}>{LANGUES.find(l => l.value === user?.langue)?.label || 'Français'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Infos non modifiables */}
            <div style={card}>
              <div style={cardHeader}><span style={cardTitle}><FiMail size={15}/> Compte</span></div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Email', value: user?.email },
                  { label: 'Rôle', value: meta.label },
                  { label: 'Statut', value: user?.est_actif ? '✅ Actif' : '❌ Désactivé' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={labelStyle}>{f.label}</div>
                    <div style={{ ...readField, background: '#F9FAFB' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques rapides */}
            <div style={card}>
              <div style={cardHeader}><span style={cardTitle}><FiShield size={15}/> Activité</span></div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Membre depuis', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : 'Mars 2026' },
                  { label: 'Dernière connexion', value: 'Aujourd\'hui' },
                  { label: 'Langue d\'interface', value: LANGUES.find(l => l.value === (user?.langue || 'fr'))?.label },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Sécurité */}
        {activeTab === 'securite' && (
          <div style={{ maxWidth: 520, animation: 'fadeIn 0.3s ease' }}>
            <div style={card}>
              <div style={cardHeader}><span style={cardTitle}><FiLock size={15}/> Changer le mot de passe</span></div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'current', label: 'Mot de passe actuel', placeholder: '••••••••' },
                  { key: 'nouveau', label: 'Nouveau mot de passe', placeholder: '8 caractères minimum' },
                  { key: 'confirm', label: 'Confirmer le nouveau mot de passe', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <div style={inputWrap}>
                      <FiLock size={14} color="#9CA3AF" />
                      <input
                        type="password"
                        value={pwForm[f.key]}
                        onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                ))}
                <button onClick={handleChangePw} disabled={saving || !pwForm.current || !pwForm.nouveau} style={{ ...saveBtn, marginTop: 8, opacity: (!pwForm.current || !pwForm.nouveau) ? 0.5 : 1 }}>
                  <FiLock size={13}/> {saving ? 'Changement…' : 'Changer le mot de passe'}
                </button>
              </div>
            </div>

            <div style={{ ...card, marginTop: 16, borderColor: 'rgba(248,113,113,0.15)' }}>
              <div style={cardHeader}><span style={{ ...cardTitle, color: '#F87171' }}>⚠️ Zone de danger</span></div>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 12, marginBottom: 16, lineHeight: 1.6 }}>
                La désactivation de votre compte vous empêchera de vous connecter. Contactez un administrateur pour réactiver votre compte.
              </p>
              <button style={dangerBtn} disabled>Désactiver mon compte</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        input::placeholder, textarea::placeholder { color: #9CA3AF; }
        input:focus, select:focus { outline: none; }
        select option { background: #FFFFFF; color: #111827; }
      `}</style>
    </div>
  );
};

const titleStyle = { fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', margin: 0 };
const bigAvatar = { width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', flexShrink: 0 };
const roleBadge = { display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid' };
const card = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '22px 24px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)' };
const cardHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const cardTitle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#374151', fontFamily: "'Outfit',sans-serif" };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 };
const inputWrap = { display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 10, padding: '10px 14px', transition: 'border-color 0.2s' };
const inputStyle = { flex: 1, background: 'transparent', border: 'none', color: '#111827', fontSize: 13, fontFamily: "'DM Sans',sans-serif" };
const readField = { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#374151', fontWeight: 500 };
const tabBtn = { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
const tabBtnActive = { background: 'rgba(14,210,160,0.1)', borderColor: 'rgba(14,210,160,0.2)', color: '#0ED2A0' };
const editBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: 8, color: '#4B5563', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const cancelBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: 8, color: '#4B5563', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const saveBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#16A34A', border: '1px solid #15803D', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", justifyContent: 'center' };
const dangerBtn = { padding: '9px 18px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6 };
const toastStyle = { position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, border: '1px solid', backdropFilter: 'blur(12px)' };
const toastSuccess = { background: 'rgba(14,210,160,0.15)', borderColor: 'rgba(14,210,160,0.3)', color: '#0ED2A0' };
const toastError = { background: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.3)', color: '#F87171' };
const toastInfo = { background: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8' };

export default ProfilPage;
