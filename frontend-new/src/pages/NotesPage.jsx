import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VoiceContext } from '../context/VoiceContext';
import { useStudent } from '../context/StudentContext';
import { saveNotes } from '../services/api';
import '../styles/index.css';

const NotesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { speak, listen, isListening } = useContext(VoiceContext);
    const { student } = useStudent();

    const topic = location.state?.topic || 'GENERAL LEARNING';
    const [notes, setNotes] = useState([]);
    const [status, setStatus] = useState('STARTING SESSION...');
    const [isSaved, setIsSaved] = useState(false);

    // useRef so finalizeNotes always sees the latest notes list (avoids stale closure)
    const notesRef = useRef([]);
    const flowStarted = useRef(false);

    // Keep ref in sync with state
    const addNote = (text) => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `${timestamp}: ${text}`;
        notesRef.current = [...notesRef.current, entry];
        setNotes([...notesRef.current]);
        return entry;
    };

    useEffect(() => {
        if (!flowStarted.current) {
            flowStarted.current = true;
            startNotesFlow();
        }
    }, []);

    // ─── Voice Flow ───────────────────────────────────────────────────────────

    const askForMoreNotes = () => {
        setStatus('LISTENING — continue or say "done"');
        speak(
            "Would you like to add another point? Say yes or continue to add more, or say done or no to finish.",
            () => {
                listen((ans) => {
                    const lower = ans.toLowerCase();
                    if (
                        lower.includes('yes') ||
                        lower.includes('add') ||
                        lower.includes('more') ||
                        lower.includes('continue')
                    ) {
                        captureNote();
                    } else {
                        finalizeNotes();
                    }
                });
            }
        );
    };

    const captureNote = () => {
        setStatus('🎤 LISTENING FOR YOUR NOTE...');
        speak("Please tell me your next point.", () => {
            listen((res) => {
                if (!res || !res.trim()) {
                    speak("I didn't catch that. Please try again.", captureNote);
                    return;
                }
                const entry = addNote(res.trim());
                setStatus(`NOTE CAPTURED: ${res.trim()}`);
                speak(`Got it. I noted: ${res}.`, askForMoreNotes);
            });
        });
    };

    const startNotesFlow = () => {
        setStatus('AI INTRO PLAYING...');
        const introText = `Welcome to your study notes for ${topic}. Let's capture what you learned today. Please tell me the first thing you remember from the lesson.`;
        speak(introText, () => {
            setStatus('🎤 LISTENING FOR YOUR FIRST NOTE...');
            listen((res) => {
                if (!res || !res.trim()) {
                    speak("I didn't hear that clearly. Please try again.", startNotesFlow);
                    return;
                }
                addNote(res.trim());
                setStatus(`NOTE CAPTURED: ${res.trim()}`);
                speak(`Great! I noted: ${res}.`, askForMoreNotes);
            });
        });
    };

    const finalizeNotes = async () => {
        const currentNotes = notesRef.current; // always fresh
        const count = currentNotes.length;
        const summaryText =
            count > 0
                ? `Perfect! I have saved ${count} point${count !== 1 ? 's' : ''} for ${topic}. Great job today!`
                : `No notes were captured for ${topic}. You can try again anytime.`;

        setStatus(count > 0 ? `✅ ${count} NOTE${count !== 1 ? 'S' : ''} SAVED` : 'NO NOTES CAPTURED');
        speak(summaryText);

        // Persist to backend if we have notes and a student
        if (count > 0 && student?.studentId) {
            try {
                await saveNotes(student.studentId, {
                    topic,
                    points: currentNotes,
                });
                setIsSaved(true);
            } catch (err) {
                console.error('Failed to save notes to backend:', err);
            }
        } else {
            setIsSaved(count > 0); // Mark saved for display even without backend
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="dashboard-layout fade-in">
            <header className="header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '3rem' }}>STUDY NOTES</h1>
                    <div className="status-badge" style={{ marginTop: '0.5rem' }}>
                        {isSaved ? '✅ SAVED TO PROFILE' : 'AI SESSION ACTIVE'}
                    </div>
                </div>
                <button
                    onClick={() => navigate('/learn')}
                    style={{ alignSelf: 'center' }}
                >
                    ← BACK TO LESSON
                </button>
            </header>

            <main
                className="content-area"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                {/* Voice Orb */}
                <div className="voice-orb-wrapper" style={{ margin: '0 auto 3rem' }}>
                    <div className="orb-ring" />
                    <div className={`voice-orb ${isListening ? 'listening' : ''}`}>
                        <div className="pulse-layer" />
                        <span style={{ fontSize: '4rem', zIndex: 10 }}>
                            {isListening ? '🎤' : '📝'}
                        </span>
                    </div>
                </div>

                {/* Status line */}
                <p style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>
                    {isListening ? '🎤 LISTENING...' : status}
                </p>

                {/* Notes Card */}
                <div className="card" style={{ width: '100%', maxWidth: '900px', padding: '3rem' }}>
                    <h2 style={{ borderBottom: '4px solid black', display: 'inline-block', marginBottom: '2rem', fontSize: '2.2rem' }}>
                        {topic.toUpperCase()}
                    </h2>

                    {notes.length > 0 ? (
                        <div style={{ textAlign: 'left' }}>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: 800 }}>
                                YOUR VOICE NOTES ({notes.length} points):
                            </h3>
                            {notes.map((note, index) => (
                                <div
                                    key={index}
                                    style={{
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        background: '#F9F9F9',
                                        border: '2px solid black',
                                        borderRadius: '4px',
                                    }}
                                >
                                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>
                                        {index + 1}. {note}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#666' }}>
                                READY TO CAPTURE VOICE NOTES...
                            </p>
                            <p style={{ fontSize: '1.1rem', marginTop: '1rem', opacity: 0.8 }}>
                                Speak naturally and I'll record your learning points
                            </p>
                        </div>
                    )}
                </div>

                {/* Manual controls */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {!isSaved && (
                        <>
                            <button onClick={captureNote} disabled={isListening}>
                                🎤 ADD NOTE
                            </button>
                            <button
                                onClick={finalizeNotes}
                                disabled={isListening || notes.length === 0}
                                style={{ background: 'var(--accent-yellow)' }}
                            >
                                ✅ DONE — SAVE NOTES
                            </button>
                        </>
                    )}
                    {isSaved && (
                        <button onClick={() => navigate('/student')} style={{ background: 'black', color: 'white' }}>
                            🏠 BACK TO DASHBOARD
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default NotesPage;
