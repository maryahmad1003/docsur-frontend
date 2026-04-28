import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMonDossier, getMonHistorique, getMonQRCode } from '../../api/patientAPI';
import { FiFileText, FiHeart, FiActivity, FiAlertCircle, FiDownload, FiRefreshCw } from 'react-icons/fi';

const DossierMedicalPage = () => {
  const { user } = useAuth();
  const [dossier, setDossier]       = useState(null);
  const [historique, setHistorique] = useState([]);
  const [qrCode, setQrCode]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('info');

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, hRes, qRes] = await Promise.all([
          getMonDossier(),
          getMonHistorique(),
          getMonQRCode(),
        ]);
        setDossier(dRes.data?.dossier || dRes.data || null);
        setHistorique(hRes.data?.consultations || hRes.data?.data || []);
        setQrCode(qRes.data?.qr_code || qRes.data?.qrcode || null);
      } catch {
        // demo fallback
        setDossier({
          numero_dossier: 'DS-2026-0042',
          date_creation: '2026-01-15',
          groupe_sanguin: 'O+',
          antecedents: 'Hypertension légère, diabète type 2',
          allergies: 'Pénicilline',
          notes_generales: 'Patient suivi régulièrement.',
        });
        setHistorique([
          { id: 1, date: '2026-03-10', motif: 'Consultation générale', diagnostic: 'Grippe saisonnière', medecin: 'Dr. Ndiaye' },
          { id: 2, date: '2026-02-05', motif: 'Suivi hypertension', diagnostic: 'TA stable 13/8', medecin: 'Dr. Diallo' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingState />;

  const tabs = [
    { id: 'info',    label: 'Informations médicales', icon: <FiFileText size={14}/> },
    { id: 'history', label: 'Historique',              icon: <FiActivity size={14}/> },
    { id: 'qr',      label: 'QR Code',                 icon: <FiHeart size={14}/> },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subStyle}>Mon espace santé</p>
          <h1 style={titleStyle}>Dossier Médical</h1>
        </div>
        <button style={refreshBtn} onClick={() => window.location.reload()}>
          <FiRefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Numéro dossier banner */}
      <div style={bannerStyle}>
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
            Numéro de dossier
          </div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: '#0ED2A0', letterSpacing: '1px' }}>
            {dossier?.numero_dossier || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Créé le</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
            {dossier?.date_creation ? new Date(dossier.date_creation).toLocaleDateString('fr-FR') : '—'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabBar}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ ...tabBtn, ...(activeTab === tab.id ? tabBtnActive : {}) }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && <InfoTab dossier={dossier} />}
      {activeTab === 'history' && <HistoryTab historique={historique} />}
      {activeTab === 'qr' && <QrTab qrCode={qrCode} user={user} />}

      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

