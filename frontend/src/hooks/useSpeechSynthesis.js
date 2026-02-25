import { useCallback, useRef } from 'react';

const useSpeechSynthesis = () => {
  const utteranceRef = useRef(null);

  const speak = useCallback((text, { lang = 'en-IN', rate = 0.9, pitch = 1.1 } = {}) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = lang;
    utterance.rate  = rate;
    utterance.pitch = pitch;

    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en-IN') ||
      v.name.toLowerCase().includes('india') ||
      v.lang === 'en-US'
    );
    if (preferred) utterance.voice = preferred;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    return utterance;
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const speakTamil = useCallback((text) => {
    speak(text, { lang: 'ta-IN', rate: 0.85 });
  }, [speak]);

  return { speak, stop, speakTamil };
};

export default useSpeechSynthesis;
