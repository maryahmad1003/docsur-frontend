import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiLock, FiRefreshCw, FiShield, FiFileText } from 'react-icons/fi';
import { getSecurite } from '../../api/adminAPI';
import {
  adminChartPanel,
  adminPalette,
  adminRefreshButton,
  adminSectionPanel,
  adminSubStyle,
  adminTitleStyle,
  makeSoftBadge,
} from './adminTheme';

export default function SecuritePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await getSecurite();
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const scoreColor = (data?.security_score || 0) >= 85 ? adminPalette.primary : adminPalette.warning;
  const alertCount = (data?.journaux_acces || []).length;
  const protectionItems = [
    {
      label: 'Connexion des utilisateurs',
      value: 'Protegee',
      badgeColor: adminPalette.info,
    },
    {
      label: 'Protection contre les acces abusifs',
      value: data?.throttle?.login && data?.throttle?.register && data?.throttle?.otp ? 'Active' : 'A renforcer',
      badgeColor: data?.throttle?.login && data?.throttle?.register && data?.throttle?.otp ? adminPalette.primary : adminPalette.warning,
    },
    {
      label: 'Protection des donnees sensibles',
      value: data?.encryption?.medical_fields_encrypted ? 'Active' : 'A verifier',
      badgeColor: data?.encryption?.medical_fields_encrypted ? adminPalette.primary : adminPalette.warning,
    },
    {
      label: 'Controle des acces par role',
      value: (data?.access_control?.role_middleware_routes ?? 0) > 0 ? 'En place' : 'A verifier',
      badgeColor: (data?.access_control?.role_middleware_routes ?? 0) > 0 ? adminPalette.primary : adminPalette.warning,
    },
    {
      label: 'Surveillance recente',
      value: alertCount === 0 ? 'Aucune alerte critique' : `${alertCount} alerte${alertCount > 1 ? 's' : ''} a verifier`,
      badgeColor: alertCount === 0 ? adminPalette.primary : adminPalette.warning,
    },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 style={adminTitleStyle}>Supervision securite</h1>
          <p style={adminSubStyle}>Vue centralisee de l authentification, du chiffrement et des journaux recents.</p>
        </div>
        <button onClick={load} style={adminRefreshButton}>
          <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: 'Score securite', value: data?.security_score ?? '—', icon: <FiShield />, color: scoreColor },
          { label: 'Routes protegees', value: data?.access_control?.protected_routes ?? '—', icon: <FiLock />, color: adminPalette.info },
          { label: 'Comptes actifs', value: data?.accounts?.active ?? '—', icon: <FiShield />, color: adminPalette.primarySoft },
          { label: 'Comptes inactifs', value: data?.accounts?.inactive ?? '—', icon: <FiAlertTriangle />, color: adminPalette.warning },
        ].map((item) => (
          <div key={item.label} style={{ ...adminChartPanel, padding: '18px 20px' }}>
            <div style={{ color: item.color, fontSize: 18 }}>{item.icon}</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 30, color: item.color, marginTop: 10 }}>{item.value}</div>
            <div style={{ fontSize: 12, color: adminPalette.textMuted, marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={adminSectionPanel}>
          <div style={{ fontWeight: 700, color: adminPalette.text, marginBottom: 6 }}>Etat des protections</div>
          <div style={{ color: adminPalette.textMuted, fontSize: 13, marginBottom: 14 }}>
            Resume simple des mesures actives pour proteger les acces et les donnees.
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {protectionItems.map((item) => (
              <Row key={item.label} label={item.label} value={item.value} badgeColor={item.badgeColor} />
            ))}
          </div>
        </div>

        <div style={adminSectionPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <FiFileText color={adminPalette.warning} />
            <div style={{ fontWeight: 700, color: adminPalette.text }}>Journaux d acces et alertes</div>
          </div>
          <div style={{ display: 'grid', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
            {(data?.journaux_acces || []).length === 0 ? (
              <div style={{ color: adminPalette.textMuted, fontSize: 14 }}>Aucune alerte critique recente.</div>
            ) : data.journaux_acces.map((event, index) => (
              <div key={`${event.timestamp}-${index}`} style={{ border: `1px solid ${adminPalette.border}`, borderRadius: 14, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <span style={makeSoftBadge(event.level === 'ERROR' ? adminPalette.danger : adminPalette.warning)}>{event.level}</span>
                  <span style={{ fontSize: 11, color: adminPalette.textMuted }}>{event.timestamp}</span>
                </div>
                <div style={{ fontSize: 13, color: adminPalette.text, lineHeight: 1.5 }}>{event.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Row({ label, value, badgeColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${adminPalette.border}`, borderRadius: 12, background: '#fff' }}>
      <span style={{ fontSize: 13, color: adminPalette.text }}>{label}</span>
      <span style={makeSoftBadge(badgeColor)}>{value}</span>
    </div>
  );
}
