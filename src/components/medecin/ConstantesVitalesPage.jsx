import { useState, useEffect } from 'react';
import { getPatients, getConstantesVitales } from '../../api/medecinAPI';
import { normalizeCollection } from '../../utils/apiData';
import {
  FiHeart, FiActivity, FiThermometer, FiDroplet,
  FiTrendingUp, FiTrendingDown, FiMinus, FiSearch,
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const NORMAL_RANGES = {
  tensionSystolique:  { min: 90,  max: 120, unit: 'mmHg',  label: 'Tension systolique' },
  tensionDiastolique: { min: 60,  max: 80,  unit: 'mmHg',  label: 'Tension diastolique' },
  frequenceCardiaque: { min: 60,  max: 100, unit: 'bpm',   label: 'Fréquence cardiaque' },
  temperature:        { min: 36.1,max: 37.2,unit: '°C',    label: 'Température' },
  poids:              { min: null, max: null,unit: 'kg',    label: 'Poids' },
  saturationO2:       { min: 95,  max: 100, unit: '%',     label: 'Saturation O₂' },
  glycemie:           { min: 3.9, max: 6.1, unit: 'mmol/L',label: 'Glycémie' },
};

const getStatus = (key, value) => {
  const range = NORMAL_RANGES[key];
  if (!range || range.min === null) return 'normal';
  if (value < range.min) return 'low';
  if (value > range.max) return 'high';
  return 'normal';
};

const StatusIcon = ({ status }) => {
  if (status === 'high') return <FiTrendingUp size={14} color="#DC2626" />;
  if (status === 'low')  return <FiTrendingDown size={14} color="#2563EB" />;
  return <FiMinus size={14} color="#16A34A" />;
};

const VitalCard = ({ label, value, unit, status, icon }) => {
  const colors = {
    normal: { bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A', label: 'Normal' },
    high:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', label: 'Élevé' },
    low:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', label: 'Bas' },
  };
  const c = colors[status] || colors.normal;

  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: c.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
          <StatusIcon status={status} /> {c.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 800, color: c.color, lineHeight: 1 }}>
          {value ?? '—'}
        </span>
        <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#6B7280' }}>
        {NORMAL_RANGES[Object.keys(NORMAL_RANGES).find(k => NORMAL_RANGES[k]?.label === label)]?.min !== null &&
          `Norme: ${NORMAL_RANGES[Object.keys(NORMAL_RANGES).find(k => NORMAL_RANGES[k]?.label === label)]?.min} – ${NORMAL_RANGES[Object.keys(NORMAL_RANGES).find(k => NORMAL_RANGES[k]?.label === label)]?.max} ${unit}`
        }
      </div>
    </div>
  );
};

const ConstantesVitalesPage = () => {
  const [patients, setPatients]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [constantes, setConstantes] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    getPatients()
      .then((response) => setPatients(normalizeCollection(response)))
      .catch(() => setPatients([]));
  }, []);

  const handleSelectPatient = async (patient) => {
    setSelected(patient);
    setLoading(true);
    try {
      const data = await getConstantesVitales(patient.id);
      setConstantes(normalizeCollection(data));
    } catch {
      setConstantes([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p =>
    `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  const last = constantes[constantes.length - 1];

  const vitals = last ? [
    { key: 'tensionSystolique',  label: 'Tension systolique',  icon: <FiHeart /> },
    { key: 'tensionDiastolique', label: 'Tension diastolique', icon: <FiHeart /> },
    { key: 'frequenceCardiaque', label: 'Fréquence cardiaque', icon: <FiActivity /> },
    { key: 'temperature',        label: 'Température',         icon: <FiThermometer /> },
    { key: 'poids',              label: 'Poids',               icon: <FiMinus /> },
    { key: 'saturationO2',       label: 'Saturation O₂',       icon: <FiDroplet /> },
  ].filter(v => last[v.key] !== undefined) : [];

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiHeart size={24} color="#DC2626" />
            Constantes Vitales
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            Suivi des paramètres physiologiques par patient
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Liste patients */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', height: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #E5E7EB' }}>
            <div className="search-bar" style={{ padding: '7px 10px' }}>
              <FiSearch size={13} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  border: 'none',
                  borderBottom: '1px solid #F9FAFB',
                  background: selected?.id === p.id ? '#F0FDF4' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: selected?.id === p.id ? '#16A34A' : '#E5E7EB',
                  color: selected?.id === p.id ? '#fff' : '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12, fontFamily: "'Outfit', sans-serif",
                  flexShrink: 0,
                }}>
                  {p.prenom[0]}{p.nom[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === p.id ? '#16A34A' : '#111827' }}>
                    {p.prenom} {p.nom}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {p.date_naissance || p.dateNaissance || '—'} · {p.groupe_sanguin || p.groupeSanguin || '—'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Détail constantes */}
        <div>
          {!selected ? (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
              <FiHeart size={40} color="#D1FAE5" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Sélectionnez un patient pour voir ses constantes vitales</p>
            </div>
          ) : loading ? (
            <div className="loading-page"><span className="loading" /> Chargement…</div>
          ) : (
            <>
              {/* Info patient */}
              <div style={patientHeaderStyle}>
                <div style={patientAvatarStyle}>{selected.prenom[0]}{selected.nom[0]}</div>
                <div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: '#111827' }}>
                    {selected.prenom} {selected.nom}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {selected.date_naissance || selected.dateNaissance || '—'} · Groupe {selected.groupe_sanguin || selected.groupeSanguin || '—'} · {selected.taille || '—'} cm · {selected.poids || '—'} kg
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 13, color: '#6B7280' }}>
                  <div>Dernière mesure</div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{last?.date || '—'}</div>
                </div>
              </div>

              {/* Cartes vitales */}
              {last ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {vitals.map(({ key, label }) => (
                      <VitalCard
                        key={key}
                        label={label}
                        value={last[key]}
                        unit={NORMAL_RANGES[key]?.unit || ''}
                        status={getStatus(key, last[key])}
                      />
                    ))}
                  </div>

                  {/* Graphique tension */}
                  {constantes.length > 1 && (
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <h3 className="section-title" style={{ marginBottom: 16 }}>
                        <FiTrendingUp size={16} color="#16A34A" /> Évolution de la tension (mmHg)
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={constantes}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} domain={[60, 160]} />
                          <Tooltip
                            contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="tensionSystolique"  stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} name="Systolique" />
                          <Line type="monotone" dataKey="tensionDiastolique" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} name="Diastolique" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 24, textAlign: 'center', color: '#D97706' }}>
                  <FiActivity size={32} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14 }}>Aucune constante vitale enregistrée pour ce patient.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

const patientHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: '16px 20px',
  marginBottom: 18,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const patientAvatarStyle = {
  width: 44, height: 44,
  borderRadius: '50%',
  background: '#16A34A',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 800,
  fontSize: 15,
  flexShrink: 0,
};

export default ConstantesVitalesPage;