/* ─── Info Tab ─── */
const InfoTab = ({ dossier }) => {
  const fields = [
    { label: 'Groupe sanguin',    value: dossier?.groupe_sanguin,   icon: <FiHeart size={16}/>,        color: '#F87171' },
    { label: 'Antécédents',       value: dossier?.antecedents,       icon: <FiFileText size={16}/>,     color: '#38BDF8' },
    { label: 'Allergies',         value: dossier?.allergies,         icon: <FiAlertCircle size={16}/>,  color: '#FBBF24' },
    { label: 'Notes générales',   value: dossier?.notes_generales,   icon: <FiActivity size={16}/>,     color: '#0ED2A0' },
  ];

  return (
    <div style={gridTwo}>
      {fields.map((f, i) => (
        <div key={i} style={{ ...card, animation: `slideUp 0.4s ease ${i*80}ms both` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${f.color}15`,
              border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: f.color }}>{f.icon}</span>
            </div>
            <span style={fieldLabel}>{f.label}</span>
          </div>
          <div style={fieldValue}>{f.value || <span style={{ color: '#9CA3AF', fontStyle:'italic' }}>Non renseigné</span>}</div>
        </div>
      ))}
    </div>
  );
};

/* ─── History Tab ─── */
const HistoryTab = ({ historique }) => (
  <div>
    {historique.length === 0 ? (
      <div style={emptyState}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
        <div style={{ color: '#9CA3AF', fontSize: 14 }}>Aucune consultation enregistrée</div>
      </div>
    ) : historique.map((c, i) => (
      <div key={c.id || i} style={{ ...consultCard, animation: `slideUp 0.4s ease ${i*60}ms both` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: '#111827' }}>
            {c.motif || 'Consultation'}
          </div>
          <span style={dateBadge}>{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—'}</span>
        </div>
        <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 6 }}>
          <strong style={{ color: '#0ED2A0' }}>Diagnostic :</strong> {c.diagnostic || '—'}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          {c.medecin || (c.medecin_prenom && `Dr. ${c.medecin_prenom} ${c.medecin_nom}`) || 'Médecin inconnu'}
        </div>
      </div>
    ))}
  </div>
);

/* ─── QR Tab ─── */
const QrTab = ({ qrCode, user }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
    <div style={qrCard}>
      <div style={{ marginBottom: 16, fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: '#111827', textAlign: 'center' }}>
        Votre QR Code Patient
      </div>
      {qrCode ? (
        <img src={`data:image/svg+xml;base64,${qrCode}`}
          alt="QR Code patient" style={{ width: 180, height: 180, borderRadius: 12 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={qrPlaceholder}>
          <div style={{ fontSize: 48 }}>📱</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
            QR Code généré<br />par le système
          </div>
        </div>
      )}
      <div style={{ marginTop: 16, fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
        {user?.prenom} {user?.nom}
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
        Présentez ce code au médecin pour un accès rapide
      </div>
    </div>
    <button style={dlBtn}>
      <FiDownload size={14} /> Télécharger le QR Code
    </button>
  </div>
);

/* ─── Loading ─── */
const LoadingState = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(14,210,160,0.2)',
        borderTopColor: '#0ED2A0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <div style={{ color: '#6B7280', fontSize: 13 }}>Chargement du dossier…</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ─── Styles ─── */
const subStyle   = { fontSize: 13, color: '#6B7280', marginBottom: 4, fontWeight: 500 };
const titleStyle = {
  fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
  color: '#111827',
};
const bannerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '18px 24px', marginBottom: 24,
  background: 'rgba(22,163,74,0.05)',
  border: '1px solid rgba(22,163,74,0.15)', borderRadius: 16,
};
const refreshBtn = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
  background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)',
  borderRadius: 10, color: '#16A34A', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const tabBar = { display: 'flex', gap: 6, marginBottom: 24 };
const tabBtn = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
  background: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: 10, color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const tabBtnActive = {
  background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.25)', color: '#16A34A', fontWeight: 700,
};
const gridTwo = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const card = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 16, padding: '20px 22px',
};
const fieldLabel = { fontSize: 13, fontWeight: 600, color: '#374151' };
const fieldValue = { fontSize: 14, color: '#111827', lineHeight: 1.6 };
const consultCard = {
  padding: '16px 20px', marginBottom: 10,
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 14,
};
const dateBadge = {
  padding: '3px 10px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
  borderRadius: 20, fontSize: 11, fontWeight: 600, color: '#38BDF8',
};
const emptyState = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  minHeight: 180, padding: 40,
};
const qrCard = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '28px 32px', background: '#FFFFFF',
  border: '1px solid #BBF7D0', borderRadius: 20, marginBottom: 20,
};
const qrPlaceholder = {
  width: 180, height: 180, border: '2px dashed rgba(14,210,160,0.3)', borderRadius: 16,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
};
const dlBtn = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
  background: '#16A34A', border: '1px solid #15803D',
  borderRadius: 12, color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

export default DossierMedicalPage;
