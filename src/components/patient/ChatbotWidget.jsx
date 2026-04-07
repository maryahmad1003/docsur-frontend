import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMessageCircle, FiUser, FiLoader } from 'react-icons/fi';
import API from '../../api/axiosConfig';

const ChatbotWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Bonjour! Je suis DocSecur, votre assistant santé. Comment puis-je vous aider aujourd'hui?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await API.post('/chatbot/chat', {
        message: userMessage.content,
        context: {
          user_id: user?.id,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        },
      });

      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.reply,
        source: response.data.source,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Désolé, je rencontre une difficulté. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={floatingButton}
        title="Assistant DocSecur"
      >
        <FiMessageSquare size={24} />
      </button>
    );
  }

  return (
    <div style={widgetContainer}>
      <div style={widgetHeader}>
        <div style={headerContent}>
          <FiMessageCircle size={20} />
          <span>Assistant DocSecur</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={closeBtn}>
          <FiX size={18} />
        </button>
      </div>

      <div style={messagesContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...messageBubble,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#16A34A' : '#F3F4F6',
              color: msg.role === 'user' ? '#fff' : '#111827',
            }}
          >
            <div style={messageRole}>
              {msg.role === 'user' ? <FiUser size={12} /> : <FiMessageCircle size={12} />}
            </div>
            <div style={messageContent}>{msg.content}</div>
            <div style={messageTime}>
              {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={loadingContainer}>
            <FiLoader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Ecoute...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div style={inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Posez votre question..."
          style={inputField}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={sendButton}
        >
          <FiSend size={16} />
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const floatingButton = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #16A34A, #059669)',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
  zIndex: 9998,
  transition: 'transform 0.2s',
};

const widgetContainer = {
  position: 'fixed',
  bottom: 90,
  right: 24,
  width: 380,
  height: 520,
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(15, 23, 42, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  zIndex: 9999,
  animation: 'slideUp 0.3s ease',
};

const widgetHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  background: 'linear-gradient(135deg, #16A34A, #059669)',
  color: '#fff',
};

const headerContent = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontWeight: 700,
  fontSize: 15,
};

const closeBtn = {
  background: 'rgba(255,255,255,0.2)',
  border: 'none',
  borderRadius: 8,
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  cursor: 'pointer',
};

const messagesContainer = {
  flex: 1,
  padding: 16,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const messageBubble = {
  maxWidth: '85%',
  padding: '10px 14px',
  borderRadius: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const messageRole = {
  fontSize: 10,
  fontWeight: 600,
  opacity: 0.7,
};

const messageContent = {
  fontSize: 14,
  lineHeight: 1.5,
};

const messageTime = {
  fontSize: 10,
  opacity: 0.6,
  textAlign: 'right',
};

const loadingContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#F3F4F6',
  borderRadius: 12,
  alignSelf: 'flex-start',
  color: '#6B7280',
  fontSize: 13,
};

const inputContainer = {
  display: 'flex',
  gap: 8,
  padding: 12,
  borderTop: '1px solid #E5E7EB',
};

const inputField = {
  flex: 1,
  padding: '10px 14px',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  fontSize: 14,
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
};

const sendButton = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: '#16A34A',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default ChatbotWidget;
