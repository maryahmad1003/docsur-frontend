import { useState, useEffect, useCallback } from 'react';
import { getCampagnes, creerCampagne, modifierCampagne, supprimerCampagne } from '../../api/adminAPI';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCalendar, FiRefreshCw, FiBell } from 'react-icons/fi';
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

const TYPES = ['prevention', 'vaccination', 'sensibilisation'];
const TYPE_LABELS = { prevention: 'Prévention', vaccination: 'Vaccination', sensibilisation: 'Sensibilisation' };
const TYPE_COLORS = { prevention: '#0ED2A0', vaccination: '#38BDF8', sensibilisation: '#A78BFA' };
const REGIONS = ['Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda', 'Ziguinchor', 'Kaffrine', 'Kédougou', 'Nationale'];

const initForm = { titre: '', description: '', date_debut: '', date_fin: '', cible: '', region: 'Dakar', type: 'prevention' };

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function CampagnesPage() {
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(initForm);
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(null);
  const [search, setSearch]       = useState('');
  const [typeFilter, setType]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCampagnes();
      const d = res.data;
      setCampagnes(d.data || d);
    } catch { toast.error('Erreur de chargement'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = campagnes.filter(c => {
    const matchSearch = c.titre?.toLowerCase().includes(search.toLowerCase()) || c.region?.toLowerCase().includes(search.toLowerCase());
    const matchType   = !typeFilter || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => { setEditing(null); setForm(initForm); setModal(true); };
  const openEdit   = c  => {
    setEditing(c);
    setForm({ titre: c.titre, description: c.description || '', date_debut: c.date_debut?.split('T')[0] || '', date_fin: c.date_fin?.split('T')[0] || '', cible: c.cible || '', region: c.region || 'Dakar', type: c.type });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await modifierCampagne(editing.id, form); toast.success('Campagne modifiée'); }
      else         { await creerCampagne(form); toast.success('Campagne créée'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await supprimerCampagne(id);
      toast.success('Campagne supprimée');
      setConfirm(null);
      load();
    } catch { toast.error('Erreur suppression'); }
  };

  const getStatus = (c) => {
    const now = new Date();
    const debut = new Date(c.date_debut);
    const fin = c.date_fin ? new Date(c.date_fin) : null;
    if (now < debut) return { label: 'À venir', color: '#FBBF24' };
    if (!fin || now <= fin) return { label: 'En cours', color: '#0ED2A0' };
    return { label: 'Terminée', color: '#9CA3AF' };
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 style={titleStyle}>Campagnes de santé</h1>
          <p style={subStyle}>{filtered.length} campagne{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={refreshBtn}>
            <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={openCreate} style={btnPrimary}><FiPlus /> Nouvelle campagne</button>
        </div>
      </div>

      {/* Filters */}
      <div style={filterRow}>
        <div style={searchWrap}>
          <FiBell color={adminPalette.textSubtle} size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une campagne…" style={searchInput} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setType('')} style={typeTab(!typeFilter)}>Tous</button>
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)} style={typeTab(typeFilter === t, TYPE_COLORS[t])}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={emptyState}><div style={spinnerEl} /></div>
      ) : filtered.length === 0 ? (
        <div style={emptyState}>
          <FiBell size={40} color="#BBF7D0" />
          <p style={{ color: '#4B5563', marginTop: 12, fontSize: 14 }}>Aucune campagne trouvée</p>
          <button onClick={openCreate} style={{ ...btnPrimary, marginTop: 20 }}><FiPlus /> Créer une campagne</button>
        </div>
      ) : (
        <div style={tableCard}>
          <table>
            <thead>
              <tr>
                {['Titre', 'Type', 'Région', 'Date début', 'Date fin', 'Cible', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const status = getStatus(c);
                return (
                  <tr key={c.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{c.titre}</div>
                      {c.description && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>}
                    </td>
                    <td style={tdStyle}><span style={typePill(c.type)}>{TYPE_LABELS[c.type] || c.type}</span></td>
                    <td style={{ ...tdStyle, color: '#4B5563' }}>{c.region || '—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiCalendar size={13} color={adminPalette.textSubtle} />
                        <span style={{ color: '#4B5563', fontSize: 13 }}>{formatDate(c.date_debut)}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#4B5563', fontSize: 13 }}>{formatDate(c.date_fin)}</td>
                    <td style={{ ...tdStyle, color: '#4B5563', fontSize: 13 }}>{c.cible || '—'}</td>
                    <td style={tdStyle}><span style={statusBadge(status.color)}>{status.label}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(c)} style={iconBtn('#38BDF8')}><FiEdit2 size={13} /></button>
                        <button onClick={() => setConfirm(c)} style={iconBtn('#F87171')}><FiTrash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>{editing ? 'Modifier' : 'Créer'} une campagne</h2>
              <button onClick={() => setModal(false)} style={closeBtn}><FiX /></button>
            </div>
            <form onSubmit={handleSave}>
              <Inp label="Titre de la campagne" value={form.titre} onChange={v => setForm({...form, titre: v})} placeholder="Campagne de vaccination contre la rougeole" required />
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description de la campagne…" rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => { e.target.style.borderColor = '#0ED2A0'; e.target.style.boxShadow = '0 0 0 3px rgba(14,210,160,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = adminPalette.border; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={grid2}>
                <Inp label="Date de début" type="date" value={form.date_debut} onChange={v => setForm({...form, date_debut: v})} required />
                <Inp label="Date de fin (optionnel)" type="date" value={form.date_fin} onChange={v => setForm({...form, date_fin: v})} />
              </div>
              <div style={grid2}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Région</label>
                  <select value={form.region} onChange={e => setForm({...form, region: e.target.value})} style={inputStyle}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <Inp label="Population cible (optionnel)" value={form.cible} onChange={v => setForm({...form, cible: v})} placeholder="Enfants de 0 à 5 ans" />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Annuler</button>
                <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Enregistrement…' : editing ? 'Modifier' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div style={{ ...modalBox, maxWidth: 400 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Supprimer cette campagne ?</h3>
              <p style={{ fontSize: 14, color: '#4B5563' }}><strong style={{ color: '#111827' }}>{confirm.titre}</strong> sera définitivement supprimée.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirm(null)} style={{ ...btnCancel, flex: 1 }}>Annuler</button>
              <button onClick={() => handleDelete(confirm.id)} style={{ ...btnDanger, flex: 1 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}} table tr:hover td{background:#F8FAFC}`}</style>
    </div>
  );
}

const Inp = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={inputStyle}
      onFocus={e => { e.target.style.borderColor = '#0ED2A0'; e.target.style.boxShadow = '0 0 0 3px rgba(14,210,160,0.15)'; }}
      onBlur={e => { e.target.style.borderColor = adminPalette.border; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

const titleStyle = adminTitleStyle;
const subStyle = adminSubStyle;
const btnPrimary = adminPrimaryButton;
const filterRow = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' };
const searchWrap = { ...adminSearchWrap, flex: 1, minWidth: 200 };
const searchInput = adminSearchInput;
const refreshBtn = adminRefreshButton;
const typeTab = (active, color = '#0ED2A0') => makeFilterTab(active, color);
const tableCard = adminTableCard;
const thStyle = adminTableHead;
const tdStyle = { ...adminTableCell, transition: 'background 0.15s' };
const typePill = type => makeSoftBadge(TYPE_COLORS[type] || adminPalette.primarySoft);
const statusBadge = color => makeSoftBadge(color);
const iconBtn = color => makeIconButton(color);
const emptyState = { ...adminEmptyState, padding: '80px 20px' };
const spinnerEl = adminSpinner;
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
