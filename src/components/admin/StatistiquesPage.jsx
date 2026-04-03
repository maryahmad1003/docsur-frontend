import { useState, useEffect } from 'react';
import { getStatistiques } from '../../api/adminAPI';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FiUsers, FiActivity, FiClipboard, FiCalendar, FiFileText, FiHome, FiRefreshCw } from 'react-icons/fi';
import {
  adminChartPanel,
  adminPalette,
  adminRefreshButton,
  adminSpinner,
  adminSubStyle,
  adminTitleStyle,
} from './adminTheme';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const ROLE_LABELS = { patient: 'Patients', medecin: 'Médecins', administrateur: 'Admins', pharmacien: 'Pharmaciens', laborantin: 'Laborantins' };
const ROLE_COLORS_PIE = ['#0ED2A0', '#38BDF8', '#A78BFA', '#FBBF24', '#F87171'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}>
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.value}</p>
      ))}
    </div>
  );
};

export default function StatistiquesPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getStatistiques();
      setStats(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Préparer les données graphiques
  const patientsMois = Array.from({ length: 12 }, (_, i) => ({
    mois: MOIS[i],
    Patients: stats?.patients_par_mois?.find(p => p.mois === i + 1)?.total || 0,
  }));

  const consultsMois = Array.from({ length: 12 }, (_, i) => ({
    mois: MOIS[i],
    Consultations: stats?.consultations_par_mois?.find(c => c.mois === i + 1)?.total || 0,
  }));

  const roleData = (stats?.repartition_par_role || []).map((r, i) => ({
    name: ROLE_LABELS[r.role] || r.role,
    value: r.total,
    color: ROLE_COLORS_PIE[i % ROLE_COLORS_PIE.length],
  }));

  const topPatho = (stats?.top_pathologies || []).slice(0, 6).map(p => ({
    name: p.diagnostic?.length > 18 ? p.diagnostic.slice(0, 18) + '…' : p.diagnostic,
    Cas: p.total,
  }));

  const KPIs = [
    { icon: <FiUsers />,    label: 'Utilisateurs',   value: stats?.total_utilisateurs,        color: '#0ED2A0' },
    { icon: <FiActivity />, label: 'Patients',        value: stats?.total_patients,            color: '#38BDF8' },
    { icon: <FiUsers />,    label: 'Médecins',        value: stats?.total_medecins,            color: '#A78BFA' },
    { icon: <FiClipboard />,label: 'Consultations',   value: stats?.total_consultations,       color: '#FBBF24' },
    { icon: <FiFileText />, label: 'Prescriptions',   value: stats?.total_prescriptions,       color: '#F87171' },
    { icon: <FiCalendar />, label: 'Rendez-vous',     value: stats?.total_rendez_vous,         color: '#34D399' },
    { icon: <FiActivity />, label: 'Résultats labo',  value: stats?.total_resultats_analyses,  color: '#60A5FA' },
    { icon: <FiHome />,     label: 'Centres de santé',value: stats?.total_centres_sante,       color: '#FB923C' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={spinnerEl} />
        <p style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Chargement des statistiques…</p>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={titleStyle}>Statistiques</h1>
          <p style={subStyle}>Vue globale de la plateforme DocSecur</p>
        </div>
        <button onClick={load} style={refreshBtn}>
          <FiRefreshCw size={15} /> Actualiser
        </button>
      </div>

      {/* KPI Grid */}
      <div style={kpiGrid}>
        {KPIs.map((k, i) => (
          <div key={i} style={kpiCard} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${k.color}30`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
            <div style={{ ...kpiIcon, background: `${k.color}15`, border: `1px solid ${k.color}25` }}>
              <span style={{ color: k.color, fontSize: 18 }}>{k.icon}</span>
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 800, color: k.color, lineHeight: 1, margin: '10px 0 4px' }}>
              {k.value ?? '—'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Highlight row */}
      <div style={highlightRow}>
        {[
          { label: 'Consultations ce mois', value: stats?.consultations_ce_mois ?? 0, color: '#FBBF24', icon: '📋' },
          { label: 'RDV en attente',         value: stats?.rdv_en_attente ?? 0,         color: '#F87171', icon: '⏳' },
          { label: "RDV aujourd'hui",         value: stats?.rdv_aujourdhui ?? 0,         color: '#0ED2A0', icon: '📅' },
        ].map((item, i) => (
          <div key={i} style={{ ...highlightCard, borderColor: `${item.color}25` }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 34, fontWeight: 900, color: item.color, margin: '8px 0 4px' }}>{item.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={chartsRow}>
        <div style={chartCard}>
          <div style={chartHeader}>
            <span style={chartTitle}>Patients enregistrés par mois</span>
            <span style={chartYear}>{new Date().getFullYear()}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={patientsMois} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mois" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Patients" fill="#38BDF8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={chartCard}>
          <div style={chartHeader}>
            <span style={chartTitle}>Consultations par mois</span>
            <span style={chartYear}>{new Date().getFullYear()}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={consultsMois} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mois" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="Consultations" stroke="#0ED2A0" strokeWidth={2.5} dot={{ fill: '#0ED2A0', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={chartsRow}>
        {/* Répartition rôles */}
        <div style={chartCard}>
          <div style={chartHeader}>
            <span style={chartTitle}>Répartition des utilisateurs</span>
          </div>
          {roleData.length === 0 ? (
            <div style={noData}>Aucune donnée disponible</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {roleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ color: '#4B5563', fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top pathologies */}
        <div style={chartCard}>
          <div style={chartHeader}>
            <span style={chartTitle}>Top pathologies diagnostiquées</span>
          </div>
          {topPatho.length === 0 ? (
            <div style={noData}>Aucune consultation enregistrée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topPatho} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#4B5563', fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Cas" fill="#A78BFA" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const titleStyle = adminTitleStyle;
const subStyle = adminSubStyle;
const refreshBtn = { ...adminRefreshButton, width: 'auto', padding: '11px 18px', gap: 8 };
const spinnerEl = { ...adminSpinner, width: 40, height: 40, margin: '0 auto' };
const kpiGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 20 };
const kpiCard = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '18px 16px', transition: 'all 0.3s', boxShadow: '0 12px 28px rgba(15,23,42,0.05)' };
const kpiIcon = { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const highlightRow = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 };
const highlightCard = { background: '#FFFFFF', border: '1px solid', borderRadius: 18, padding: '22px 20px', textAlign: 'center', boxShadow: '0 12px 28px rgba(15,23,42,0.04)' };
const chartsRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 };
const chartCard = adminChartPanel;
const chartHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 };
const chartTitle = { fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: adminPalette.text };
const chartYear = { fontSize: 12, color: adminPalette.textMuted, background: adminPalette.surfaceSoft, padding: '3px 10px', borderRadius: 20 };
const noData = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#9CA3AF', fontSize: 13 };
