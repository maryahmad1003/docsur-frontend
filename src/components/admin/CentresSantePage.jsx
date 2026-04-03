import { useState, useEffect, useCallback } from 'react';
import { getCentresSante, creerCentreSante, modifierCentreSante, supprimerCentreSante } from '../../api/adminAPI';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiMapPin, FiPhone, FiRefreshCw, FiHome } from 'react-icons/fi';
import {
  adminCard,
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
  adminTitleStyle,
  makeIconButton,
  makeSoftBadge,
} from './adminTheme';

const TYPES = ['hopital', 'clinique', 'centre_sante', 'poste_sante'];
const TYPE_LABELS = { hopital: 'Hôpital', clinique: 'Clinique', centre_sante: 'Centre de santé', poste_sante: 'Poste de santé' };
const TYPE_COLORS = { hopital: '#F87171', clinique: '#0ED2A0', centre_sante: '#38BDF8', poste_sante: '#FBBF24' };
const REGIONS = ['Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda', 'Ziguinchor', 'Kaffrine', 'Kédougou'];

const initForm = { nom: '', adresse: '', telephone: '', type: 'centre_sante', region: 'Dakar', coordonnees_gps: '' };

export default function CentresSantePage() {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(initForm);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCentresSante();
      const d = res.data;
      setCentres(d.data || d);
    } catch { toast.error('Erreur de chargement'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = centres.filter(c =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.region?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(initForm); setModal(true); };
  const openEdit   = c  => { setEditing(c); setForm({ nom: c.nom, adresse: c.adresse, telephone: c.telephone || '', type: c.type, region: c.region, coordonnees_gps: c.coordonnees_gps || '' }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await modifierCentreSante(editing.id, form); toast.success('Centre modifié'); }
      else         { await creerCentreSante(form); toast.success('Centre créé'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await supprimerCentreSante(id);
      toast.success('Centre supprimé');
      setConfirm(null);
      load();
    } catch { toast.error('Erreur suppression'); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 style={titleStyle}>Centres de santé</h1>
          <p style={subStyle}>{filtered.length} centre{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={refreshBtn}>
            <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={openCreate} style={btnPrimary}>
            <FiPlus /> Nouveau centre
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={searchWrap}>
        <FiMapPin color={adminPalette.textSubtle} size={15} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou région…" style={searchInput} />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={emptyState}><div style={spinnerEl} /></div>
      ) : filtered.length === 0 ? (
        <div style={emptyState}>
          <FiHome size={40} color="#BBF7D0" />
          <p style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Aucun centre de santé trouvé</p>
        </div>
      ) : (
        <div style={cardsGrid}>
          {filtered.map(c => (
            <div key={c.id} style={centreCard}>
              <div style={cardTop}>
                <div style={{ flex: 1 }}>
                  <span style={typeBadge(c.type)}>{TYPE_LABELS[c.type] || c.type}</span>
                  <h3 style={centreNameStyle}>{c.nom}</h3>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(c)} style={iconBtn('#38BDF8')} title="Modifier"><FiEdit2 size={13} /></button>
                  <button onClick={() => setConfirm(c)} style={iconBtn('#F87171')} title="Supprimer"><FiTrash2 size={13} /></button>
                </div>
              </div>
              <div style={cardBody}>
                <div style={infoRow}><FiMapPin size={13} color="#0ED2A0" /><span>{c.adresse}</span></div>
                <div style={infoRow}><FiMapPin size={13} color="#A78BFA" /><span>{c.region}</span></div>
                {c.telephone && <div style={infoRow}><FiPhone size={13} color="#38BDF8" /><span>{c.telephone}</span></div>}
              </div>
              <div style={cardFooter}>
                <span style={medecinsBadge}>{c.medecins_count || 0} médecin{(c.medecins_count || 0) !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={modalBox}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>{editing ? 'Modifier' : 'Créer'} un centre</h2>
              <button onClick={() => setModal(false)} style={closeBtn}><FiX /></button>
            </div>
            <form onSubmit={handleSave}>
              <Inp label="Nom du centre" value={form.nom} onChange={v => setForm({...form, nom: v})} placeholder="Hôpital Fann" required />
              <Inp label="Adresse" value={form.adresse} onChange={v => setForm({...form, adresse: v})} placeholder="Avenue Cheikh Anta Diop, Dakar" required />
              <Inp label="Téléphone" value={form.telephone} onChange={v => setForm({...form, telephone: v})} placeholder="+221 33 000 00 00" />
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
              <Inp label="Coordonnées GPS (optionnel)" value={form.coordonnees_gps} onChange={v => setForm({...form, coordonnees_gps: v})} placeholder="14.7167° N, 17.4677° W" />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Annuler</button>
                <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Enregistrement…' : editing ? 'Modifier' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirm && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div style={{ ...modalBox, maxWidth: 400 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Supprimer ce centre ?</h3>
              <p style={{ fontSize: 14, color: '#6B7280' }}><strong style={{ color: '#111827' }}>{confirm.nom}</strong> sera définitivement supprimé.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirm(null)} style={{ ...btnCancel, flex: 1 }}>Annuler</button>
              <button onClick={() => handleDelete(confirm.id)} style={{ ...btnDanger, flex: 1 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
const refreshBtn = adminRefreshButton;
const searchWrap = { ...adminSearchWrap, marginBottom: 24 };
const searchInput = adminSearchInput;
const cardsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 };
const centreCard = { ...adminCard, overflow: 'hidden', transition: 'all 0.3s', cursor: 'default' };
const cardTop = { padding: '20px 20px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid #F1F5F9' };
const centreNameStyle = { fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 6 };
const typeBadge = type => makeSoftBadge(TYPE_COLORS[type] || adminPalette.primarySoft);
const cardBody = { padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 };
const infoRow = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280' };
const cardFooter = { padding: '12px 20px', background: '#F9FAFB', borderTop: '1px solid #F1F5F9' };
const medecinsBadge = { fontSize: 12, fontWeight: 600, color: '#6B7280' };
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
