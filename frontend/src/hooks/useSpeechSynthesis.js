import { useCallback, useRef } from 'react';

const useSpeechSynthesis = () => {
  const utteranceRef = useRef(null);

  // Pre-fetch voices
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }

  const speak = useCallback((text, { lang = 'en-US', rate = 0.86, pitch = 1.0 } = {}) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = lang;
    utterance.rate  = rate;
    utterance.pitch = pitch;

    // Try to pick a good voice, prioritizing Mac's Siri or high-quality voices
    const getBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // 1. ABSOLUTE PRIORITY: Siri
      const siri = voices.find(v => v.name.toLowerCase().includes('siri') && v.lang.startsWith('en'));
      if (siri) return siri;

      // 2. Preferred premium names
      const preferredNames = ['ava', 'zoe', 'samantha', 'daniel', 'moya', 'google us english', 'karen'];
      
      // 3. Search for "Enhanced" or "Premium" versions
      for (const name of preferredNames) {
        const enhanced = voices.find(v => 
          v.name.toLowerCase().includes(name) && 
          (v.name.toLowerCase().includes('enhanced') || v.name.toLowerCase().includes('premium')) &&
          v.lang.startsWith('en')
        );
        if (enhanced) return enhanced;
      }

      // 4. Standard versions of preferred names
      for (const name of preferredNames) {
        const v = voices.find(v => v.name.toLowerCase().includes(name) && v.lang.startsWith('en'));
        if (v) return v;
      }
      
      // 5. Fallback for localized accent
      if (lang === 'en-IN') {
        const inVoice = voices.find(v => v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india'));
        if (inVoice) return inVoice;
      }
      
      return voices.find(v => v.lang.startsWith('en'));
    };

    const preferred = getBestVoice();
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
