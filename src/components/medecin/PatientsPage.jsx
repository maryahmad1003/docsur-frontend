import React, { useState, useEffect } from 'react';
import {
  FiUsers, FiSearch, FiEye, FiX, FiUser, FiPhone, FiCalendar, FiActivity, FiDroplet, FiPlus, FiCheckCircle, FiEdit2, FiSave
} from 'react-icons/fi';
import { getPatients, creerPatient, updatePatient } from '../../api/medecinAPI';
import { normalizeCollection } from '../../utils/apiData';

const normalizePatient = (patient) => ({
  ...patient,
  ref: patient.ref || patient.num_dossier,
  nom: patient.nom || patient.user?.nom || '',
  prenom: patient.prenom || patient.user?.prenom || '',
  telephone: patient.telephone || patient.user?.telephone || '',
});

function computeAge(dateStr) {
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getBloodBadge(groupe) {
  const map = {
    'A+':  { color: '#0ED2A0', bg: 'rgba(14,210,160,0.12)' },
    'O+':  { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
    'B+':  { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    'AB+': { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    'A-':  { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    'O-':  { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    'B-':  { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    'AB-': { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  };
  return map[groupe] || { color: '#4B5563', bg: '#F3F4F6' };
}

function getInitials(nom, prenom) {
  return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
}

const FORM_INIT = { nom: '', prenom: '', email: '', telephone: '', date_naissance: '', sexe: 'M', adresse: '', groupe_sanguin: '' };

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(FORM_INIT);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [motDePasse, setMotDePasse] = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [editData, setEditData]     = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getPatients();
        setPatients(normalizeCollection(data).map(normalizePatient));
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await creerPatient(form);
      const data = res.data;
      const p = data.patient;
      const nouveau = {
        id:             p.id,
        ref:            p.num_dossier,
        nom:            p.user?.nom    || form.nom,
        prenom:         p.user?.prenom || form.prenom,
        telephone:      p.user?.telephone || form.telephone,
        date_naissance: p.date_naissance,
        sexe:           p.sexe,
        groupe_sanguin: p.groupe_sanguin,
        adresse:        p.adresse,
        created_at:     p.created_at,
      };
      setPatients(prev => [nouveau, ...prev]);
      setMotDePasse(data.mot_de_passe);
      setForm(FORM_INIT);
      setShowForm(false);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const ouvrirEdit = (p) => {
    setEditData({
      adresse: p.adresse || '', groupe_sanguin: p.groupe_sanguin || '',
      taille: p.taille || '', poids: p.poids || '',
      profession: p.profession || '', situation_matrimoniale: p.situation_matrimoniale || '',
      nombre_enfants: p.nombre_enfants || '',
      antecedents_medicaux: p.antecedents_medicaux || '',
      antecedents_chirurgicaux: p.antecedents_chirurgicaux || '',
      antecedents_familiaux: p.antecedents_familiaux || '',
      allergies: p.allergies || '', traitement_en_cours: p.traitement_en_cours || '',
      assurance: p.assurance || '', numero_assurance: p.numero_assurance || '',
      personne_contact: p.personne_contact || '', tel_contact: p.tel_contact || '',
    });
    setEditMode(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePatient(selected.id, editData);
      setPatients(prev => prev.map(p => p.id === selected.id ? { ...p, ...editData } : p));
      setSelected(s => ({ ...s, ...editData }));
      setEditMode(false);
      showToast('Informations mises à jour');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      p.nom?.toLowerCase().includes(q) ||
      p.prenom?.toLowerCase().includes(q) ||
      p.ref?.toLowerCase().includes(q)
    );
  });

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const kpis = [
    { label: 'Total patients',    value: patients.length, color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)',   icon: <FiUsers size={18} /> },
    { label: 'Hommes',            value: patients.filter(p => p.sexe === 'M').length, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',   icon: <FiUser size={18} /> },
    { label: 'Femmes',            value: patients.filter(p => p.sexe === 'F').length, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', icon: <FiUser size={18} /> },
    { label: 'Ce mois',          value: patients.filter(p => p.created_at?.startsWith(thisMonth)).length, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', icon: <FiCalendar size={18} /> },
  ];

  return (
    <div style={pageStyle}>
      <style>{keyframesCSS}</style>

      {/* Toast */}
      {toast && (
        <div style={toastStyle}>{toast}</div>
      )}

      {/* Header */}
      <div style={headerRow}>
        <div>
          <h1 style={titleStyle}>Mes patients</h1>
          <p style={subtitleStyle}>{patients.length} patient{patients.length !== 1 ? 's' : ''} enregistré{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={addBtn} onClick={() => { setShowForm(true); setMotDePasse(null); }}>
          <FiPlus size={15} /> Nouveau patient
        </button>
      </div>

      {/* KPIs */}
      <div style={kpiGrid}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...kpiCard, animationDelay: `${i * 80}ms` }}>
            <div style={{ ...kpiIcon, color: k.color, background: k.bg }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={toolbarRow}>
        <div style={searchWrap}>
          <FiSearch size={15} color="#9CA3AF" />
          <input
            style={searchInput}
            placeholder="Rechercher par nom ou référence…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={clearBtn}>
              <FiX size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={tableCard}>
        {loading ? (
          <div style={emptyState}>
            <div style={spinner} />
            <p style={{ color: '#6B7280', marginTop: 16, fontSize: 13 }}>Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={emptyState}>
            <FiUsers size={40} color="#D1D5DB" />
            <p style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Aucun patient trouvé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Réf','Patient','Sexe','Date naissance','Groupe sanguin','Téléphone','Enregistrement','Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const bb = getBloodBadge(p.groupe_sanguin);
                return (
                  <tr
                    key={p.id}
                    style={{ ...trStyle, animationDelay: `${idx * 50}ms`, cursor: 'pointer' }}
                    onClick={() => setSelected(p)}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#6B7280', letterSpacing: '0.3px' }}>{p.ref}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={avatarSm}>{getInitials(p.nom, p.prenom)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.prenom} {p.nom}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: '#4B5563' }}>
                        {p.sexe === 'M' ? 'Masculin' : 'Féminin'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{formatDate(p.date_naissance)}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ ...badge, color: bb.color, background: bb.bg }}>{p.groupe_sanguin}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{p.telephone}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: '#4B5563' }}>{formatDate(p.created_at)}</span>
                    </td>
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      <button style={iconBtn} onClick={() => setSelected(p)} title="Voir détails">
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulaire ajout patient */}
      {showForm && (
        <div style={overlay} onClick={() => setShowForm(false)}>
          <div style={{ ...modal, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ ...titleStyle, fontSize: 18 }}>Nouveau patient</h2>
              <button style={closeBtn} onClick={() => setShowForm(false)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={formGrid}>
                <FormField label="Prénom *" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} />
                <FormField label="Nom *" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} />
                <FormField label="Email *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
                <FormField label="Téléphone" value={form.telephone} onChange={v => setForm(f => ({ ...f, telephone: v }))} />
                <FormField label="Date de naissance *" type="date" value={form.date_naissance} onChange={v => setForm(f => ({ ...f, date_naissance: v }))} />
                <div>
                  <label style={formLabel}>Sexe *</label>
                  <select style={formSelect} value={form.sexe} onChange={e => setForm(f => ({ ...f, sexe: e.target.value }))}>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label style={formLabel}>Groupe sanguin</label>
                  <select style={formSelect} value={form.groupe_sanguin} onChange={e => setForm(f => ({ ...f, groupe_sanguin: e.target.value }))}>
                    <option value="">— Sélectionner —</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <FormField label="Adresse" value={form.adresse} onChange={v => setForm(f => ({ ...f, adresse: v }))} />
              </div>
              <button type="submit" style={submitBtn} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Créer le patient'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal mot de passe temporaire */}
      {motDePasse && (
        <div style={overlay} onClick={() => setMotDePasse(null)}>
          <div style={{ ...modal, maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <FiCheckCircle size={40} color="#0ED2A0" style={{ marginBottom: 16 }} />
            <h2 style={{ ...titleStyle, fontSize: 18, marginBottom: 8 }}>Patient créé avec succès</h2>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>
              Communiquez ce mot de passe temporaire au patient. Il devra le changer lors de sa première connexion.
            </p>
            <div style={passwordBox}>{motDePasse}</div>
            <button style={submitBtn} onClick={() => setMotDePasse(null)}>Fermer</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={overlay} onClick={() => { setSelected(null); setEditMode(false); }}>
          <div style={{ ...modal, maxWidth: 680, animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={avatarLg}>{getInitials(selected.nom, selected.prenom)}</div>
                <div>
                  <h2 style={{ ...titleStyle, fontSize: 20 }}>{selected.prenom} {selected.nom}</h2>
                  <p style={{ ...subtitleStyle, marginTop: 2 }}>{selected.ref} · {computeAge(selected.date_naissance)} ans</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!editMode && (
                  <button style={editBtn} onClick={() => ouvrirEdit(selected)}>
                    <FiEdit2 size={13} /> Modifier
                  </button>
                )}
                <button style={closeBtn} onClick={() => { setSelected(null); setEditMode(false); }}><FiX size={16} /></button>
              </div>
            </div>

            {editMode ? (
              /* ── Formulaire édition ── */
              <form onSubmit={handleUpdate}>
                <p style={{ ...subtitleStyle, marginBottom: 16 }}>Informations de base</p>
                <div style={formGrid}>
                  <FormField label="Adresse" value={editData.adresse} onChange={v => setEditData(d => ({ ...d, adresse: v }))} />
                  <div>
                    <label style={formLabel}>Groupe sanguin</label>
                    <select style={formSelect} value={editData.groupe_sanguin} onChange={e => setEditData(d => ({ ...d, groupe_sanguin: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <FormField label="Taille (cm)" type="number" value={editData.taille} onChange={v => setEditData(d => ({ ...d, taille: v }))} />
                  <FormField label="Poids (kg)" type="number" value={editData.poids} onChange={v => setEditData(d => ({ ...d, poids: v }))} />
                  <FormField label="Profession" value={editData.profession} onChange={v => setEditData(d => ({ ...d, profession: v }))} />
                  <div>
                    <label style={formLabel}>Situation matrimoniale</label>
                    <select style={formSelect} value={editData.situation_matrimoniale} onChange={e => setEditData(d => ({ ...d, situation_matrimoniale: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {['Célibataire','Marié(e)','Divorcé(e)','Veuf/Veuve'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <FormField label="Nombre d'enfants" type="number" value={editData.nombre_enfants} onChange={v => setEditData(d => ({ ...d, nombre_enfants: v }))} />
                  <FormField label="Assurance" value={editData.assurance} onChange={v => setEditData(d => ({ ...d, assurance: v }))} />
                  <FormField label="N° assurance" value={editData.numero_assurance} onChange={v => setEditData(d => ({ ...d, numero_assurance: v }))} />
                  <FormField label="Personne contact" value={editData.personne_contact} onChange={v => setEditData(d => ({ ...d, personne_contact: v }))} />
                  <FormField label="Tél. contact" value={editData.tel_contact} onChange={v => setEditData(d => ({ ...d, tel_contact: v }))} />
                </div>
                <p style={{ ...subtitleStyle, marginBottom: 12, marginTop: 4 }}>Antécédents & allergies</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 20 }}>
                  <TextAreaField label="Antécédents médicaux" value={editData.antecedents_medicaux} onChange={v => setEditData(d => ({ ...d, antecedents_medicaux: v }))} />
                  <TextAreaField label="Antécédents chirurgicaux" value={editData.antecedents_chirurgicaux} onChange={v => setEditData(d => ({ ...d, antecedents_chirurgicaux: v }))} />
                  <TextAreaField label="Antécédents familiaux" value={editData.antecedents_familiaux} onChange={v => setEditData(d => ({ ...d, antecedents_familiaux: v }))} />
                  <TextAreaField label="Allergies" value={editData.allergies} onChange={v => setEditData(d => ({ ...d, allergies: v }))} />
                  <TextAreaField label="Traitement en cours" value={editData.traitement_en_cours} onChange={v => setEditData(d => ({ ...d, traitement_en_cours: v }))} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" style={{ ...closeBtn, flex: 1, justifyContent: 'center', padding: '11px' }} onClick={() => setEditMode(false)}>Annuler</button>
                  <button type="submit" style={{ ...submitBtn, flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={saving}>
                    <FiSave size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── Vue détail ── */
              <div style={infoGrid}>
                <InfoBox icon={<FiUser size={13} />} label="Sexe" value={selected.sexe === 'M' ? 'Masculin' : 'Féminin'} />
                <InfoBox icon={<FiCalendar size={13} />} label="Date de naissance" value={formatDate(selected.date_naissance)} />
                <InfoBox icon={<FiDroplet size={13} />} label="Groupe sanguin" value={selected.groupe_sanguin} />
                <InfoBox icon={<FiPhone size={13} />} label="Téléphone" value={selected.telephone} />
                <InfoBox icon={<FiActivity size={13} />} label="Taille / Poids" value={selected.taille ? `${selected.taille} cm — ${selected.poids} kg` : null} />
                <InfoBox icon={<FiUser size={13} />} label="Profession" value={selected.profession} />
                <InfoBox icon={<FiUser size={13} />} label="Situation matrimoniale" value={selected.situation_matrimoniale} />
                <InfoBox icon={<FiUser size={13} />} label="Assurance" value={selected.assurance ? `${selected.assurance} — ${selected.numero_assurance}` : null} />
                <div style={{ gridColumn: '1 / -1' }}><InfoBox icon={<FiUser size={13} />} label="Adresse" value={selected.adresse} /></div>
                {selected.antecedents_medicaux && <div style={{ gridColumn: '1 / -1' }}><InfoBox icon={<FiActivity size={13} />} label="Antécédents médicaux" value={selected.antecedents_medicaux} /></div>}
                {selected.allergies && <div style={{ gridColumn: '1 / -1' }}><InfoBox icon={<FiActivity size={13} />} label="Allergies" value={selected.allergies} /></div>}
                {selected.traitement_en_cours && <div style={{ gridColumn: '1 / -1' }}><InfoBox icon={<FiActivity size={13} />} label="Traitement en cours" value={selected.traitement_en_cours} /></div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={formLabel}>{label}</label>
      <input
        style={formInput}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={label.includes('*')}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div>
      <label style={formLabel}>{label}</label>
      <textarea
        style={{ ...formInput, height: 72, resize: 'vertical' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div style={infoBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color: '#0ED2A0' }}>{icon}</span>
        <span style={infoLabel}>{label}</span>
      </div>
      <div style={infoVal}>{value || '—'}</div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const keyframesCSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
`;

const pageStyle = {
  fontFamily: "'DM Sans',sans-serif",
  minHeight: '100vh',
  padding: '32px 28px',
  background: '#F6FBF8',
  color: '#111827',
  animation: 'fadeIn 0.4s ease',
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 28,
};

const titleStyle = {
  fontFamily: "'Outfit',sans-serif",
  fontSize: 26,
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.5px',
  margin: 0,
};

const subtitleStyle = {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 4,
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16,
  marginBottom: 24,
};

const kpiCard = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: '20px 22px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  animation: 'slideUp 0.35s ease both',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
};

const kpiIcon = {
  width: 42,
  height: 42,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const toolbarRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
};

const searchWrap = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: 10,
  padding: '10px 14px',
};

const searchInput = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#111827',
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: 'none',
};

const clearBtn = {
  background: 'transparent',
  border: 'none',
  color: '#9CA3AF',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const tableCard = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 20,
  overflow: 'hidden',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
};

const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  borderBottom: '1px solid #E5E7EB',
  background: '#F9FAFB',
};

const tdStyle = {
  padding: '14px 16px',
  borderBottom: '1px solid #E5E7EB',
};

const trStyle = {
  transition: 'background 0.15s',
  animation: 'fadeIn 0.3s ease both',
};

const avatarSm = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: 'linear-gradient(135deg,#0ED2A0,#0BA882)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 800,
  color: '#fff',
  flexShrink: 0,
  fontFamily: "'Outfit',sans-serif",
};

const avatarLg = {
  width: 56,
  height: 56,
  borderRadius: 16,
  background: 'linear-gradient(135deg,#0ED2A0,#0BA882)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 800,
  color: '#fff',
  flexShrink: 0,
  fontFamily: "'Outfit',sans-serif",
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
};

const iconBtn = {
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  background: '#F9FAFB',
  color: '#4B5563',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.32)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};

const modal = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 24,
  padding: 32,
  width: '100%',
  maxWidth: 640,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
};

const closeBtn = {
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  color: '#4B5563',
  cursor: 'pointer',
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const infoBox = {
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '12px 14px',
};

const infoLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const infoVal = {
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
};

const emptyState = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 180,
};

const spinner = {
  width: 32,
  height: 32,
  border: '3px solid rgba(14,210,160,0.15)',
  borderTop: '3px solid #0ED2A0',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const editBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(14,210,160,0.4)',
  background: 'rgba(14,210,160,0.1)',
  color: '#0ED2A0',
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  cursor: 'pointer',
};

const addBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid #15803D',
  background: '#16A34A',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  cursor: 'pointer',
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginBottom: 20,
};

const formLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 6,
};

const formInput = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#111827',
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

const formSelect = { ...formInput, cursor: 'pointer' };

const submitBtn = {
  width: '100%',
  padding: '12px',
  borderRadius: 10,
  border: '1px solid #15803D',
  background: '#16A34A',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "'DM Sans',sans-serif",
  cursor: 'pointer',
  marginTop: 4,
};

const passwordBox = {
  background: 'rgba(14,210,160,0.1)',
  border: '1px solid rgba(14,210,160,0.3)',
  borderRadius: 10,
  padding: '14px 20px',
  fontFamily: 'monospace',
  fontSize: 22,
  fontWeight: 800,
  color: '#0ED2A0',
  letterSpacing: '3px',
  marginBottom: 20,
};

const toastStyle = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  background: '#0ED2A0',
  color: '#FFFFFF',
  padding: '12px 20px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  zIndex: 2000,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
};
