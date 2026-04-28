import { useState, useEffect } from 'react';
import { getMesResultats } from '../../api/patientAPI';
import { useAuth } from '../../context/AuthContext';
import { FiActivity, FiSearch, FiDownload, FiCalendar, FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const STATUS_CONFIG = {
  normal:   { label: 'Normal',     color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
  anormal:  { label: 'Anormal',    color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  en_cours: { label: 'En cours',   color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
};

const normalizeLaborantinName = (laborantin) => {
  if (!laborantin) return '';
  if (typeof laborantin === 'string') return laborantin;

  if (laborantin.user) {
    return [laborantin.user.prenom, laborantin.user.nom].filter(Boolean).join(' ').trim();
  }

  return [laborantin.prenom, laborantin.nom].filter(Boolean).join(' ').trim();
};

const normalizeMedecinName = (resultat) => {
  if (typeof resultat.medecin_prescripteur === 'string') return resultat.medecin_prescripteur;

  const medecin = resultat.demandeAnalyse?.medecin;
  if (medecin?.user) {
    return `Dr. ${medecin.user.prenom} ${medecin.user.nom}`;
  }

  const fullName = [medecin?.prenom, medecin?.nom].filter(Boolean).join(' ').trim();
  return fullName ? `Dr. ${fullName}` : '';
};

const normalizeResultDetails = (resultat) => {
  if (typeof resultat.resultats_details === 'string') return resultat.resultats_details;
  if (typeof resultat.resultats === 'string') return resultat.resultats;
  if (resultat.resultats && typeof resultat.resultats === 'object') {
    return Object.entries(resultat.resultats)
      .map(([key, value]) => `${key} : ${value}`)
      .join('\n');
  }
  if (resultat.interpretation) return resultat.interpretation;
  return '';
};

const extractResultEntries = (resultat) => {
  if (resultat?.resultats && typeof resultat.resultats === 'object') {
    return Object.entries(resultat.resultats).map(([label, value]) => ({ label, value: String(value) }));
  }

  const rawText = normalizeResultDetails(resultat);
  if (!rawText) return [];

  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([label, value]) => ({ label, value: String(value) }));
    }
  } catch {}

  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(':');
      return {
        label: rest.length ? label.trim() : 'Résultat',
        value: rest.length ? rest.join(':').trim() : line,
      };
    });
};

const normalizeResultat = (resultat = {}) => ({
  ...resultat,
  laborantin: normalizeLaborantinName(resultat.laborantin),
  medecin_prescripteur: normalizeMedecinName(resultat),
  resultats_details: normalizeResultDetails(resultat),
});

