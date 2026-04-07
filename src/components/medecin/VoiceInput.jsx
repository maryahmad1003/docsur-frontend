import { useState, useCallback } from 'react';
import useVoiceRecognition from '../../hooks/useVoiceRecognition';
import { FiMic, FiMicOff, FiX, FiCheck } from 'react-icons/fi';

const VoiceInput = ({
  onTranscript,
  placeholder = 'Cliquez sur le microphone et parlez...',
  language = 'fr-FR',
  disabled = false,
  compact = false,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [finalText, setFinalText] = useState('');

  const handleResult = useCallback((text) => {
    setFinalText(text);
  }, []);

  const {
    isListening,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    lang: language,
    continuous: true,
    onResult: handleResult,
  });

  const handleStart = () => {
    if (!isSupported) {
      alert('La reconnaissance vocale nest pas supportee par votre navigateur.');
      return;
    }
    resetTranscript();
    setFinalText('');
    setShowPopup(true);
    startListening();
  };

  const handleStop = () => {
    stopListening();
  };

  const handleSend = () => {
    const fullText = finalText || interimTranscript;
    if (fullText.trim()) {
      onTranscript?.(fullText.trim());
    }
    setShowPopup(false);
    resetTranscript();
    setFinalText('');
  };

  const handleCancel = () => {
    stopListening();
    setShowPopup(false);
    resetTranscript();
    setFinalText('');
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled}
        style={{
          ...compactButton,
          background: isListening ? '#DC2626' : '#F3F4F6',
          color: isListening ? '#fff' : '#6B7280',
        }}
        title={isListening ? 'Arreter' : 'Activer la reconnaissance vocale'}
      >
        {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled}
        style={micButton}
      >
        <FiMic size={18} />
        <span>Dictée vocale</span>
      </button>

      {showPopup && (
        <div style={overlay}>
          <div style={popup}>
            <div style={popupHeader}>
              <div style={pulseContainer}>
                <div style={pulseRing(isListening)} />
                <div style={micIconContainer(isListening)}>
                  {isListening ? (
                    <FiMic size={24} color="#fff" />
                  ) : (
                    <FiMicOff size={24} color="#6B7280" />
                  )}
                </div>
              </div>
              <span style={popupTitle}>
                {isListening ? 'Ecoute en cours...' : 'Dictée vocale'}
              </span>
              <button style={closeBtn} onClick={handleCancel}>
                <FiX size={20} />
              </button>
            </div>

            <div style={transcriptArea}>
              {finalText && (
                <div style={finalTextStyle}>{finalText}</div>
              )}
              {interimTranscript && (
                <div style={interimTextStyle}>{interimTranscript}</div>
              )}
              {!finalText && !interimTranscript && (
                <div style={placeholderStyle}>{placeholder}</div>
              )}
              {error && (
                <div style={errorStyle}>{error}</div>
              )}
            </div>

            <div style={popupFooter}>
              <button style={cancelBtn} onClick={handleCancel}>
                <FiX size={16} /> Annuler
              </button>
              <button style={sendBtn} onClick={handleSend}>
                <FiCheck size={16} /> Utiliser ce texte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const compactButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 10,
  border: '1px solid #E5E7EB',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const micButton = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: 10,
  color: '#2563EB',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const popup = {
  background: '#fff',
  borderRadius: 20,
  width: '90%',
  maxWidth: 500,
  boxShadow: '0 24px 60px rgba(15,23,42,0.25)',
  animation: 'slideUp 0.3s ease',
};

const popupHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '20px 24px',
  borderBottom: '1px solid #E5E7EB',
};

const pulseContainer = {
  position: 'relative',
  width: 56,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const pulseRing = (isListening) => ({
  position: 'absolute',
  width: isListening ? 56 : 0,
  height: isListening ? 56 : 0,
  borderRadius: '50%',
  background: isListening ? 'rgba(220,38,38,0.2)' : 'transparent',
  animation: isListening ? 'pulse 1.5s infinite' : 'none',
});

const micIconContainer = (isListening) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: isListening ? 'linear-gradient(135deg,#DC2626,#EF4444)' : '#F3F4F6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s',
});

const popupTitle = {
  flex: 1,
  fontFamily: "'Outfit', sans-serif",
  fontSize: 18,
  fontWeight: 700,
  color: '#111827',
};

const closeBtn = {
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#6B7280',
};

const transcriptArea = {
  padding: '24px',
  minHeight: 120,
  maxHeight: 200,
  overflowY: 'auto',
};

const finalTextStyle = {
  fontSize: 15,
  color: '#111827',
  lineHeight: 1.6,
};

const interimTextStyle = {
  fontSize: 15,
  color: '#9CA3AF',
  fontStyle: 'italic',
  lineHeight: 1.6,
};

const placeholderStyle = {
  fontSize: 14,
  color: '#9CA3AF',
  textAlign: 'center',
  padding: '20px 0',
};

const errorStyle = {
  fontSize: 13,
  color: '#DC2626',
  background: '#FEF2F2',
  padding: '10px 14px',
  borderRadius: 8,
  marginTop: 8,
};

const popupFooter = {
  display: 'flex',
  gap: 12,
  padding: '16px 24px',
  borderTop: '1px solid #E5E7EB',
};

const cancelBtn = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '12px 16px',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  color: '#6B7280',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
};

const sendBtn = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '12px 16px',
  background: '#16A34A',
  border: '1px solid #15803D',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
};

export default VoiceInput;
