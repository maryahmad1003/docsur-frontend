import { useState, useEffect, useRef } from 'react';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone, FiCalendar, FiUser, FiClock, FiMonitor } from 'react-icons/fi';

/**
 * Page téléconsultation patient — intégration Jitsi Meet (WebRTC)
 * Le patient peut rejoindre une session vidéo sécurisée avec son médecin.
 */
const TeleconsultationPatientPage = () => {
  const [sessions, setSessions]       = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [inCall, setInCall]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const jitsiContainerRef             = useRef(null);
  const jitsiApiRef                   = useRef(null);

  // Demo sessions
  useEffect(() => {
    setSessions([
      {
        id: 1, medecin: 'Dr. Ndiaye Moussa', specialite: 'Médecine Générale',
        date_heure: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        statut: 'planifie', motif: 'Suivi traitement hypertension', duree: 30,
        room_id: 'docsecur-room-demo-001',
      },
      {
        id: 2, medecin: 'Dr. Diallo Aminata', specialite: 'Cardiologie',
        date_heure: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        statut: 'termine', motif: 'Consultation cardiologique', duree: 45,
        room_id: 'docsecur-room-demo-002',
      },
    ]);
  }, []);

  /* ── Rejoindre une session Jitsi Meet ── */
  const joinSession = (session) => {
    setActiveSession(session);
    setInCall(true);
    setLoading(true);

    // Charger le SDK Jitsi Meet dynamiquement
    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi(session);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsi(session);
      script.onerror = () => {
        setLoading(false);
        alert('Impossible de charger Jitsi Meet. Vérifiez votre connexion internet.');
      };
      document.head.appendChild(script);
    };

    loadJitsi();
  };

  const initJitsi = (session) => {
    if (!jitsiContainerRef.current) { setLoading(false); return; }

    // Détruire l'ancienne instance si elle existe
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }

    const roomName = session.room_id || `docsecur-teleconsult-${session.id}-${Date.now()}`;

    try {
      jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        width:    '100%',
        height:   '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted:    false,
          startWithVideoMuted:    false,
          disableModeratorIndicator: true,
          enableEmailInStats:     false,
          prejoinPageEnabled:     false,
        },
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_JITSI_WATERMARK:             false,
          SHOW_WATERMARK_FOR_GUESTS:        false,
          DEFAULT_REMOTE_DISPLAY_NAME:      session.medecin || 'Médecin',
          TOOLBAR_BUTTONS: ['microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording', 'settings', 'raisehand', 'videoquality'],
        },
        userInfo: {
          displayName: 'Patient',
        },
        onload: () => setLoading(false),
      });

      jitsiApiRef.current.addEventListeners({
        readyToClose:   () => endCall(),
        videoConferenceLeft: () => endCall(),
        participantJoined: (p) => console.log('Médecin rejoint:', p),
      });

      setLoading(false);
    } catch (err) {
      console.error('Erreur Jitsi:', err);
      setLoading(false);
    }
  };

  const endCall = () => {
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch {}
      jitsiApiRef.current = null;
    }
    setInCall(false);
    setActiveSession(null);
  };

  const getStatusConfig = (statut) => ({
    planifie: { label: 'Planifiée', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
    en_cours: { label: 'En cours',  color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)' },
    termine:  { label: 'Terminée',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  }[statut] || { label: statut, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' });

  /* ── Active call UI ── */
  if (inCall && activeSession) {
    return (
      <div style={callLayout}>
        {/* Header de la call */}
        <div style={callHeader}>
          <div style={callInfo}>
            <div style={greenDot} />
            <span style={callTitle}>{activeSession.medecin}</span>
            <span style={callSpecialite}>{activeSession.specialite}</span>
            <span style={callMotif}>· {activeSession.motif}</span>
          </div>
          <button style={hangupBtn} onClick={endCall}>
            <FiPhone size={16} style={{ transform: 'rotate(135deg)' }} /> Terminer la consultation
          </button>
        </div>

        {/* Jitsi container */}
        <div ref={jitsiContainerRef} style={jitsiContainer}>
          {loading && (
            <div style={loadingOverlay}>
              <div style={spinner} />
              <div style={{ color: '#D1D5DB', fontSize: 14, marginTop: 16 }}>
                Connexion à la session vidéo…
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>
                Powered by Jitsi Meet (WebRTC)
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Sessions list ── */
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="topbar">
        <div>
          <p style={subStyle}>Consultations vidéo</p>
          <h1 style={titleStyle}>Mes Téléconsultations</h1>
        </div>
        <div style={jitsiPowered}>
          <FiVideo size={14} color="#0ED2A0" />
          <span>Powered by Jitsi Meet</span>
        </div>
      </div>

      {/* Info banner */}
      <div style={infoBanner}>
        <FiMonitor size={18} color="#38BDF8" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#38BDF8' }}>
            Consultation vidéo sécurisée
          </div>
          <div style={{ fontSize: 12, color: 'rgba(56,189,248,0.65)', marginTop: 2 }}>
            Vos consultations sont chiffrées de bout en bout via WebRTC. Assurez-vous d'être dans un endroit calme.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={statsRow}>
        {[
          { label: 'Total',     value: sessions.length,                                     color: '#111827' },
          { label: 'À venir',   value: sessions.filter(s => s.statut === 'planifie').length, color: '#38BDF8' },
          { label: 'Terminées', value: sessions.filter(s => s.statut === 'termine').length,  color: '#FBBF24' },
        ].map((s, i) => (
          <div key={i} style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📹</div>
          <div style={{ color: '#6B7280', fontSize: 14 }}>Aucune téléconsultation planifiée</div>
        </div>
      ) : sessions.map((session, i) => {
        const cfg = getStatusConfig(session.statut);
        const dt  = session.date_heure ? new Date(session.date_heure) : null;
        const canJoin = session.statut === 'planifie' || session.statut === 'en_cours';

        return (
          <div key={session.id || i} style={{ ...sessionCard, animation: `slideUp 0.4s ease ${i*70}ms both` }}>
            <div style={sessionLeft}>
              <div style={{ ...avatarCircle, background: canJoin ? 'rgba(14,210,160,0.15)' : '#F9FAFB',
                borderColor: canJoin ? 'rgba(14,210,160,0.3)' : '#E5E7EB' }}>
                <FiVideo size={20} color={canJoin ? '#0ED2A0' : '#9CA3AF'} />
              </div>
              <div>
                <div style={sessionDoc}>{session.medecin || '—'}</div>
                {session.specialite && (
                  <div style={sessionSpec}>{session.specialite}</div>
                )}
                <div style={sessionMeta}>
                  <FiCalendar size={10}/>
                  {dt ? dt.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' }) : '—'}
                  {' à '}
                  {dt ? dt.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) : '—'}
                  {session.duree && <> · <FiClock size={10}/> {session.duree} min</>}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                  {session.motif || '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <span style={{ ...statusBadge, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
              {canJoin ? (
                <button style={joinBtn} onClick={() => joinSession(session)}>
                  <FiVideo size={14}/> Rejoindre
                </button>
              ) : (
                <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                  Session terminée
                </span>
              )}
            </div>
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

/* ─── Styles ─── */
const subStyle   = { fontSize:13, color:'#6B7280', marginBottom:4, fontWeight:500 };
const titleStyle = { fontFamily:"'Outfit',sans-serif", fontSize:28, fontWeight:800, letterSpacing:'-0.5px', color:'#111827' };
const jitsiPowered = {
  display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
  background:'#F0FDF4', border:'1px solid #BBF7D0',
  borderRadius:10, fontSize:12, color:'#15803D',
};
const infoBanner = {
  display:'flex', alignItems:'flex-start', gap:14, padding:'14px 18px', marginBottom:20,
  background:'rgba(56,189,248,0.05)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:14,
};
const statsRow  = { display:'flex', gap:12, marginBottom:24 };
const statCard  = {
  flex:1, textAlign:'center', padding:'14px',
  background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:14,
};
const sessionCard = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'16px 20px', marginBottom:10,
  background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:14,
};
const sessionLeft   = { display:'flex', alignItems:'flex-start', gap:14 };
const avatarCircle  = { width:48, height:48, borderRadius:14, border:'1px solid', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
const sessionDoc    = { fontFamily:"'Outfit',sans-serif", fontSize:14, fontWeight:700, color:'#111827', marginBottom:2 };
const sessionSpec   = { fontSize:12, color:'#A78BFA', marginBottom:4 };
const sessionMeta   = { display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B7280' };
const statusBadge   = { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 };
const joinBtn       = {
  display:'flex', alignItems:'center', gap:8, padding:'9px 18px',
  background:'#16A34A', border:'1px solid #15803D',
  borderRadius:10, color:'#FFFFFF', fontSize:13, fontWeight:700, cursor:'pointer',
};

/* ─── Call UI styles ─── */
const callLayout   = { display:'flex', flexDirection:'column', height:'100vh', background:'#050B14' };
const callHeader   = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'12px 20px', background:'#0F172A', borderBottom:'1px solid #1F2937', flexShrink:0,
};
const callInfo     = { display:'flex', alignItems:'center', gap:12 };
const greenDot     = { width:8, height:8, borderRadius:'50%', background:'#0ED2A0', boxShadow:'0 0 8px #0ED2A0' };
const callTitle    = { fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:'#F9FAFB' };
const callSpecialite = { fontSize:12, color:'#A78BFA' };
const callMotif    = { fontSize:12, color:'#9CA3AF' };
const hangupBtn    = {
  display:'flex', alignItems:'center', gap:8, padding:'9px 18px',
  background:'rgba(248,113,113,0.15)', border:'1px solid rgba(248,113,113,0.25)',
  borderRadius:10, color:'#F87171', fontSize:13, fontWeight:600, cursor:'pointer',
};
const jitsiContainer = { flex:1, background:'#0A1220', position:'relative', overflow:'hidden' };
const loadingOverlay = {
  position:'absolute', inset:0, display:'flex', flexDirection:'column',
  alignItems:'center', justifyContent:'center', background:'rgba(5,11,20,0.95)',
};
const spinner = {
  width:40, height:40, border:'3px solid rgba(14,210,160,0.2)',
  borderTopColor:'#0ED2A0', borderRadius:'50%', animation:'spin 0.8s linear infinite',
};

export default TeleconsultationPatientPage;
