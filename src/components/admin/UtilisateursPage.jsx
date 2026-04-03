import { useState, useEffect, useCallback } from 'react';
import { getUtilisateurs, creerUtilisateur, modifierUtilisateur, supprimerUtilisateur } from '../../api/adminAPI';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiUser, FiMail, FiPhone, FiLock, FiRefreshCw } from 'react-icons/fi';
import {
  adminCloseButton,
  adminDangerButton,
  adminEmptyState,
  adminInput,
  adminLabel,
  adminModalBox,
  adminModalHeader,
  adminModalTitle,
  adminOverlay,
  adminPalette,
  adminPrimaryButton,
  adminRefreshButton,
  adminSearchInput,
  adminSearchWrap,
  adminSecondaryButton,
  adminSpinner,
  adminSubStyle,
  adminTableCard,
  adminTableCell,
  adminTableHead,
  adminTitleStyle,
  makeFilterTab,
  makeIconButton,
  makeSoftBadge,
} from './adminTheme';

const ROLES = ['patient', 'medecin', 'pharmacien', 'laborantin', 'administrateur'];
const ROLE_COLORS = { patient: '#38BDF8', medecin: '#0ED2A0', pharmacien: '#A78BFA', laborantin: '#FBBF24', administrateur: '#F87171' };

const initForm = { nom: '', prenom: '', email: '', password: '', telephone: '', role: 'patient' };

