import { useState, useCallback, useRef, useEffect } from 'react';

export const useVoiceRecognition = (options = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const {
    lang = 'fr-FR',
    continuous = false,
    interimResults = true,
    onResult,
    onEnd,
    onError,
  } = options;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = lang;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
          onResult?.(finalTranscript, prev => prev + ' ' + finalTranscript);
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event) => {
        const errorMsg = getErrorMessage(event.error);
        setError(errorMsg);
        onError?.(errorMsg);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        onEnd?.();
    };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous, interimResults]);

  const startListening = useCallback(() => {
    setError(null);
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setError('Erreur au demarrage de la reconnaissance vocale');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const setLanguage = useCallback((newLang) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang;
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  };
};

const getErrorMessage = (error) => {
  const errors = {
    'no-speech': 'Aucune parole detectee. Parlez plus fort.',
    'audio-capture': 'Microphone non accessible.',
    'not-allowed': 'Permission microphone refusee.',
    'network': 'Erreur reseau.',
    'aborted': 'Reconnaissance annulee.',
    'language-not-supported': 'Langue non supportee.',
  };
  return errors[error] || 'Erreur de reconnaissance vocale';
};

export default useVoiceRecognition;
