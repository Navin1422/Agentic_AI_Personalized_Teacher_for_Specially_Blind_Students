import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import voiceAssistant from '../services/voiceAssistant';
import { getSubjects, getChapters, getChapter } from '../services/api';
import '../styles/index.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        student, setStudent,
        selectedClass, setSelectedClass, 
        selectedSubject, setSelectedSubject, 
        setSelectedChapter,
        setChatHistory,
        loginStudent,
    } = useStudent();
    
    const [status, setStatus] = useState('DASHBOARD: ONLINE');
    const [isListening, setIsListening] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const flowStarted = useRef(false);

    // Helper: extract pure class number like "8" from "Class 8" or "8th" or "8"
    const normalizeClass = (raw = '') => {
        const match = raw.match(/\d+/);
        return match ? match[0] : raw.trim();
    };

    // On mount: either restore from context (localStorage), or register from login data
    useEffect(() => {
        const init = async () => {
            if (student) {
                // Already logged in (restored from localStorage)
                console.log('Student from context:', student);
                setIsReady(true);
                return;
            }

            const locationData = location.state?.studentData;
            if (locationData) {
                try {
                    setStatus('SETTING UP YOUR PROFILE...');
                    const classNormalized = normalizeClass(locationData.class);
                    console.log('Normalized class:', classNormalized, 'from:', locationData.class);
                    // This creates/retrieves the student from MongoDB and stores studentId
                    await loginStudent(locationData.name, classNormalized);
                    setSelectedClass(classNormalized);
                    setIsReady(true);
                } catch (err) {
                    console.error('Student registration failed:', err);
                    setStatus('SETUP FAILED. Please go back and try again.');
                    voiceAssistant.speak('I had trouble setting up your profile. Please try again.');
                }
            } else {
                // No student data at all — send back to intro
                navigate('/');
            }
        };
        init();
    }, []);

    // Start the voice flow only once student is ready in context
    useEffect(() => {
        if (isReady && student && !flowStarted.current) {
            flowStarted.current = true;
            startStudentFlow();
        }
    }, [isReady, student]);

    const startStudentFlow = async () => {
        setStatus('WELCOMING STUDENT...');
        const cls = selectedClass || student.class;
        const greeting = `Welcome ${student.name} from class ${cls}. I am EduVoice AI, your personalized teacher. I am here to help you learn today.`;
        voiceAssistant.speak(greeting, fetchAndAskSubject);
    };

    const fetchAndAskSubject = async () => {
        try {
            setStatus('FETCHING SUBJECTS...');
            const cls = selectedClass || student.class;
            console.log('Fetching subjects for class:', cls);
            const res = await getSubjects(cls);
            console.log('API response:', res.data);
            const subjects = res.data.subjects; // lowercase from backend e.g. ['english', 'maths']
            setAvailableSubjects(subjects);

            if (!subjects || subjects.length === 0) {
                voiceAssistant.speak(`I couldn't find subjects for class ${cls}. Please check with your teacher.`);
                setStatus('NO SUBJECTS FOUND');
                return;
            }

            const displayNames = subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1));
            const subjectsText = `Available subjects for class ${cls} are: ${displayNames.join(', ')}. Which subject would you like to study today?`;
            
            voiceAssistant.speak(subjectsText, async () => {
                setIsListening(true);
                await voiceAssistant.listen(
                    (spokenText) => {
                        setIsListening(false);
                        // Match against lowercase backend names
                        const matched = subjects.find(s => spokenText.toLowerCase().includes(s.toLowerCase()));
                        if (matched) {
                            handleSubjectSelection(matched);
                        } else {
                            voiceAssistant.speak(`I didn't catch that. Please say one of: ${displayNames.join(', ')}.`, fetchAndAskSubject);
                        }
                    },
                    (err) => {
                        setIsListening(false);
                        voiceAssistant.speak("Please say a subject name clearly.", fetchAndAskSubject);
                    }
                );
            });
        } catch (err) {
            console.error('fetchAndAskSubject error:', err);
            voiceAssistant.speak("I had trouble connecting to the server. Please check your internet and try again.");
            setStatus('CONNECTION ERROR');
        }
    };

    const handleSubjectSelection = async (subject) => {
        setSelectedSubject(subject);
        setStatus(`FETCHING CHAPTERS FOR ${subject.toUpperCase()}...`);
        const cls = selectedClass || student.class;
        
        try {
            const res = await getChapters(cls, subject);
            const chapters = res.data.chapters;

            if (!chapters || chapters.length === 0) {
                voiceAssistant.speak(`I couldn't find any chapters for ${subject}. Please try another subject.`, fetchAndAskSubject);
                return;
            }

            setStatus(`${chapters.length} CHAPTERS FOUND`);
            const chaptersText = `In ${subject}, we have ${chapters.length} chapters. The chapters are: ${chapters.map(c => `Chapter ${c.chapterNumber}: ${c.title}`).join('. ')}. Which chapter would you like to start? You can say the chapter number or the chapter name.`;
            
            voiceAssistant.speak(chaptersText, async () => {
                setIsListening(true);
                await voiceAssistant.listen(
                    async (spokenText) => {
                        setIsListening(false);
                        const lower = spokenText.toLowerCase();

                        // Map word numbers to digits for STT engines that spell out numbers
                        const wordToNum = {
                            'one': 1, 'first': 1,
                            'two': 2, 'second': 2,
                            'three': 3, 'third': 3,
                            'four': 4, 'fourth': 4,
                            'five': 5, 'fifth': 5,
                            'six': 6, 'sixth': 6,
                            'seven': 7, 'seventh': 7,
                            'eight': 8, 'eighth': 8,
                            'nine': 9, 'ninth': 9,
                            'ten': 10, 'tenth': 10
                        };

                        // Strategy 1: match by number spoken ("chapter 2", "second", "2", "three")
                        const numMatch = spokenText.match(/\d+/);
                        let chapter = null;

                        if (numMatch) {
                            const chapterNum = parseInt(numMatch[0]);
                            chapter = chapters.find(c => c.chapterNumber === chapterNum);
                        } else {
                            // Check for word numbers
                            for (const [word, num] of Object.entries(wordToNum)) {
                                if (lower.includes(word)) {
                                    chapter = chapters.find(c => c.chapterNumber === num);
                                    if (chapter) break;
                                }
                            }
                        }

                        // Strategy 2: match by chapter title keywords
                        if (!chapter) {
                            chapter = chapters.find(c => {
                                // check if any word of the title appears in spoken text
                                const titleWords = c.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                                return titleWords.some(word => lower.includes(word));
                            });
                        }

                        // Strategy 3 (last resort): first chapter
                        if (!chapter) {
                            chapter = chapters[0];
                            voiceAssistant.speak(
                                `I didn't catch which chapter. Let's start with Chapter ${chapter.chapterNumber}: ${chapter.title}.`,
                                () => launchLesson(chapter, subject)
                            );
                            return;
                        }

                        voiceAssistant.speak(
                            `Great! Let's start Chapter ${chapter.chapterNumber}: ${chapter.title}. I am preparing your lesson now.`,
                            () => launchLesson(chapter, subject)
                        );
                    },
                    (err) => {
                        setIsListening(false);
                        voiceAssistant.speak(`Sorry, I didn't hear you. Let's start with Chapter ${chapters[0].chapterNumber}: ${chapters[0].title}.`, () => launchLesson(chapters[0], subject));
                    }
                );
            });
        } catch (err) {
            console.error('handleSubjectSelection error:', err);
            voiceAssistant.speak("Something went wrong while getting chapters. Please try again.", fetchAndAskSubject);
        }
    };

    const launchLesson = async (chapterSummary, subject) => {
        try {
            setStatus('PREPARING LESSON...');
            const cls = selectedClass || student.class;
            const res = await getChapter(cls, subject, chapterSummary.chapterNumber);
            setSelectedChapter(res.data.chapter);
            setChatHistory([]);
            navigate('/learn');
        } catch (err) {
            console.error('launchLesson error:', err);
            voiceAssistant.speak("I couldn't load the chapter content. Please try again."
            , fetchAndAskSubject);
        }
    };

    // Show loading screen while student profile is being set up in backend
    if (!isReady || !student) {
        return (
            <div className="dashboard-layout fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ textAlign: 'center', padding: '4rem 6rem' }}>
                    <div className="voice-orb" style={{ margin: '0 auto 2rem', animation: 'pulse 1.5s infinite' }}>
                        <span style={{ fontSize: '3rem' }}>⚡</span>
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>CONNECTING TO EDUVOICE...</h2>
                    <div className="status-badge">{status}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout fade-in">
            <header className="header">
                <div>
                    <h1 style={{ fontSize: '2.2rem' }}>STUDENT HUB</h1>
                    <div className="status-badge">{status}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{student.name}</p>
                        <p style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.7 }}>CLASS {student.class || selectedClass}</p>
                    </div>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'black', color: 'var(--accent-yellow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem', fontWeight: 900, border: '3px solid var(--accent-yellow)'
                    }}>
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="content-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="card" style={{ width: '100%', maxWidth: '800px', textAlign: 'center', padding: '5rem' }}>
                    <div className="voice-orb-wrapper" style={{ margin: '0 auto 3rem' }}>
                        <div className="orb-ring"></div>
                        <div className={`voice-orb ${isListening ? 'listening' : ''}`}>
                            <div className="pulse-layer"></div>
                            <span style={{ fontSize: '4rem', zIndex: 10 }}>{isListening ? '👂' : '🗣️'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h2 style={{ fontSize: '2.5rem' }}>NAMASTE, {student.name.toUpperCase()}! 🙏</h2>
                        <p style={{ fontWeight: 700, fontSize: '1.3rem', color: '#444' }}>
                            {status}
                        </p>
                        {availableSubjects.length > 0 && (
                            <>
                                <p style={{ fontWeight: 600, fontSize: '1rem', color: '#666', marginTop: '1rem' }}>SAY THE SUBJECT NAME TO BEGIN:</p>
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                                    {availableSubjects.map(s => (
                                        <button
                                            key={s}
                                            className="status-badge"
                                            style={{ fontSize: '1.1rem', cursor: 'pointer', background: 'var(--accent-yellow)' }}
                                            onClick={() => handleSubjectSelection(s)}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