const getSafeText = (value, fallback = '—') => {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const buildResultSheetHtml = ({ resultat, cfg, patientName, resultRowsHtml, medecinName, laboratoireName }) => `
  <!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Resultat analyse - ${escapeHtml(resultat.type_analyse || 'DocSecur')}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f4fbf6; color: #111827; }
        .sheet { max-width: 900px; margin: 32px auto; background: #fff; border: 1px solid #dbe5dd; border-radius: 20px; overflow: hidden; }
        .hero { padding: 28px 32px; background: linear-gradient(135deg, #ecfdf3, #f8fffb); border-bottom: 1px solid #dbe5dd; }
        .brand { color: #16A34A; font-weight: 800; font-size: 26px; margin: 0 0 8px; }
        .title { font-size: 28px; font-weight: 800; margin: 0 0 10px; }
        .subtitle { color: #4b5563; margin: 0; }
        .status { display: inline-block; margin-top: 16px; padding: 8px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; color: ${cfg.color}; background: ${cfg.bg}; }
        .section { padding: 24px 32px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 8px; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px 16px; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: .7px; color: #6b7280; font-weight: 700; margin-bottom: 6px; }
        .value { font-size: 15px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: .6px; }
        .footer { padding: 20px 32px 32px; color: #6b7280; font-size: 12px; }
        @media print {
          body { background: #fff; }
          .sheet { margin: 0; border: none; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="hero">
          <p class="brand">DocSecur</p>
          <h1 class="title">Fiche de resultat d'analyse</h1>
          <p class="subtitle">${escapeHtml(resultat.type_analyse || 'Analyse')}</p>
          <span class="status">${escapeHtml(cfg.label)}</span>
        </div>
        <div class="section">
          <div class="grid">
            <div class="card"><div class="label">Patient</div><div class="value">${escapeHtml(patientName)}</div></div>
            <div class="card"><div class="label">Médecin prescripteur</div><div class="value">${escapeHtml(medecinName)}</div></div>
            <div class="card"><div class="label">Laboratoire</div><div class="value">${escapeHtml(laboratoireName)}</div></div>
            <div class="card"><div class="label">Date résultat</div><div class="value">${escapeHtml(resultat.date_resultat ? new Date(resultat.date_resultat).toLocaleDateString('fr-FR') : '—')}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Parametre</th>
                <th>Valeur</th>
              </tr>
            </thead>
            <tbody>${resultRowsHtml}</tbody>
          </table>
        </div>
        <div class="footer">
          Document genere le ${escapeHtml(new Date().toLocaleString('fr-FR'))} depuis l'espace patient DocSecur.
        </div>
      </div>
    </body>
  </html>
`;

const ResultatsPatientPage = () => {
  const { user } = useAuth();
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    getMesResultats()
      .then(res => setResultats((res.data?.data || res.data || []).map(normalizeResultat)))
      .catch(() => setResultats([
        {
          id: 1, date_prelevement: '2026-03-08', date_resultat: '2026-03-10',
          type_analyse: 'Bilan sanguin complet', statut: 'normal',
          laborantin: 'Lab. Central Dakar', medecin_prescripteur: 'Dr. Ndiaye Moussa',
          resultats_details: 'Hémoglobine : 14.2 g/dL (Normal)\nGlycémie à jeun : 5.2 mmol/L (Normal)\nCholestérol total : 4.8 mmol/L (Normal)',
          fichier_url: null,
        },
        {
          id: 2, date_prelevement: '2026-02-20', date_resultat: '2026-02-22',
          type_analyse: 'Ionogramme sanguin', statut: 'anormal',
          laborantin: 'Lab. Pasteur', medecin_prescripteur: 'Dr. Diallo Aminata',
          resultats_details: 'Sodium : 148 mEq/L (↑ Élevé)\nPotassium : 3.2 mEq/L (↓ Bas)\nCalcium : 2.4 mEq/L (Normal)',
          fichier_url: null,
        },
      ].map(normalizeResultat)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = resultats.filter(r =>
    (r.type_analyse || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.medecin_prescripteur || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.laborantin || '').toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total:    resultats.length,
    normal:   resultats.filter(r => r.statut === 'normal').length,
    anormal:  resultats.filter(r => r.statut === 'anormal').length,
    en_cours: resultats.filter(r => r.statut === 'en_cours').length,
  };

  const handleDownload = (resultat) => {
    const cfg = STATUS_CONFIG[resultat.statut] || STATUS_CONFIG.en_cours;
    const entries = extractResultEntries(resultat);
    const patientName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim() || 'Patient DocSecur';
    const medecinName = getSafeText(normalizeMedecinName(resultat) || resultat.medecin_prescripteur);
    const laboratoireName = getSafeText(normalizeLaborantinName(resultat.laborantin) || resultat.laborantin);
    const resultRows = entries.length
      ? entries.map((entry) => `
          <tr>
            <td>${escapeHtml(entry.label)}</td>
            <td>${escapeHtml(entry.value)}</td>
          </tr>
        `).join('')
      : `
          <tr>
            <td colspan="2">${escapeHtml(getSafeText(normalizeResultDetails(resultat), 'Aucun détail disponible'))}</td>
          </tr>
        `;
    const html = buildResultSheetHtml({
      resultat,
      cfg,
      patientName,
      resultRowsHtml: resultRows,
      medecinName,
      laboratoireName,
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        return;
      }
      frameWindow.focus();
      frameWindow.print();
      cleanup();
    };

    iframe.srcdoc = html;
  };

  if (loading) return <Loader />;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subStyle}>Mes analyses</p>
          <h1 style={titleStyle}>Résultats d'analyses</h1>
        </div>
        <div style={searchBox}>
          <FiSearch size={14} color="#9CA3AF" />
          <input style={searchInput} placeholder="Rechercher une analyse…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Stats */}
      <div style={statsRow}>
        {[
          { label: 'Total',     value: counts.total,    color: '#111827' },
          { label: 'Normaux',   value: counts.normal,   color: '#0ED2A0' },
          { label: 'Anormaux',  value: counts.anormal,  color: '#F87171' },
          { label: 'En cours',  value: counts.en_cours, color: '#FBBF24' },
        ].map((s, i) => (
          <div key={i} style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert for abnormal */}
      {counts.anormal > 0 && (
        <div style={alertBanner}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#F87171' }}>Résultats anormaux détectés</div>
            <div style={{ fontSize: 12, color: 'rgba(248,113,113,0.7)', marginTop: 2 }}>
              {counts.anormal} résultat(s) nécessite(nt) l'attention de votre médecin.
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔬</div>
          <div style={{ color: '#6B7280', fontSize: 14 }}>Aucun résultat d'analyse trouvé</div>
        </div>
      ) : filtered.map((r, i) => {
        const cfg = STATUS_CONFIG[r.statut] || STATUS_CONFIG.en_cours;
        const isExpanded = expanded === (r.id || i);
        const resultEntries = extractResultEntries(r);
        return (
          <div key={r.id || i} style={{ ...resultCard, borderColor: isExpanded ? cfg.color+'30' : '#E5E7EB',
            animation: `slideUp 0.4s ease ${i*60}ms both` }}>
            <div style={resultHeader} onClick={() => setExpanded(isExpanded ? null : (r.id || i))}>
              <div style={resultLeft}>
                <div style={{ ...iconBox, background: cfg.bg, borderColor: cfg.color+'30' }}>
                  <FiActivity size={18} color={cfg.color} />
                </div>
                <div>
                  <div style={resultTitle}>{r.type_analyse || 'Analyse'}</div>
                  <div style={resultMeta}>
                    <FiUser size={10}/> {getSafeText(normalizeMedecinName(r) || r.medecin_prescripteur)}
                    {' · '}
                    <FiCalendar size={10}/>{' '}
                    {r.date_resultat ? new Date(r.date_resultat).toLocaleDateString('fr-FR') : '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ ...statusBadge, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                <span style={{ color: '#9CA3AF' }}>
                  {isExpanded ? <FiChevronUp size={16}/> : <FiChevronDown size={16}/>}
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={detailBox}>
                <div style={detailGrid}>
                  <div style={detailItem}>
                    <div style={detailLabel}>Laboratoire</div>
                    <div style={detailValue}>{getSafeText(normalizeLaborantinName(r.laborantin) || r.laborantin)}</div>
                  </div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Date prélèvement</div>
                    <div style={detailValue}>
                      {r.date_prelevement ? new Date(r.date_prelevement).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  </div>
                  <div style={detailItem}>
                    <div style={detailLabel}>Date résultat</div>
                    <div style={detailValue}>
                      {r.date_resultat ? new Date(r.date_resultat).toLocaleDateString('fr-FR') : '—'}
                    </div>
                  </div>
                </div>

                {getSafeText(normalizeResultDetails(r), '') && (
                  <div style={resultsBox}>
                    <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                      Détail des résultats
                    </div>
                    {resultEntries.length > 0 ? (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {resultEntries.map((entry, entryIndex) => (
                          <div key={`${r.id || i}-${entryIndex}`} style={resultLineStyle}>
                            <div style={resultLineLabelStyle}>{entry.label}</div>
                            <div style={resultLineValueStyle}>{entry.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre style={preStyle}>{getSafeText(normalizeResultDetails(r), '')}</pre>
                    )}
                  </div>
                )}

                <button style={dlBtn} onClick={() => handleDownload(r)}>
                  <FiDownload size={13}/> Télécharger la fiche de résultat
                </button>
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

const Loader = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
    <div style={{ width:36, height:36, border:'3px solid rgba(14,210,160,0.2)',
      borderTopColor:'#0ED2A0', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
  </div>
);

const subStyle    = { fontSize:13, color:'#6B7280', marginBottom:4, fontWeight:500 };
const titleStyle  = { fontFamily:"'Outfit',sans-serif", fontSize:28, fontWeight:800, letterSpacing:'-0.5px', color:'#111827' };
const searchBox   = { display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
  background:'#FFFFFF', border:'1px solid #D1D5DB', borderRadius:12 };
const searchInput = { background:'none', border:'none', outline:'none', color:'#111827', fontSize:13, width:200 };
const statsRow    = { display:'flex', gap:12, marginBottom:20 };
const statCard    = {
  flex:1, textAlign:'center', padding:'14px 16px',
  background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:14,
};
const alertBanner = {
  display:'flex', alignItems:'center', gap:14, padding:'14px 18px', marginBottom:20,
  background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.15)', borderRadius:14,
};
const resultCard  = {
  marginBottom:10, background:'#FFFFFF',
  border:'1px solid', borderRadius:16, overflow:'hidden',
};
const resultHeader = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'16px 20px', cursor:'pointer',
};
const resultLeft  = { display:'flex', alignItems:'center', gap:14 };
const iconBox     = { width:42, height:42, borderRadius:12, border:'1px solid', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
const resultTitle = { fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 };
const resultMeta  = { display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#6B7280' };
const statusBadge = { padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 };
const detailBox   = { padding:'0 20px 20px', borderTop:'1px solid #E5E7EB' };
const detailGrid  = { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:16, paddingTop:16 };
const detailItem  = { padding:'10px 12px', background:'#F9FAFB', borderRadius:10 };
const detailLabel = { fontSize:11, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 };
const detailValue = { fontSize:13, fontWeight:600, color:'#111827' };
const resultsBox  = { padding:'14px', background:'#F9FAFB', borderRadius:12, marginBottom:14 };
const preStyle    = { fontSize:13, color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap', margin:0, fontFamily:"'DM Mono', monospace" };
const resultLineStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(180px, 220px) 1fr',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 10,
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
};
const resultLineLabelStyle = { fontSize: 12, fontWeight: 700, color: '#6B7280' };
const resultLineValueStyle = { fontSize: 13, color: '#111827', fontWeight: 600 };
const dlBtn       = {
  display:'flex', alignItems:'center', gap:8, padding:'9px 18px',
  background:'rgba(14,210,160,0.1)', border:'1px solid rgba(14,210,160,0.2)',
  borderRadius:10, color:'#0ED2A0', fontSize:12, fontWeight:600, cursor:'pointer',
};
const emptyState  = { textAlign:'center', padding:'60px 20px' };

export default ResultatsPatientPage;
