import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { VoiceContext } from '../context/VoiceContext';
import { sendMessage, endSession } from '../services/api';
import VoiceButton from '../components/VoiceButton';
import '../styles/index.css';

const LearnPage = () => {
    const navigate = useNavigate();
    const { 
        student, selectedClass, selectedSubject, selectedChapter, 
        addMessage, chatHistory, setChatHistory 
    } = useStudent();
    
    const { 
        speak, listen, isListening, isSpeaking, transcript 
    } = useContext(VoiceContext);

    const [textInput, setTextInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [learningMode, setLearningMode] = useState(null); // choice | teaching | doubts | assessment
    const chatEndRef = useRef(null);
    const hasGreeted = useRef(null);
    const isFirstMessage = useRef(true); // tracks if this is the first API call in this session

    // Auto-scroll to newest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isThinking]);

    // Greet and ask for mode choice when chapter loads
    useEffect(() => {
        if (selectedChapter && chatHistory.length === 0 && hasGreeted.current !== selectedChapter._id) {
            const greet = `Vanakkam ${student?.name || 'dear'}! We are in Chapter ${selectedChapter.chapterNumber}: "${selectedChapter.title}". 
            I am Akka, and Brixbee is here too! 
            How would you like to learn today? 
            Would you like me to "Teach you concepts", "Clear your doubts", or "Take a practice test"?`;
            
            addMessage('teacher', greet);
            speak(greet, () => {
                setLearningMode('choice');
                startVoiceInput();
            });
            hasGreeted.current = selectedChapter._id;
        }
    }, [selectedChapter]);

    const startVoiceInput = () => {
        listen((res) => {
            const text = res.trim().toLowerCase();
            if (!text) return;

            // Handle initial choice mode via voice
            if (learningMode === 'choice') {
                if (text.includes('teach') || text.includes('concept') || text.includes('learn')) {
                    handleModeSelect('teaching');
                    return;
                }
                if (text.includes('doubt') || text.includes('clear') || text.includes('question')) {
                    handleModeSelect('doubts');
                    return;
                }
                if (text.includes('test') || text.includes('practice') || text.includes('assessment')) {
                    handleModeSelect('assessment');
                    return;
                }
            }

            // Standard navigation
            if (/^(go )?home$/i.test(text) || /^dashboard$/i.test(text)) {
                navigate('/student');
                return;
            }

            // Process as normal message
            handleSend(text);
        });
    };

    const handleModeSelect = (mode) => {
        setLearningMode(mode);
        const modeMsgs = {
            teaching: "Wonderful! I will teach you the concepts. Let me tell you the subtopics we have in this lesson from our database.",
            doubts: "Sure! I am here to clear any doubts. What is confusing you in this lesson?",
            assessment: "Great! Let's see how much you have learned. I will ask you some questions one by one. Are you ready?"
        };
        const msg = modeMsgs[mode];
        addMessage('teacher', msg);
        speak(msg, () => {
            // Explicit instructions to prime the AI
            const instructionMsgs = {
                teaching: `I have chosen to learn concepts. Please list all subtopics from the Key Points of this lesson and ask me which one I want to learn first.`,
                doubts: `I want to clear my doubts. Please ask me what specifically I am confused about in this lesson.`,
                assessment: `I want to take a practice test. Please start the assessment by asking the first question.`
            };
            handleSend(instructionMsgs[mode]);
        });
    };

    const handleSend = async (text) => {
        const msg = (text || textInput).trim();
        if (!msg || isThinking) return;
        setTextInput('');

        // Hidden trigger keywords
        const isInstruction = msg.includes("Please list all subtopics") || 
                              msg.includes("Please ask me what specifically") ||
                              msg.includes("Please start the assessment");

        if (!isInstruction) {
            addMessage('student', msg);
        }
        
        setIsThinking(true);

        try {
            const isNewSession = isFirstMessage.current;
            isFirstMessage.current = false; // all subsequent messages are mid-session

            const payload = {
                studentId:          student?.studentId,
                message:            msg,
                classLevel:         selectedClass,
                subject:            selectedSubject,
                chapterNumber:      selectedChapter?.chapterNumber,
                learningMode:       learningMode,
                conversationHistory: chatHistory.slice(-14),
                isNewSession,
            };
            
            const res = await sendMessage(payload);
            const reply = res.data.response;

            addMessage('teacher', reply);
            setIsThinking(false);

            speak(reply, () => {
                // Optional: Auto-start listening after AI speaks
                // startVoiceInput(); 
            });
        } catch (err) {
            console.error(err);
            const errMsg = 'Oops! I had a small problem. Please try again!';
            addMessage('teacher', errMsg);
            setIsThinking(false);
            speak(errMsg);
        }
    };

    const handleEndSession = async () => {
        if (student?.studentId && selectedChapter) {
            try {
                await endSession({
                    studentId: student.studentId,
                    subject: selectedSubject,
                    chapter: selectedChapter.chapterNumber,
                    chapterTitle: selectedChapter.title,
                    summary: `Studied Chapter ${selectedChapter.chapterNumber}: ${selectedChapter.title}`,
                });
            } catch (e) { /* silent */ }
        }
        speak("Great class today! See you next time!", () => navigate('/student'));
    };

    return (
        <div className="learn-page-container fade-in" style={{ 
            display: 'flex', 
            height: '100vh', 
            width: '100vw', 
            overflow: 'hidden',
            backgroundColor: 'white'
        }}>
            {/* Sidebar / Lesson Content (NEO-BRUTALIST STYLE) */}
            <aside style={{ 
                width: '40%', 
                borderRight: '6px solid black', 
                padding: '2rem', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                backgroundColor: 'white'
            }}>
                <button 
                    onClick={handleEndSession}
                    style={{ 
                        alignSelf: 'flex-start', // Use flex-start for column layouts
                        flexShrink: 0,           // Prevent it from being squished
                        marginBottom: '0.5rem',
                        padding: '10px 20px', fontSize: '1rem',
                        background: 'black', color: 'white',
                        border: '3px solid black', cursor: 'pointer',
                        fontWeight: 800
                    }}
                >
                    ← BACK TO HUB
                </button>

                {selectedChapter ? (
                    <>
                        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--accent-yellow)' }}>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{selectedChapter.title}</h2>
                            <div className="status-badge" style={{ backgroundColor: 'black', color: 'white' }}>
                                CHAPTER {selectedChapter.chapterNumber} • {selectedSubject.toUpperCase()}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>📖 LESSON TEXT</h3>
                            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selectedChapter.content}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button style={{ flex: 1 }} onClick={() => speak(selectedChapter.content)}>
                                    🔊 READ ALOUD
                                </button>
                                <button 
                                    style={{ flex: 1, backgroundColor: 'black', color: 'white' }}
                                    onClick={() => window.open(`/api/content/pdf/${selectedClass}/${selectedSubject}`, '_blank')}
                                >
                                    📄 VIEW PDF
                                </button>
                            </div>
                            <button
                                style={{ width: '100%', marginTop: '1rem', background: 'var(--accent-yellow)', fontWeight: 800 }}
                                onClick={() => navigate('/notes', {
                                    state: { topic: `${selectedSubject?.toUpperCase()} — ${selectedChapter?.title}` }
                                })}
                            >
                                📝 TAKE NOTES
                            </button>
                        </div>

                        {selectedChapter.keyPoints?.length > 0 && (
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>⭐ KEY POINTS</h3>
                                <ul style={{ listStyle: 'none' }}>
                                    {selectedChapter.keyPoints.map((kp, i) => (
                                        <li key={i} style={{ 
                                            marginBottom: '0.8rem', 
                                            padding: '8px', 
                                            borderLeft: '4px solid var(--accent-yellow)',
                                            fontWeight: 700 
                                        }}>
                                            {kp}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <h2>NO LESSON SELECTED</h2>
                        <button onClick={() => navigate('/student')}>GO SELECT A SUBJECT</button>
                    </div>
                )}
            </aside>

            {/* Main Chat Area */}
            <main style={{ 
                width: '60%', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: '#f5f5f5',
                position: 'relative'
            }}>
                {/* Chat Header */}
                <header style={{ 
                    padding: '1.5rem 2rem', 
                    borderBottom: '4px solid black', 
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0 }}>AKKA & BRIXBEE ASSISTANT</h3>
                    <div className="status-badge">
                        {isSpeaking ? '📢 SPEAKING' : isListening ? '👂 LISTENING' : isThinking ? '🤔 THINKING' : '🟢 ONLINE'}
                    </div>
                </header>

                {/* Messages */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {learningMode === 'choice' && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <h2>CHOOSE YOUR STUDY MODE</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                <button className="card" onClick={() => handleModeSelect('teaching')} style={{ padding: '1.5rem' }}>
                                    👩‍🏫 TEACH CONCEPTS
                                </button>
                                <button className="card" onClick={() => handleModeSelect('doubts')} style={{ padding: '1.5rem' }}>
                                    🤔 CLEAR DOUBTS
                                </button>
                                <button className="card" onClick={() => handleModeSelect('assessment')} style={{ padding: '1.5rem' }}>
                                    📝 PRACTICE TEST
                                </button>
                            </div>
                        </div>
                    )}

                    {chatHistory.map(msg => (
                        <div key={msg.id} style={{
                            alignSelf: msg.role === 'student' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                        }}>
                            <div style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 800, 
                                marginBottom: '4px',
                                textAlign: msg.role === 'student' ? 'right' : 'left'
                            }}>
                                {msg.role === 'teacher' ? 'AKKA' : 'STUDENT'}
                            </div>
                            <div className="card" style={{ 
                                padding: '1rem 1.5rem', 
                                backgroundColor: msg.role === 'teacher' ? 'var(--accent-yellow)' : 'white',
                                borderRadius: '4px',
                                fontSize: '1.1rem',
                                fontWeight: 600
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="card" style={{ alignSelf: 'flex-start', padding: '0.8rem 1.5rem', fontWeight: 800 }}>
                            Thinking...
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <footer style={{ 
                    padding: '2rem', 
                    borderTop: '4px solid black', 
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem'
                }}>
                    <VoiceButton 
                        isListening={isListening} 
                        onStart={() => startVoiceInput()} 
                        onStop={() => {}} 
                        size="sm" 
                    />
                    
                    <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                        <input 
                            placeholder="Type OR use Brixbee to talk..." 
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            style={{ flex: 1, maxWidth: 'none' }}
                        />
                        <button onClick={() => handleSend()}>SEND ➤</button>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LearnPage;