export default function UtilisateursPage() {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(initForm);
  const [saving, setSaving]     = useState(false);
  const [confirm, setConfirm]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const res = await getUtilisateurs(params);
      const d = res.data;
      setUsers(d.data || d);
      setTotal(d.total || (d.data || d).length);
    } catch { toast.error('Erreur de chargement'); }
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(initForm); setModal(true); };
  const openEdit   = (u)  => { setEditing(u); setForm({ nom: u.nom, prenom: u.prenom, email: u.email, password: '', telephone: u.telephone || '', role: u.role }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await modifierUtilisateur(editing.id, payload);
        toast.success('Utilisateur modifié');
      } else {
        await creerUtilisateur(form);
        toast.success('Utilisateur créé');
      }
      setModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(', ')
        : 'Erreur';
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await supprimerUtilisateur(id);
      toast.success('Utilisateur supprimé');
      setConfirm(null);
      load();
    } catch { toast.error('Erreur suppression'); }
  };

  const toggleActif = async (u) => {
    try {
      await modifierUtilisateur(u.id, { est_actif: !u.est_actif });
      toast.success(u.est_actif ? 'Compte désactivé' : 'Compte activé');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={titleStyle}>Utilisateurs</h1>
          <p style={subStyle}>{total} utilisateur{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <FiPlus /> Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <div style={filterRow}>
        <div style={searchWrap}>
          <FiSearch color={adminPalette.textSubtle} size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom, email…"
            style={searchInput}
          />
        </div>
        <div style={roleTabs}>
          <button onClick={() => setRole('')} style={roleTab(roleFilter === '')}>Tous</button>
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)} style={roleTab(roleFilter === r)}>
              <span style={{ color: ROLE_COLORS[r] }}>●</span> {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={load} style={refreshBtn} title="Rafraîchir">
          <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Table */}
      <div style={tableCard}>
        {loading ? (
          <div style={emptyState}><div style={spinner} /></div>
        ) : users.length === 0 ? (
          <div style={emptyState}>
            <FiUser size={40} color="#BBF7D0" />
            <p style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {['Utilisateur', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ ...avatarSmall, background: `linear-gradient(135deg, ${ROLE_COLORS[u.role] || '#0ED2A0'} 0%, ${ROLE_COLORS[u.role] || '#38BDF8'}88 100%)` }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.prenom} {u.nom}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>ID #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.telephone || '—'}</td>
                  <td style={tdStyle}>
                    <span style={rolePill(u.role)}>{u.role}</span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => toggleActif(u)} style={statusBtn(u.est_actif)}>
                      {u.est_actif ? '● Actif' : '○ Inactif'}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(u)} style={iconBtn('#38BDF8')} title="Modifier">
                        <FiEdit2 size={14} />
                      </button>
                      <button onClick={() => setConfirm(u)} style={iconBtn('#F87171')} title="Supprimer">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal créer/modifier */}
      {modal && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>{editing ? 'Modifier' : 'Créer'} un utilisateur</h2>
              <button onClick={() => setModal(false)} style={closeBtn}><FiX /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={grid2}>
                <Field icon={<FiUser size={14}/>} label="Nom" value={form.nom} onChange={v => setForm({...form, nom: v})} placeholder="Diallo" required />
                <Field icon={<FiUser size={14}/>} label="Prénom" value={form.prenom} onChange={v => setForm({...form, prenom: v})} placeholder="Moussa" required />
              </div>
              <Field icon={<FiMail size={14}/>} label="Email" type="email" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="moussa@docsecur.sn" required />
              <Field icon={<FiPhone size={14}/>} label="Téléphone" value={form.telephone} onChange={v => setForm({...form, telephone: v})} placeholder="+221 77 000 00 00" />
              <Field icon={<FiLock size={14}/>} label={editing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} type="password" value={form.password} onChange={v => setForm({...form, password: v})} placeholder="••••••••" required={!editing} />
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Rôle</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={inputStyle}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Annuler</button>
                <button type="submit" disabled={saving} style={btnPrimary}>
                  {saving ? 'Enregistrement…' : editing ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirm && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div style={{ ...modalBox, maxWidth: 420 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                Supprimer l'utilisateur ?
              </h3>
              <p style={{ fontSize: 14, color: '#6B7280' }}>
                <strong style={{ color: '#111827' }}>{confirm.prenom} {confirm.nom}</strong> sera définitivement supprimé.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirm(null)} style={{ ...btnCancel, flex: 1 }}>Annuler</button>
              <button onClick={() => handleDelete(confirm.id)} style={{ ...btnDanger, flex: 1 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        table tr:hover td { background: #F8FAFC; }
      `}</style>
    </div>
  );
}

const Field = ({ icon, label, type = 'text', value, onChange, placeholder, required }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{label}</label>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && <span style={{ position: 'absolute', left: 13, color: adminPalette.textSubtle, zIndex: 1 }}>{icon}</span>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{ ...inputStyle, paddingLeft: icon ? 38 : 14 }}
        onFocus={e => { e.target.style.borderColor = '#0ED2A0'; e.target.style.boxShadow = '0 0 0 3px rgba(14,210,160,0.15)'; }}
        onBlur={e => { e.target.style.borderColor = adminPalette.border; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  </div>
);

// Styles
const titleStyle = adminTitleStyle;
const subStyle = adminSubStyle;
const btnPrimary = adminPrimaryButton;
const filterRow = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' };
const searchWrap = { ...adminSearchWrap, flex: 1, minWidth: 220 };
const searchInput = adminSearchInput;
const roleTabs = { display: 'flex', gap: 6, flexWrap: 'wrap' };
const roleTab = active => makeFilterTab(active);
const refreshBtn = adminRefreshButton;
const tableCard = adminTableCard;
const thStyle = adminTableHead;
const tdStyle = adminTableCell;
const trStyle = { transition: 'background 0.15s' };
const avatarSmall = { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 };
const rolePill = role => makeSoftBadge(ROLE_COLORS[role] || adminPalette.primarySoft);
const statusBtn = active => ({
  ...makeSoftBadge(active ? '#16A34A' : '#6B7280'),
  background: active ? '#F0FDF4' : '#F9FAFB',
  cursor: 'pointer',
});
const iconBtn = (color) => ({ ...makeIconButton(color), transition: 'all 0.2s' });
const emptyState = { ...adminEmptyState, padding: '60px 20px' };
const spinner = adminSpinner;
const overlay = adminOverlay;
const modalBox = adminModalBox;
const modalHeader = adminModalHeader;
const modalTitle = adminModalTitle;
const closeBtn = adminCloseButton;
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const labelStyle = adminLabel;
const inputStyle = adminInput;
const btnCancel = adminSecondaryButton;
const btnDanger = adminDangerButton;
