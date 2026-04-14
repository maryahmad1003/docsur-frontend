import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiSend, FiPaperclip, FiX, FiMessageCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { getConversations, getContacts, getMessages, sendMessage } from '../../api/messagesAPI';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  medecin: '#38BDF8', patient: '#0ED2A0', pharmacien: '#FBBF24',
  laborantin: '#A78BFA', administrateur: '#F87171',
};
const ROLE_LABELS = {
  medecin: 'Médecin', patient: 'Patient', pharmacien: 'Pharmacien',
  laborantin: 'Laborantin', administrateur: 'Administrateur',
};

function initials(u) {
  return `${(u?.prenom || '?')[0]}${(u?.nom || '?')[0]}`.toUpperCase();
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)  return 'À l\'instant';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts]           = useState([]);
  const [activeUser, setActiveUser]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [search, setSearch]               = useState('');
  const [searchContacts, setSearchContacts] = useState('');
  const [text, setText]                   = useState('');
  const [fichier, setFichier]             = useState(null);
  const [sending, setSending]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [showContacts, setShowContacts]   = useState(false);
  const [error, setError]                 = useState('');
  const [convPage, setConvPage]           = useState(1);
  const [convHasMore, setConvHasMore]     = useState(false);
  const [contactsPage, setContactsPage]   = useState(1);
  const [contactsHasMore, setContactsHasMore] = useState(false);
  const [messagesPage, setMessagesPage]   = useState(1);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const messagesEndRef                    = useRef(null);
  const fileInputRef                      = useRef(null);

  // ── Load conversations ──
  const loadConversations = useCallback(async (page = 1, append = false) => {
    try {
      const res = await getConversations({ page, per_page: 20 });
      const payload = res.data ?? {};
      const data = payload.data ?? payload ?? [];
      setConversations(prev => append ? [...prev, ...(Array.isArray(data) ? data : [])] : (Array.isArray(data) ? data : []));
      setConvHasMore((payload.current_page ?? 1) < (payload.last_page ?? 1));
      setConvPage(payload.current_page ?? page);
    } catch {}
  }, []);

  const loadContacts = useCallback(async (page = 1, append = false) => {
    try {
      const res = await getContacts({ page, per_page: 30 });
      const payload = res.data ?? {};
      const data = payload.data ?? payload ?? [];
      setContacts(prev => append ? [...prev, ...(Array.isArray(data) ? data : [])] : (Array.isArray(data) ? data : []));
      setContactsHasMore((payload.current_page ?? 1) < (payload.last_page ?? 1));
      setContactsPage(payload.current_page ?? page);
    } catch {}
  }, []);

  useEffect(() => {
    loadConversations(1, false);
    loadContacts(1, false);
  }, [loadConversations, loadContacts]);

  // ── Load messages for active conversation ──
  const loadMessages = useCallback(async (page = 1, append = false) => {
    if (!activeUser) return;
    try {
      const res = await getMessages(activeUser.id, { page, per_page: 50 });
      const data = res.data;
      const items = data.data ?? data ?? [];
      setMessages(prev => append ? [...(Array.isArray(items) ? items : []), ...prev] : (Array.isArray(items) ? items : []));
      setMessagesHasMore((data.current_page ?? 1) < (data.last_page ?? 1));
      setMessagesPage(data.current_page ?? page);
    } catch {}
  }, [activeUser]);

  useEffect(() => {
    if (!activeUser) return;
    setLoading(true);
    setMessages([]);
    setMessagesPage(1);
    loadMessages(1, false).finally(() => setLoading(false));
  }, [activeUser, loadMessages]);

  const loadOlderMessages = async () => {
    if (!activeUser || !messagesHasMore || loadingMoreMessages) return;
    setLoadingMoreMessages(true);
    const nextPage = messagesPage + 1;
    await loadMessages(nextPage, true);
    setLoadingMoreMessages(false);
  };

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──
  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeUser || (!text.trim() && !fichier)) return;
    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('destinataire_id', activeUser.id);
      if (text.trim()) formData.append('contenu', text.trim());
      if (fichier) formData.append('fichier', fichier);

      const res = await sendMessage(formData);
      setMessages(prev => [...prev, res.data]);
      setText('');
      setFichier(null);
      loadConversations(1, false);
    } catch {
      setError('Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setSending(false);
    }
  };

  // ── Select contact / conversation ──
  const handleSelectUser = (user) => {
    setActiveUser(user);
    setShowContacts(false);
  };

  // ── Filter conversations ──
  const filteredConversations = conversations.filter(c => {
    const q = search.toLowerCase();
    return !q
      || c.interlocuteur.nom.toLowerCase().includes(q)
      || c.interlocuteur.prenom.toLowerCase().includes(q);
  });

  const filteredContacts = contacts.filter(c => {
    const q = searchContacts.toLowerCase();
    return !q
      || c.nom.toLowerCase().includes(q)
      || c.prenom.toLowerCase().includes(q)
      || ROLE_LABELS[c.role]?.toLowerCase().includes(q);
  });

  return (
    <div style={styles.page}>
      <style>{keyframes}</style>

      {/* ── Sidebar ── */}
      <div style={styles.sidebar}>
        {/* Header sidebar */}
        <div style={styles.sideHeader}>
          <h2 style={styles.sideTitle}>Messages</h2>
          <button style={styles.newChatBtn} onClick={() => setShowContacts(s => !s)} title="Nouveau message">
            {showContacts ? <FiX size={17}/> : <FiMessageCircle size={17}/>}
          </button>
        </div>

        {/* Recherche contacts pour nouveau message */}
        {showContacts && (
          <div style={styles.contactsPanel}>
            <div style={styles.searchWrap}>
              <FiSearch size={13} style={styles.searchIcon} />
              <input
                style={styles.searchInput}
                placeholder="Chercher un contact..."
                value={searchContacts}
                onChange={e => setSearchContacts(e.target.value)}
                autoFocus
              />
            </div>
            <div style={styles.contactsList}>
              {filteredContacts.length === 0 ? (
                <div style={styles.emptyList}>Aucun contact</div>
              ) : filteredContacts.map(c => (
                <button key={c.id} style={styles.contactItem} onClick={() => handleSelectUser(c)}>
                  <div style={{ ...styles.avatar, background: `${ROLE_COLORS[c.role]}22`, color: ROLE_COLORS[c.role] }}>
                    {initials(c)}
                  </div>
                  <div style={styles.contactInfo}>
                    <span style={styles.contactName}>{c.prenom} {c.nom}</span>
                    <span style={{ ...styles.roleBadge, color: ROLE_COLORS[c.role] }}>{ROLE_LABELS[c.role]}</span>
                  </div>
                </button>
              ))}
              {contactsHasMore && (
                <button style={styles.loadMoreBtn} onClick={() => loadContacts(contactsPage + 1, true)}>
                  Charger plus de contacts
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recherche conversations */}
        {!showContacts && (
          <>
            <div style={styles.searchWrap}>
              <FiSearch size={13} style={styles.searchIcon} />
              <input
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Liste conversations */}
            <div style={styles.convList}>
              {filteredConversations.length === 0 ? (
                <div style={styles.emptyList}>Aucune conversation</div>
              ) : filteredConversations.map(c => (
                <button
                  key={c.interlocuteur_id}
                  style={{
                    ...styles.convItem,
                    ...(activeUser?.id === c.interlocuteur_id ? styles.convItemActive : {}),
                  }}
                  onClick={() => handleSelectUser(c.interlocuteur)}
                >
                  <div style={{ ...styles.avatar, background: `${ROLE_COLORS[c.interlocuteur.role]}22`, color: ROLE_COLORS[c.interlocuteur.role] }}>
                    {c.interlocuteur.photo_profil
                      ? <img src={`/storage/${c.interlocuteur.photo_profil}`} alt="" style={styles.avatarImg}/>
                      : initials(c.interlocuteur)
                    }
                  </div>
                  <div style={styles.convInfo}>
                    <div style={styles.convTopRow}>
                      <span style={styles.convName}>{c.interlocuteur.prenom} {c.interlocuteur.nom}</span>
                      <span style={styles.convTime}>{formatTime(c.dernier_message_at)}</span>
                    </div>
                    <div style={styles.convPreviewRow}>
                      <span style={styles.convPreview}>{c.dernier_message || '...'}</span>
                      {c.non_lus > 0 && (
                        <span style={styles.unreadBadge}>{c.non_lus}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {convHasMore && (
                <button style={styles.loadMoreBtn} onClick={() => loadConversations(convPage + 1, true)}>
                  Charger plus de conversations
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Chat Area ── */}
      <div style={styles.chatArea}>
        {!activeUser ? (
          <div style={styles.emptyChat}>
            <FiMessageCircle size={48} color="rgba(255,255,255,0.1)"/>
            <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: 16, fontSize: 14 }}>
              Sélectionnez une conversation ou démarrez-en une nouvelle
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ ...styles.avatar, background: `${ROLE_COLORS[activeUser.role]}22`, color: ROLE_COLORS[activeUser.role] }}>
                  {initials(activeUser)}
                </div>
                <div>
                  <div style={styles.chatHeaderName}>{activeUser.prenom} {activeUser.nom}</div>
                  <div style={{ ...styles.roleBadge, color: ROLE_COLORS[activeUser.role] }}>{ROLE_LABELS[activeUser.role]}</div>
                </div>
              </div>
              <button style={styles.refreshBtn} onClick={() => loadMessages(1, false)} title="Rafraîchir les messages">
                <FiRefreshCw size={14} />
              </button>
            </div>

            {/* Messages */}
            <div style={styles.messagesList}>
              {messagesHasMore && (
                <button style={styles.loadMoreBtn} onClick={loadOlderMessages} disabled={loadingMoreMessages}>
                  {loadingMoreMessages ? 'Chargement...' : 'Charger les anciens messages'}
                </button>
              )}
              {loading && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 20, fontSize: 13 }}>
                  Chargement...
                </div>
              )}
              {messages.map((m, i) => {
                // Si expediteur_id === activeUser.id → message reçu, sinon envoyé
                const received = m.expediteur_id === activeUser.id;
                return (
                  <div key={m.id ?? i} style={{ ...styles.messageRow, justifyContent: received ? 'flex-start' : 'flex-end' }}>
                    {received && (
                      <div style={{ ...styles.avatar, ...styles.avatarSmall, background: `${ROLE_COLORS[activeUser.role]}22`, color: ROLE_COLORS[activeUser.role], flexShrink: 0 }}>
                        {initials(m.expediteur || activeUser)}
                      </div>
                    )}
                    <div style={{ maxWidth: '68%' }}>
                      <div style={{ ...styles.bubble, ...(received ? styles.bubbleReceived : styles.bubbleSent) }}>
                        {m.fichier_url && (
                          <div style={styles.fileAttach}>
                            {m.type === 'image'
                              ? <img src={`/storage/${m.fichier_url}`} alt="pièce jointe" style={{ maxWidth: 200, borderRadius: 8 }}/>
                              : <a href={`/storage/${m.fichier_url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0ED2A0' }}>📎 Fichier joint</a>
                            }
                          </div>
                        )}
                        {m.contenu && <span>{m.contenu}</span>}
                      </div>
                      <div style={{ ...styles.messageTime, textAlign: received ? 'left' : 'right' }}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form style={styles.inputRow} onSubmit={handleSend}>
              {error && (
                <div style={styles.errorBar}>
                  <FiAlertCircle size={13}/> {error}
                </div>
              )}
              {fichier && (
                <div style={styles.fichierPreview}>
                  📎 {fichier.name}
                  <button type="button" style={styles.removeFile} onClick={() => setFichier(null)}><FiX size={12}/></button>
                </div>
              )}
              <div style={styles.inputWrap}>
                <button
                  type="button"
                  style={styles.attachBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier"
                >
                  <FiPaperclip size={17}/>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={e => setFichier(e.target.files[0] || null)}
                />
                <input
                  style={styles.textInput}
                  placeholder="Écrire un message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); } }}
                />
                <button
                  type="submit"
                  style={{ ...styles.sendBtn, opacity: (text.trim() || fichier) ? 1 : 0.4 }}
                  disabled={sending || (!text.trim() && !fichier)}
                >
                  <FiSend size={17}/>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── KEYFRAMES ────────────────────────────────────────────────────────────────
const keyframes = `
  @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }
`;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    display: 'flex',
    height: '100vh',
    background: '#070D1A',
    fontFamily: "'DM Sans', sans-serif",
    color: '#fff',
    overflow: 'hidden',
  },
  // Sidebar
  sidebar: {
    width: 320,
    flexShrink: 0,
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.02)',
  },
  sideHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 18px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  sideTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 20, fontWeight: 700, margin: 0,
    background: 'linear-gradient(135deg, #fff 0%, #0ED2A0 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  newChatBtn: {
    background: 'rgba(14,210,160,0.12)', border: '1px solid rgba(14,210,160,0.25)',
    color: '#0ED2A0', borderRadius: 9, width: 34, height: 34,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  searchWrap: {
    position: 'relative', margin: '10px 14px',
  },
  searchIcon: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '9px 12px 9px 34px', color: '#fff', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  },
  convList: { flex: 1, overflowY: 'auto', paddingBottom: 12 },
  convItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', background: 'none', border: 'none',
    color: '#fff', cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s',
  },
  convItemActive: { background: 'rgba(14,210,160,0.08)', borderRight: '2px solid #0ED2A0' },
  convInfo: { flex: 1, overflow: 'hidden' },
  convTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convTime: { color: 'rgba(255,255,255,0.35)', fontSize: 11, flexShrink: 0, marginLeft: 6 },
  convPreviewRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  convPreview: { color: 'rgba(255,255,255,0.4)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  unreadBadge: {
    background: '#0ED2A0', color: '#070D1A', borderRadius: 10,
    fontSize: 10, fontWeight: 700, padding: '2px 6px', flexShrink: 0, marginLeft: 6,
  },
  // Contacts panel
  contactsPanel: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  contactsList: { flex: 1, overflowY: 'auto' },
  contactItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', background: 'none', border: 'none', color: '#fff',
    cursor: 'pointer', textAlign: 'left',
  },
  contactInfo: { display: 'flex', flexDirection: 'column' },
  contactName: { fontWeight: 600, fontSize: 14 },
  roleBadge: { fontSize: 11, fontWeight: 600, marginTop: 2 },
  // Avatar
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13, flexShrink: 0,
    fontFamily: "'Outfit', sans-serif", overflow: 'hidden',
  },
  avatarSmall: { width: 30, height: 30, fontSize: 11 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  emptyList: { color: 'rgba(255,255,255,0.3)', padding: '20px 16px', fontSize: 13, textAlign: 'center' },
  // Chat area
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  chatHeader: {
    padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.02)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  chatHeaderName: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 16 },
  messagesList: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  loadMoreBtn: {
    alignSelf: 'center',
    margin: '8px 0',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    padding: '8px 12px',
    cursor: 'pointer',
  },
  refreshBtn: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.75)',
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  bubble: { padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' },
  bubbleSent: {
    background: 'linear-gradient(135deg, #0ED2A0 0%, #059669 100%)',
    color: '#070D1A', borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff', borderBottomLeftRadius: 4,
  },
  messageTime: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 },
  fileAttach: { marginBottom: 6 },
  // Input
  inputRow: {
    padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.02)', flexShrink: 0,
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  inputWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  attachBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
    padding: 6, display: 'flex', alignItems: 'center',
  },
  textInput: {
    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #0ED2A0 0%, #059669 100%)',
    border: 'none', color: '#070D1A', borderRadius: 10,
    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s',
  },
  fichierPreview: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(14,210,160,0.08)', borderRadius: 8, padding: '6px 12px',
    color: '#0ED2A0', fontSize: 12,
  },
  removeFile: {
    background: 'none', border: 'none', color: '#F87171', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  errorBar: {
    display: 'flex', alignItems: 'center', gap: 6,
    color: '#F87171', fontSize: 12, background: 'rgba(248,113,113,0.08)',
    borderRadius: 8, padding: '6px 12px',
  },
};
