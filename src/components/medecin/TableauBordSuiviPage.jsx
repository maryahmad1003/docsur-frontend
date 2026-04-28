import { useEffect, useState } from 'react';
import { FiActivity, FiBarChart2, FiClipboard, FiRefreshCw, FiUsers, FiVideo } from 'react-icons/fi';
import { getTableauBordMedecin } from '../../api/medecinAPI';

export default function TableauBordSuiviPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await getTableauBordMedecin();
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord de suivi</h1>
          <p style={{ color: '#6B7280', marginTop: 4 }}>Indicateurs cliniques et pilotage quotidien de l activite medecin.</p>
        </div>
        <button onClick={load} style={refreshBtn}>
          <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      <div style={kpiGrid}>
        {[
          { label: 'Patients suivis', value: data?.kpis?.patients_suivis, color: '#0ED2A0', icon: <FiUsers /> },
          { label: 'Consultations ce mois', value: data?.kpis?.consultations_ce_mois, color: '#38BDF8', icon: <FiClipboard /> },
          { label: 'Analyses en attente', value: data?.kpis?.analyses_en_attente, color: '#FBBF24', icon: <FiActivity /> },
          { label: 'Teleconsultations', value: data?.kpis?.teleconsultations_planifiees, color: '#16A34A', icon: <FiVideo /> },
        ].map((item) => (
          <div key={item.label} style={kpiCard}>
            <div style={{ color: item.color, fontSize: 18 }}>{item.icon}</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: item.color, marginTop: 10 }}>{item.value ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#4B5563', marginTop: 6 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={gridTwo}>
        <section style={panelStyle}>
          <div style={sectionTitle}><FiBarChart2 /> Alertes et suivi</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <InfoRow label="RDV en attente de validation" value={data?.alertes?.rdv_en_attente_validation} color="#FBBF24" />
            <InfoRow label="Teleconsultations du jour" value={data?.alertes?.teleconsultations_du_jour} color="#16A34A" />
            <InfoRow label="Analyses non cloturees" value={data?.alertes?.analyses_non_cloturees} color="#38BDF8" />
            <InfoRow label="Prescriptions envoyees en pharmacie" value={data?.kpis?.prescriptions_envoyees_pharmacie} color="#0ED2A0" />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitle}><FiActivity /> Top pathologies</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {(data?.top_pathologies || []).length === 0 ? (
              <div style={{ color: '#6B7280' }}>Aucune pathologie encore consolidee.</div>
            ) : data.top_pathologies.map((item) => (
              <InfoRow key={item.diagnostic} label={item.diagnostic} value={item.total} color="#A78BFA" />
            ))}
          </div>
        </section>
      </div>

      <div style={gridTwo}>
        <section style={panelStyle}>
          <div style={sectionTitle}><FiVideo /> Prochaines teleconsultations</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {(data?.prochaines_teleconsultations || []).length === 0 ? (
              <div style={{ color: '#6B7280' }}>Aucune teleconsultation planifiee.</div>
            ) : data.prochaines_teleconsultations.map((item) => (
              <div key={item.id} style={cardRow}>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{item.patient?.user?.prenom} {item.patient?.user?.nom}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{new Date(item.date_debut).toLocaleString('fr-FR')}</div>
                </div>
                <span style={badge(item.statut === 'en_cours' ? '#16A34A' : '#38BDF8')}>{item.statut}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitle}><FiUsers /> Patients prioritaires</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {(data?.patients_prioritaires || []).length === 0 ? (
              <div style={{ color: '#6B7280' }}>Aucun patient prioritaire recent.</div>
            ) : data.patients_prioritaires.map((item) => (
              <div key={item.consultation_id} style={cardRow}>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{item.patient}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{item.motif}</div>
                </div>
                <span style={badge(item.urgence === 'critique' ? '#EF4444' : '#F59E0B')}>{item.urgence}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <div style={cardRow}>
      <span style={{ color: '#111827', fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color }}>{value ?? 0}</span>
    </div>
  );
}

const refreshBtn = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
  borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer',
};
const kpiGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 };
const kpiCard = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 18, padding: '18px 20px', boxShadow: '0 12px 28px rgba(15,23,42,0.05)' };
const gridTwo = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 };
const panelStyle = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 18, padding: '20px 22px', boxShadow: '0 12px 28px rgba(15,23,42,0.04)' };
const sectionTitle = { display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#111827', marginBottom: 14 };
const cardRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', background: '#F9FAFB' };
const badge = (color) => ({ display: 'inline-block', padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}2B` });
