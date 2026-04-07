import { useState, useEffect } from 'react';
import { FiHeart, FiActivity, FiThermometer, FiDroplet, FiTrendingUp, FiTrendingDown, FiMinus, FiRefreshCw, FiBluetooth, FiAlertTriangle } from 'react-icons/fi';
import { getLatestConstantes, getHistoriqueConstantes } from '../../api/patientAPI';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const TYPES_CONSTANTES = [
  { key: 'tension_systolique', label: 'Tension systolique', unite: 'mmHg', min: 90, max: 140, icon: FiHeart, color: '#DC2626' },
  { key: 'tension_diastolique', label: 'Tension diastolique', unite: 'mmHg', min: 60, max: 90, icon: FiHeart, color: '#EA580C' },
  { key: 'glycemie', label: 'Glycémie', unite: 'g/L', min: 0.7, max: 1.4, icon: FiDroplet, color: '#7C3AED' },
  { key: 'frequence_cardiaque', label: 'Fréquence cardiaque', unite: 'bpm', min: 60, max: 100, icon: FiActivity, color: '#DC2626' },
  { key: 'temperature', label: 'Température', unite: '°C', min: 36, max: 38, icon: FiThermometer, color: '#F59E0B' },
  { key: 'saturation_oxygene', label: 'Saturation O₂', unite: '%', min: 95, max: 100, icon: FiActivity, color: '#06B6D4' },
  { key: 'poids', label: 'Poids', unite: 'kg', min: null, max: null, icon: FiMinus, color: '#16A34A' },
  { key: 'taille', label: 'Taille', unite: 'cm', min: null, max: null, icon: FiMinus, color: '#0EA5E9' },
];

const getStatut = (type, valeur) => {
  const config = TYPES_CONSTANTES.find(t => t.key === type);
  if (!config || !config.min) return 'normal';
  if (valeur < config.min) return 'low';
  if (valeur > config.max) return 'high';
  return 'normal';
};

const StatutBadge = ({ statut }) => {
  const configs = {
    normal: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Normal' },
    high: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Élevé' },
    low: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Bas' },
  };
  const c = configs[statut] || configs.normal;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {statut === 'high' && <FiTrendingUp size={12} />}
      {statut === 'low' && <FiTrendingDown size={12} />}
      {statut === 'normal' && <FiMinus size={12} />}
      {c.label}
    </span>
  );
};

const ConstanteCard = ({ constante, typeConfig }) => {
  const statut = getStatut(constante.type, constante.valeur);
  const Icon = typeConfig.icon;
  
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${typeConfig.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={typeConfig.color} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {typeConfig.label}
          </span>
        </div>
        <StatutBadge statut={statut} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
          {constante.valeur}
        </span>
        <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>{typeConfig.unite}</span>
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
        {constante.mesure_at ? new Date(constante.mesure_at).toLocaleString('fr-FR') : '—'}
        {constante.source === 'iot' && <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#06B6D4' }}><FiBluetooth size={10} />Appareil connecté</span>}
      </div>
    </div>
  );
};

const ConstantesVitalesPatientPage = () => {
  const { user } = useAuth();
  const [constantes, setConstantes] = useState([]);
  const [latest, setLatest] = useState({});
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('tension_systolique');
  const [periode, setPeriode] = useState('7j');

  useEffect(() => {
    loadConstantes();
  }, []);

  const loadConstantes = async () => {
    setLoading(true);
    try {
      const [latestRes, historiqueRes] = await Promise.all([
        getLatestConstantes(['tension_systolique', 'tension_diastolique', 'glycemie', 'frequence_cardiaque', 'temperature', 'saturation_oxygene']),
        getHistoriqueConstantes({ type: selectedType, periode })
      ]);
      setLatest(latestRes.data?.data || {});
      const histData = historiqueRes.data?.data || [];
      setHistorique(histData.map(h => ({
        ...h,
        date: new Date(h.mesure_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      })));
    } catch (err) {
      console.error('Erreur chargement constantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedType && periode) {
      getHistoriqueConstantes({ type: selectedType, periode })
        .then(res => {
          const data = res.data?.data || [];
          setHistorique(data.map(h => ({
            ...h,
            date: new Date(h.mesure_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
          })));
        });
    }
  }, [selectedType, periode]);

  const selectedTypeConfig = TYPES_CONSTANTES.find(t => t.key === selectedType);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4, fontWeight: 500 }}>Santé</p>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            Mes Constantes Vitales
          </h1>
        </div>
        <button style={refreshBtn} onClick={loadConstantes}>
          <FiRefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FiBluetooth size={18} color="#059669" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>Synchronisation objets connectés</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Vos appareils (balance, tensionomètre, glycémie) peuvent synchroniser automatiquement</div>
        </div>
      </div>

      {loading ? (
        <div style={loadingStyle}>
          <div style={spinner} />
          <div style={{ color: '#6B7280', fontSize: 14 }}>Chargement des constantes…</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            {TYPES_CONSTANTES.filter(t => t.key !== 'taille').map(type => (
              <ConstanteCard
                key={type.key}
                constante={{ type: type.key, valeur: latest[type.key]?.valeur || '—', mesure_at: latest[type.key]?.mesure_at, source: latest[type.key]?.source }}
                typeConfig={type}
              />
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#111827' }}>
                Évolution
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={selectStyle}>
                  {TYPES_CONSTANTES.filter(t => t.key !== 'taille' && t.key !== 'poids').map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
                <select value={periode} onChange={e => setPeriode(e.target.value)} style={selectStyle}>
                  <option value="24h">24 heures</option>
                  <option value="7j">7 jours</option>
                  <option value="30j">30 jours</option>
                  <option value="90j">90 jours</option>
                </select>
              </div>
            </div>

            {historique.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={historique}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12 }}
                    formatter={(value) => [value + ' ' + selectedTypeConfig?.unite, selectedTypeConfig?.label]}
                  />
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke={selectedTypeConfig?.color || '#16A34A'}
                    strokeWidth={3}
                    dot={{ r: 4, fill: selectedTypeConfig?.color || '#16A34A' }}
                    name={selectedTypeConfig?.label}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                <FiActivity size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 14 }}>Aucune donnée disponible pour cette période</div>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const refreshBtn = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
  background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)',
  borderRadius: 10, color: '#16A34A', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const selectStyle = {
  background: '#F9FAFB', border: '1px solid #D1D5DB',
  borderRadius: 8, padding: '8px 12px', color: '#111827', fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer',
};

const loadingStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  minHeight: 300, gap: 12,
};

const spinner = {
  width: 36, height: 36, border: '3px solid rgba(14,210,160,0.2)',
  borderTopColor: '#0ED2A0', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
};

export default ConstantesVitalesPatientPage;
