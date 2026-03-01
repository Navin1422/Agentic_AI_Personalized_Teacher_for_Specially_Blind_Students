import React, { createContext, useState, useEffect, useCallback } from 'react';

export const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [language, setLanguage] = useState('en-IN'); // Default to Indian English
    const [transcript, setTranscript] = useState('');
    const [role, setRole] = useState(null);
    const [userData, setUserData] = useState({ name: '', class: '', school: '', email: '' });

    // --- Text-to-Speech (TTS) ---
    const speak = useCallback((text, onEnd = () => { }) => {
        if (!window.speechSynthesis) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        let voices = window.speechSynthesis.getVoices();

        // Find most natural human-like voice (Prioritize Google voices first)
        const targetVoice = voices.find(v =>
            v.name.toLowerCase().includes('google') && 
            (language === 'en-IN' || language === 'en-US')
        ) ||
            voices.find(v =>
            (language === 'en-IN' && (v.lang.includes('en-IN') || v.name.includes('India')) && v.name.toLowerCase().includes('female')) ||
            (language === 'ta-IN' && (v.lang.includes('ta-IN') || v.name.includes('Tamil')) && v.name.toLowerCase().includes('female'))
        ) || voices.find(v =>
            (language === 'en-IN' && (v.lang.includes('en-IN') || v.name.includes('India'))) ||
            (language === 'ta-IN' && (v.lang.includes('ta-IN') || v.name.includes('Tamil')))
        );

        if (targetVoice) utterance.voice = targetVoice;
        utterance.lang = language;
        
        // Very natural human-like speech parameters
        utterance.rate = 1.0; // Normal human speaking speed
        utterance.pitch = 0.9; // Lower pitch for natural female voice
        utterance.volume = 0.9; // Slightly softer for natural sound

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            onEnd();
        };

        window.speechSynthesis.speak(utterance);
    }, [language]);

    // --- Speech-to-Text (STT) ---
    const listen = useCallback((onResult) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            setTranscript(result);
            if (onResult) onResult(result);
        };

        recognition.start();
        return recognition;
    }, [language]);

    // --- Clean email from voice input ---
    const cleanEmail = useCallback((raw) => {
        let clean = raw.replace(/\s+at\s+/g, '@');
        clean = clean.replace(/\s+dot\s+/g, '.');
        clean = clean.replace(/\s+/g, ''); // remove all other spaces
        return clean;
    }, []);

    // --- Set language helper ---
    const setVoiceLanguage = useCallback((lang) => {
        if (lang === 'tamil') {
            setLanguage('ta-IN');
        } else {
            setLanguage('en-IN');
        }
    }, []);

    return (
        <VoiceContext.Provider value={{
            isListening, 
            isSpeaking, 
            language, 
            setLanguage: setVoiceLanguage,
            transcript, 
            speak, 
            listen, 
            cleanEmail,
            role, 
            setRole, 
            userData, 
            setUserData
        }}>
            {children}
        </VoiceContext.Provider>
    );
};
