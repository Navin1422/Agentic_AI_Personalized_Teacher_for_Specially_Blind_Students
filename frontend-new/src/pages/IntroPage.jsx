import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import voiceAssistant from '../services/voiceAssistant';
import '../styles/index.css';

const IntroPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('SYSTEM INIT: OK');
    const [isListening, setIsListening] = useState(false);
    const flowStarted = useRef(false);

    useEffect(() => {
        const startIntro = async () => {
            if (flowStarted.current) return;
            flowStarted.current = true;

            setStatus('EXECUTING AI INTRODUCTION...');
            const introText = "Welcome to EduVoice. We are an AI-powered education Platform.";

            voiceAssistant.speak(introText, async () => {
                askLanguage();
            });
        };

        const timer = setTimeout(startIntro, 1000);
        return () => clearTimeout(timer);
    }, []);

    const askLanguage = () => {
        setStatus('AWAITING LANGUAGE SELECTION...');
        voiceAssistant.speak("Would you like to continue in English or Tamil?", async () => {
            setIsListening(true);
            try {
                const result = await voiceAssistant.listen(
                    (res) => {
                        console.log('Language result:', res);
                        setIsListening(false);
                        
                        // More flexible language detection
                        const normalizedResult = res.toLowerCase().trim();
                        
                        if (normalizedResult.includes('tamil') || normalizedResult.includes('தமிழ்')) {
                            voiceAssistant.setLanguage('tamil');
                            voiceAssistant.speak("Okay, I will speak in Tamil.", () => {
                                askRole('tamil');
                            });
                        } else if (normalizedResult.includes('english') || normalizedResult.includes('ஆங்கிலம்')) {
                            voiceAssistant.setLanguage('english');
                            voiceAssistant.speak("Okay, I will speak in English.", () => {
                                askRole('english');
                            });
                        } else {
                            voiceAssistant.speak("Sorry, please say English or Tamil.", askLanguage);
                        }
                    },
                    (err) => {
                        console.error('Language recognition error:', err);
                        setIsListening(false);
                        
                        // Handle specific errors
                        if (err === 'microphone_denied') {
                            voiceAssistant.speak("Microphone access is required. Please allow microphone access and refresh the page.", () => {
                                setStatus('MICROPHONE ACCESS REQUIRED');
                            });
                        } else if (err === 'not_supported') {
                            voiceAssistant.speak("Voice recognition is not supported in your browser. Please use Chrome or Edge.", () => {
                                setStatus('BROWSER NOT SUPPORTED');
                            });
                        } else {
                            voiceAssistant.speak("I didn't hear that. English or Tamil?", askLanguage);
                        }
                    }
                );
                
                // Timeout handling
                setTimeout(() => {
                    if (isListening) {
                        setIsListening(false);
                        voiceAssistant.speak("I didn't hear you. Please say English or Tamil.", askLanguage);
                    }
                }, 8000); // Increased timeout to 8 seconds
                
            } catch (error) {
                console.error('Voice recognition failed:', error);
                setIsListening(false);
                voiceAssistant.speak("Voice recognition not working. Please try again.", askLanguage);
            }
        });
    };

    const askRole = (lang) => {
        const introQuestion = lang === 'tamil' 
            ? "சொல்லுங்கள், நீங்கள் யார்?"
            : "Tell me, who are you?";
        
        const roleQuestion = lang === 'tamil' 
            ? "மாணவர்,ஆசிரியர், அல்லது நிர்வாகி?"
            : "Student, Teacher, or Admin?";

        setStatus('AWAITING ROLE SELECTION...');
        
        // Ensure voice assistant speaks the introduction first
        setTimeout(() => {
            voiceAssistant.speak(introQuestion, async () => {
                // No pause for both languages - immediate flow
                voiceAssistant.speak(roleQuestion, async () => {
                        setIsListening(true);
                        try {
                            const result = await voiceAssistant.listen(
                                (res) => {
                                    console.log('Role result:', res);
                                    setIsListening(false);
                                    const role = res.toLowerCase();
                                    if (role.includes('student') || role.includes('மாணவர்')) {
                                        navigate('/login', { state: { role: 'student', lang } });
                                    } else if (role.includes('teacher') || role.includes('ஆசிரியர்')) {
                                        navigate('/login', { state: { role: 'teacher', lang } });
                                    } else if (role.includes('admin') || role.includes('நிர்வாகி')) {
                                        navigate('/login', { state: { role: 'admin', lang } });
                                    } else {
                                        const retryQuestion = lang === 'tamil' 
                                            ? "தெளிவாக சொல்லுங்கள்: மாணவர், ஆசிரியர், அல்லது நிர்வாகி?"
                                            : "Please say your role clearly: Student, Teacher, or Admin.";
                                        voiceAssistant.speak(retryQuestion, () => askRole(lang));
                                    }
                                },
                                (err) => {
                                    console.error('Role recognition error:', err);
                                    setIsListening(false);
                                    
                                    // Handle specific errors
                                    if (err === 'microphone_denied') {
                                        const errorMsg = lang === 'tamil' 
                                            ? "ஒலிப்பு அணுமதி தேவை. தயவுசெய்து ஒலிப்பு அணுமதியை வழங்கவும்."
                                            : "Microphone access is required. Please allow microphone access and refresh the page.";
                                        voiceAssistant.speak(errorMsg, () => {
                                            setStatus('MICROPHONE ACCESS REQUIRED');
                                        });
                                    } else if (err === 'not_supported') {
                                        const errorMsg = lang === 'tamil'
                                            ? "உங்கள் உலாவியில் குரல் அடையாளம் ஆதரிக்கப்படவில்லை. குரோம் அல்லது எட்ஜை பயன்படுத்தவும்."
                                            : "Voice recognition is not supported in your browser. Please use Chrome or Edge.";
                                        voiceAssistant.speak(errorMsg, () => {
                                            setStatus('BROWSER NOT SUPPORTED');
                                        });
                                    } else {
                                        const retryQuestion = lang === 'tamil'
                                            ? "நான் கேட்கவில்லை. மாணவர், ஆசிரியர், அல்லது நிர்வாகி என்று சொல்லுங்கள்."
                                            : "I didn't hear that. Please say Student, Teacher, or Admin.";
                                        voiceAssistant.speak(retryQuestion, () => askRole(lang));
                                    }
                                }
                            );
                            
                            // Timeout handling
                            setTimeout(() => {
                                if (isListening) {
                                    setIsListening(false);
                                    const timeoutQuestion = lang === 'tamil'
                                        ? "நான் உங்களைக் கேட்கவில்லை. மாணவர், ஆசிரியர், அல்லது நிர்வாகி என்று சொல்லுங்கள்."
                                        : "I didn't hear you. Please say Student, Teacher, or Admin.";
                                    voiceAssistant.speak(timeoutQuestion, () => askRole(lang));
                                }
                            }, 8000); // Increased timeout to 8 seconds
                            
                        } catch (error) {
                            console.error('Voice recognition failed:', error);
                            setIsListening(false);
                            const errorMsg = lang === 'tamil'
                                ? "குரல் அடையாளம் வேலை செய்யவில்லை. மீண்டும் முயற்சிக்கவும்."
                                : "Voice recognition not working. Please try again.";
                            voiceAssistant.speak(errorMsg, () => askRole(lang));
                        }
                    });
                });
        }, 500); // Small delay to ensure voice is ready
    };

    return (
        <div className="voice-orb-container fade-in">
            <div className="voice-orb-wrapper">
                <div className="orb-ring"></div>
                <div className={`voice-orb ${isListening ? 'listening' : ''}`}>
                    <div className="pulse-layer"></div>
                    <span style={{ fontSize: '4rem', zIndex: 10 }}>{isListening ? '👂' : '🗣️'}</span>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <h1>EduVoice</h1>
                <div className="status-badge">{status}</div>
            </div>

            <p style={{ maxWidth: '600px', textAlign: 'center', fontWeight: 600, fontSize: '1.2rem', marginTop: '2rem' }}>
                DEDICATED TO VISUALLY IMPAIRED LEARNERS
            </p>

            <div style={{
                marginTop: '4rem',
                display: 'flex',
                gap: '2rem',
                padding: '2rem',
                border: '4px solid black',
                background: 'white',
                boxShadow: 'var(--shadow)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 800, textTransform: 'uppercase' }}>Debug Terminal:</p>
                    <button onClick={() => navigate('/login', { state: { role: 'student' } })}>Login: Student</button>
                    <button onClick={() => navigate('/login', { state: { role: 'teacher' } })}>Login: Teacher</button>
                    <button onClick={() => navigate('/login', { state: { role: 'admin' } })}>Login: Admin</button>
                </div>
            </div>
        </div>
    );
};

export default IntroPage;
