import { useState, useEffect } from 'react';
import { getMesRendezVous, prendreRendezVous, annulerRendezVous } from '../../api/patientAPI';
import { FiCalendar, FiPlus, FiX, FiClock, FiMapPin, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

const STATUS_CONFIG = {
  planifie:  { label: 'Planifié',  color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  confirme:  { label: 'Confirmé',  color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
  annule:    { label: 'Annulé',    color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  termine:   { label: 'Terminé',   color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
};

const RendezVousPatientPage = () => {
  const [rdvs, setRdvs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal]= useState(false);
  const [filter, setFilter]     = useState('all');

  const [form, setForm] = useState({ date_heure: '', motif: '', type: 'presentiel', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRdvs(); }, []);

  const loadRdvs = async () => {
    try {
      const res = await getMesRendezVous();
      setRdvs(res.data?.data || res.data || []);
    } catch {
      // demo data
      setRdvs([
        { id: 1, date_heure: '2026-03-28T10:00:00', motif: 'Suivi traitement', type: 'presentiel',
          status: 'confirme', medecin: 'Dr. Ndiaye Moussa', centre: 'Centre de Santé Médina' },
        { id: 2, date_heure: '2026-04-05T14:30:00', motif: 'Consultation générale', type: 'teleconsultation',
          status: 'planifie', medecin: 'Dr. Diallo Aminata', centre: 'Hôpital Principal' },
      ]);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await prendreRendezVous(form);
      toast.success('Rendez-vous pris avec succès !');
      setShowModal(false);
      setForm({ date_heure: '', motif: '', type: 'presentiel', notes: '' });
      loadRdvs();
    } catch {
      toast.error('Erreur lors de la prise de rendez-vous');
    } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Confirmer l\'annulation de ce rendez-vous ?')) return;
    try {
      await annulerRendezVous(id);
      toast.success('Rendez-vous annulé');
      loadRdvs();
    } catch { toast.error('Erreur lors de l\'annulation'); }
  };

  const filtered = filter === 'all' ? rdvs : rdvs.filter(r => r.status === filter);

  const counts = {
    all:       rdvs.length,
    planifie:  rdvs.filter(r => r.status === 'planifie').length,
    confirme:  rdvs.filter(r => r.status === 'confirme').length,
    termine:   rdvs.filter(r => r.status === 'termine').length,
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subStyle}>Mes rendez-vous</p>
          <h1 style={titleStyle}>Agenda & Consultations</h1>
        </div>
        <button style={addBtn} onClick={() => setShowModal(true)}>
          <FiPlus size={16} /> Prendre un RDV
        </button>
      </div>

      {/* Stats */}
      <div style={statsRow}>
        {[
          { key: 'all',      label: 'Total',     color: '#111827' },
          { key: 'planifie', label: 'Planifiés', color: '#38BDF8' },
          { key: 'confirme', label: 'Confirmés', color: '#0ED2A0' },
          { key: 'termine',  label: 'Terminés',  color: '#FBBF24' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            style={{ ...statChip, ...(filter === s.key ? { borderColor: s.color, background: `${s.color}10` } : {}) }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: filter === s.key ? s.color : '#111827' }}>{counts[s.key]}</span>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <Loader /> : filtered.length === 0 ? (
        <Empty onNew={() => setShowModal(true)} />
      ) : (
        <div>
          {filtered.map((rdv, i) => {
            const cfg = STATUS_CONFIG[rdv.status] || STATUS_CONFIG.planifie;
            const dt  = rdv.date_heure ? new Date(rdv.date_heure) : null;
            return (
              <div key={rdv.id || i} style={{ ...rdvCard, animation: `slideUp 0.4s ease ${i*60}ms both` }}>
                <div style={rdvLeft}>
                  <div style={iconBox}><FiCalendar size={18} color="#38BDF8" /></div>
                  <div>
                    <div style={rdvMotif}>{rdv.motif || 'Consultation'}</div>
                    <div style={rdvMeta}>
                      <FiClock size={11} />{' '}
                      {dt ? dt.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      {' à '}{dt ? dt.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—'}
                    </div>
                    <div style={{ display:'flex', gap:12, marginTop:4 }}>
                      {rdv.medecin && (
                        <span style={metaChip}><FiUser size={10}/> {rdv.medecin}</span>
                      )}
                      {rdv.centre && (
                        <span style={metaChip}><FiMapPin size={10}/> {rdv.centre}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
                  <span style={{ ...statusBadge, color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                  <span style={{ ...typeBadge, color: rdv.type === 'teleconsultation' ? '#A78BFA' : '#0ED2A0' }}>
                    {rdv.type === 'teleconsultation' ? '🎥 Télé' : '🏥 Présentiel'}
                  </span>
                  {(rdv.status === 'planifie' || rdv.status === 'confirme') && (
                    <button onClick={() => handleCancel(rdv.id)} style={cancelBtn}>
                      <FiX size={12}/> Annuler
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={modal}>
            <div style={modalHeader}>
              <span style={modalTitle}>Nouveau rendez-vous</span>
              <button onClick={() => setShowModal(false)} style={closeBtn}><FiX size={18}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={formGroup}>
                <label style={formLabel}>Date et heure *</label>
                <input type="datetime-local" required style={formInput}
                  value={form.date_heure}
                  onChange={e => setForm({...form, date_heure: e.target.value})}
                  min={new Date().toISOString().slice(0,16)} />
              </div>
              <div style={formGroup}>
                <label style={formLabel}>Motif *</label>
                <input type="text" required placeholder="Motif de la consultation" style={formInput}
                  value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} />
              </div>
              <div style={formGroup}>
                <label style={formLabel}>Type</label>
                <select style={formInput} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="presentiel">Présentiel</option>
                  <option value="teleconsultation">Téléconsultation</option>
                </select>
              </div>
              <div style={formGroup}>
                <label style={formLabel}>Notes complémentaires</label>
                <textarea rows={3} placeholder="Précisions supplémentaires…" style={{...formInput, resize:'vertical'}}
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtnModal}>Annuler</button>
                <button type="submit" disabled={saving} style={submitBtn}>
                  {saving ? 'Envoi…' : 'Confirmer le RDV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

const Empty = ({ onNew }) => (
  <div style={{ textAlign:'center', padding:'60px 20px' }}>
    <div style={{ fontSize:48, marginBottom:16 }}>📅</div>
    <div style={{ color:'#6B7280', fontSize:15, marginBottom:20 }}>Aucun rendez-vous trouvé</div>
    <button style={addBtn} onClick={onNew}><FiPlus size={14}/> Prendre un rendez-vous</button>
  </div>
);

const Loader = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
    <div style={{ width:36, height:36, border:'3px solid rgba(14,210,160,0.2)',
      borderTopColor:'#0ED2A0', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
  </div>
);

const subStyle   = { fontSize:13, color:'#6B7280', marginBottom:4, fontWeight:500 };
const titleStyle = { fontFamily:"'Outfit',sans-serif", fontSize:28, fontWeight:800, letterSpacing:'-0.5px', color:'#111827' };
const addBtn = {
  display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
  background:'#16A34A', border:'1px solid #15803D',
  borderRadius:12, color:'#FFFFFF', fontSize:13, fontWeight:700, cursor:'pointer',
};
const statsRow = { display:'flex', gap:12, marginBottom:24 };
const statChip = {
  display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'12px 20px',
  background:'#FFFFFF', border:'1px solid #E5E7EB',
  borderRadius:12, cursor:'pointer', minWidth:90,
};
const rdvCard = {
  display:'flex', justifyContent:'space-between', alignItems:'flex-start',
  padding:'16px 20px', marginBottom:10,
  background:'#FFFFFF', border:'1px solid #E5E7EB',
  borderRadius:14,
};
const rdvLeft   = { display:'flex', alignItems:'flex-start', gap:14 };
const iconBox   = { width:40, height:40, borderRadius:10, background:'rgba(56,189,248,0.1)',
  border:'1px solid rgba(56,189,248,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
const rdvMotif  = { fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 };
const rdvMeta   = { display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6B7280' };
const metaChip  = { display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6B7280' };
const statusBadge = { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 };
const typeBadge   = { fontSize:11, fontWeight:600 };
const cancelBtn   = {
  display:'flex', alignItems:'center', gap:6, padding:'5px 10px', fontSize:11,
  background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)',
  borderRadius:8, color:'#F87171', cursor:'pointer',
};
const overlay = {
  position:'fixed', inset:0, background:'rgba(17,24,39,0.32)', backdropFilter:'blur(4px)',
  display:'flex', alignItems:'center', justifyContent:'center', zIndex:200,
};
const modal = {
  width:480, background:'#FFFFFF', border:'1px solid #E5E7EB',
  borderRadius:20, padding:'28px 32px', boxShadow:'0 24px 64px rgba(15,23,42,0.16)',
};
const modalHeader = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 };
const modalTitle  = { fontFamily:"'Outfit',sans-serif", fontSize:18, fontWeight:800, color:'#111827' };
const closeBtn    = { background:'none', border:'none', color:'#6B7280', cursor:'pointer' };
const formGroup   = { marginBottom:16 };
const formLabel   = { display:'block', fontSize:12, color:'#6B7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:8 };
const formInput   = {
  width:'100%', boxSizing:'border-box', padding:'10px 14px',
  background:'#FFFFFF', border:'1px solid #D1D5DB',
  borderRadius:10, color:'#111827', fontSize:14, outline:'none',
};
const cancelBtnModal = {
  flex:1, padding:'11px', background:'#F9FAFB',
  border:'1px solid #D1D5DB', borderRadius:10, color:'#4B5563', fontSize:14, cursor:'pointer',
};
const submitBtn = {
  flex:2, padding:'11px', background:'#16A34A',
  border:'1px solid #15803D', borderRadius:10, color:'#FFFFFF', fontSize:14, fontWeight:700, cursor:'pointer',
};

export default RendezVousPatientPage;
