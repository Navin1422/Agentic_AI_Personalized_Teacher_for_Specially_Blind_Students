import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudent } from '../context/StudentContext';
import { sendMessage, endSession } from '../services/api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import VoiceButton from '../components/VoiceButton';

// ─── Typing indicator ───
const TypingDots = () => (
  <div className="chat-bubble teacher" style={{ display:'inline-flex', alignItems:'center', gap:'0.75rem' }}>
    <span style={{ fontSize:'0.9rem', color:'var(--color-primary)', fontWeight: 600 }}>Akka & Brixbee are thinking</span>
    <div className="typing-indicator" aria-label="AI teacher is typing">
      <span /><span /><span />
    </div>
  </div>
);

// ─── Audio wave when AI is speaking ───
const AudioWave = () => (
  <div className="audio-wave" aria-hidden="true" style={{ height:'24px' }}>
    {[...Array(5)].map((_,i) => <div key={i} className="bar" style={{ height:'80%', background: 'var(--color-primary)' }} />)}
  </div>
);

export default function LearnPage({ onBack }) {
  const { student, selectedClass, selectedSubject, selectedChapter, addMessage, chatHistory } = useStudent();
  const { speak, stop } = useSpeechSynthesis();
  const { isListening, transcript, isSupported, startListening, stopListening, setTranscript } = useSpeechRecognition();

  const [textInput, setTextInput]   = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [learningMode, setLearningMode] = useState(null); // choice | teaching | doubts | assessment
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  const hasGreeted = useRef(null);

  // Greet and ask for mode choice when chapter loads
  useEffect(() => {
    let timer;
    if (selectedChapter && chatHistory.length === 0 && hasGreeted.current !== selectedChapter._id) {
      const greet = `Vanakkam ${student?.name || 'dear'}! We are in Chapter ${selectedChapter.chapterNumber}: "${selectedChapter.title}". 
      I am Akka, and Brixbee is here too! 
      How would you like to learn today? 
      Would you like me to "Teach you concepts", "Clear your doubts", or "Take a practice test"?`;
      
      addMessage('teacher', greet);
      speak(greet, { rate: 0.9 });
      setLastResponse(greet);
      setLearningMode('choice');
      hasGreeted.current = selectedChapter._id;
      timer = setTimeout(startListening, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
      stop(); 
    };
  }, [selectedChapter]);

  // Handle transcript after voice stops
  useEffect(() => {
    if (!transcript || isListening) return;
    const text = transcript.trim().toLowerCase();
    if (!text) return;

    // Handle initial choice mode via voice
    if (learningMode === 'choice') {
      if (text.includes('teach') || text.includes('concept') || text.includes('learn')) {
        handleModeSelect('teaching');
        setTranscript('');
        return;
      }
      if (text.includes('doubt') || text.includes('clear') || text.includes('question')) {
        handleModeSelect('doubts');
        setTranscript('');
        return;
      }
      if (text.includes('test') || text.includes('practice') || text.includes('assessment')) {
        handleModeSelect('assessment');
        setTranscript('');
        return;
      }
    }

    // Standard navigation / repeat commands
    if (/^repeat( that)?$/i.test(text)) {
      if (lastResponse) speak(lastResponse, { rate: 0.88 });
      setTranscript('');
      return;
    }
    if (/^(go )?home$/i.test(text) || /^dashboard$/i.test(text)) {
      onBack();
      return;
    }

    // Process as normal message
    setTranscript('');
    handleSend(text);
  }, [transcript, isListening, learningMode]);

  const handleModeSelect = (mode) => {
    setLearningMode(mode);
    const modeMsgs = {
      teaching: "Wonderful! I will teach you the concepts. Let me tell you the subtopics we have in this lesson from my database.",
      doubts: "Sure! I am here to clear any doubts. What is confusing you in this lesson?",
      assessment: "Great! Let's see how much you have learned. I will ask you some questions one by one. Are you ready?"
    };
    const msg = modeMsgs[mode];
    addMessage('teacher', msg);
    speak(msg, { rate: 0.9 });
    
    // Explicit instructions to prime the AI
    const instructionMsgs = {
      teaching: `I have chosen to learn concepts. Please list all subtopics from the Key Points of this lesson and ask me which one I want to learn first.`,
      doubts: `I want to clear my doubts. Please ask me what specifically I am confused about in this lesson.`,
      assessment: `I want to take a practice test. Please start the assessment by asking the first question.`
    };
    handleSend(instructionMsgs[mode]);
  };

  const handleSend = useCallback(async (text) => {
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
    stop(); 

    try {
      const payload = {
        studentId:          student?.studentId,
        message:            msg,
        classLevel:         selectedClass,
        subject:            selectedSubject,
        chapterNumber:      selectedChapter?.chapterNumber,
        learningMode:       learningMode, // Added mode to payload
        conversationHistory: chatHistory.slice(-14), 
      };
      const res = await sendMessage(payload);
      const reply = res.data.response;

      addMessage('teacher', reply);
      setLastResponse(reply);
      setIsThinking(false);

      setIsSpeaking(true);
      const utt = speak(reply, { rate: 0.88 });
      if (utt) {
        utt.onend = () => {
          setIsSpeaking(false);
          startListening(); 
        };
        utt.onerror = () => setIsSpeaking(false);
      } else {
        setTimeout(() => setIsSpeaking(false), 3000);
      }
    } catch (err) {
      console.error(err);
      const errMsg = 'Oops! I had a small problem. Please check your connection and try again!';
      addMessage('teacher', errMsg);
      setIsThinking(false);
      speak(errMsg, { rate: 0.9 });
    }
  }, [textInput, isThinking, student, selectedClass, selectedSubject, selectedChapter, learningMode, chatHistory]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
    speak("Great class today! You did very well! See you next time!", { rate: 0.9 });
    setTimeout(onBack, 2000);
  };

  return (
    <div style={styles.page}>
      <div className="premium-bg" />
      
      {/* ─── Global Header ─── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button className="btn btn-ghost" style={styles.backBtn} onClick={handleEndSession} aria-label="Go back">
            ← Exit
          </button>
          <div style={styles.headerDivider} />
          <div style={styles.lessonMeta}>
            <span className="badge badge-blue">Class {selectedClass}</span>
            <span className="badge badge-gold">{selectedSubject}</span>
          </div>
        </div>

        <div style={styles.headerCenter}>
          <div style={styles.akkaBrand}>
            <img src="/brixbee.png" alt="Brixbee" style={styles.headerAvatar} />
            <span style={styles.akkaTitle}>Learning with Akka & Brixbee</span>
          </div>
          {isSpeaking && <AudioWave />}
        </div>

        <div style={styles.headerRight}>
          {student && (
            <div style={styles.studentChip}>
              <span>👤</span>
              <span style={{ fontWeight: 700 }}>{student.name}</span>
            </div>
          )}
        </div>
      </header>

      <div style={styles.mainContainer}>
        {/* ─── Left: Lesson Content ─── */}
        <aside style={styles.contentSection} aria-label="Lesson Materials">
          {selectedChapter ? (
            <>
              <div style={styles.contentTitleArea} className="animate-fadeInUp">
                <h1 style={styles.mainTitle}>{selectedChapter.title}</h1>
                <p style={styles.chapterTag}>Chapter {selectedChapter.chapterNumber}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" style={styles.readBtn} onClick={() => speak(selectedChapter.content, { rate: 0.85 })}>
                    <span>🔊</span> Listen to Lesson
                  </button>
                  <button className="btn btn-primary" style={{ ...styles.readBtn, background: '#1B4D2D', border: '1px solid #2ECC71' }} onClick={() => window.open(`/api/content/pdf/${selectedClass}/${selectedSubject}`, '_blank')}>
                    <span>📄</span> View PDF
                  </button>
                </div>
              </div>

              <div style={styles.scrollContent}>
                <div className="animate-fadeInUp" style={{ ...styles.glassCard, animationDelay: '0.1s' }}>
                  <p style={styles.summaryText}>{selectedChapter.content}</p>
                </div>

                {selectedChapter.keyPoints?.length > 0 && (
                  <div className="animate-fadeInUp" style={{ ...styles.contentGroup, animationDelay: '0.2s' }}>
                    <h3 style={styles.groupTitle}>⭐ Key Takeaways</h3>
                    <div style={styles.keyPointsGrid}>
                      {selectedChapter.keyPoints.map((kp, i) => (
                        <div key={i} style={styles.kpItem}>
                          <span style={styles.kpDot}>•</span> {kp}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedChapter.vocabulary?.length > 0 && (
                  <div className="animate-fadeInUp" style={{ ...styles.contentGroup, animationDelay: '0.3s' }}>
                    <h3 style={styles.groupTitle}>📚 Vocabulary</h3>
                    <div style={styles.vocabGrid}>
                      {selectedChapter.vocabulary.map((v, i) => (
                        <div key={i} style={styles.vocabCard}>
                          <strong style={styles.vocabWord}>{v.word}</strong>
                          <span style={styles.vocabMean}>{v.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.emptyContent}>
              <span>📖</span>
              <p>Select a chapter to begin</p>
            </div>
          )}
        </aside>

        {/* ─── Right: Chat Conversation ─── */}
        <main style={styles.chatSection}>
          <div style={styles.chatHeader}>
            <span>💬 AI Live Assistant</span>
            <div style={styles.statusDot} />
          </div>

          <div style={styles.chatMessages} role="log" aria-live="polite">
            {learningMode === 'choice' && (
              <div style={styles.modeChoiceContainer} className="animate-fadeInUp">
                <img src="/brixbee.png" alt="Brixbee" style={{ width: '100px', marginBottom: '1rem' }} />
                <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>How shall we learn today?</h2>
                <div style={styles.modeGrid}>
                  <button className="select-card" onClick={() => handleModeSelect('teaching')} style={styles.modeBtn}>
                    <span style={{ fontSize: '2rem' }}>👩‍🏫</span>
                    <strong style={{ display: 'block', marginTop: '0.5rem' }}>Teach Concepts</strong>
                    <small style={{ color: 'var(--color-text-soft)' }}>I will explain the lesson step-by-step</small>
                  </button>
                  <button className="select-card" onClick={() => handleModeSelect('doubts')} style={styles.modeBtn}>
                    <span style={{ fontSize: '2rem' }}>🤔</span>
                    <strong style={{ display: 'block', marginTop: '0.5rem' }}>Clear Doubts</strong>
                    <small style={{ color: 'var(--color-text-soft)' }}>Ask me anything you don't understand</small>
                  </button>
                  <button className="select-card" onClick={() => handleModeSelect('assessment')} style={styles.modeBtn}>
                    <span style={{ fontSize: '2rem' }}>📝</span>
                    <strong style={{ display: 'block', marginTop: '0.5rem' }}>Practice Test</strong>
                    <small style={{ color: 'var(--color-text-soft)' }}>I will quiz you to check your score</small>
                  </button>
                </div>
              </div>
            )}

            {learningMode === 'teaching' && selectedChapter?.keyPoints && (
              <div style={styles.subtopicsBar} className="animate-fadeIn">
                <div style={styles.subtopicsTitle}>📋 LESSON SUBTOPICS FROM DATABASE:</div>
                <div style={styles.subtopicsList}>
                  {selectedChapter.keyPoints.map((point, idx) => (
                    <span key={idx} style={styles.subtopicItem}>{point}</span>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.length === 0 && learningMode !== 'choice' && !isThinking && (
              <div style={styles.emptyChat} className="animate-fadeInUp">
                <img src="/brixbee.png" alt="Brixbee" style={{ width: '120px', marginBottom: '1.5rem' }} />
                <h2>Ask Akka Anything!</h2>
                <p>Brixbee and I are here to help you study. Just speak or type your question.</p>
              </div>
            )}

            {chatHistory.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'student' ? 'flex-end' : 'flex-start',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{
                  ...styles.chatLabel,
                  textAlign: msg.role === 'student' ? 'right' : 'left'
                }}>
                  {msg.role === 'teacher' ? 'Akka (with Brixbee)' : 'You'}
                </div>
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isThinking && <TypingDots />}
            <div ref={chatEndRef} />
          </div>

          {/* ─── Input Bar ─── */}
          <footer style={styles.inputArea}>
            <div style={styles.inputShadow} />
            
            <div style={styles.contextBar}>
              {isListening ? (
                <div style={styles.listeningStatus}>
                  <div className="audio-wave small">
                    <div className="bar" style={{height:'80%'}}/><div className="bar" style={{height:'100%'}}/><div className="bar" style={{height:'60%'}}/>
                  </div>
                  <span>{transcript || 'Brixbee is listening...'}</span>
                </div>
              ) : (
                <div style={styles.hints}>
                  {['"Explain this"', '"Quiz me"', '"Repeat that"', '"Go back"'].map(h => (
                    <button key={h} className="smallHint" style={styles.smallHint} onClick={() => setTextInput(h.replace(/"/g, ''))}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.inputRow}>
              <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} size="md" />
              <div style={styles.fieldWrap}>
                <input
                  ref={inputRef}
                  className="input-field"
                  placeholder="Talk to Akka & Brixbee..."
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isThinking || isListening}
                />
                <button
                  style={styles.sendIconBtn}
                  onClick={() => handleSend()}
                  disabled={!textInput.trim() || isThinking}
                  aria-label="Send message"
                >
                  ➤
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: { 
    display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', 
    background:'#050505', position: 'relative'
  },
  header: {
    height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(30px)',
    borderBottom: '1px solid var(--color-border)', zIndex: 100, flexShrink: 0
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  headerDivider: { width: '1px', height: '30px', background: 'var(--color-border)' },
  backBtn: { padding: '0.6rem 1.2rem', fontSize: '0.95rem', borderRadius: 'var(--radius-sm)' },
  lessonMeta: { display: 'flex', gap: '0.75rem' },
  
  headerCenter: { display: 'flex', alignItems: 'center', gap: '2rem' },
  akkaBrand: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  headerAvatar: { width: '45px', height: '45px', borderRadius: '50%', border: '1.5px solid var(--color-primary)', boxShadow: 'var(--shadow-glow-gold)' },
  akkaTitle: { fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' },
  
  headerRight: { width: '180px', display: 'flex', justifyContent: 'flex-end' },
  studentChip: { background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid var(--color-border)' },

  mainContainer: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 },
  
  contentSection: { 
    width: '460px', background: 'rgba(255, 255, 255, 0.02)', borderRight: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', backdropFilter: 'blur(10px)'
  },
  contentTitleArea: { padding: '2rem', flexShrink: 0, borderBottom: '1px solid var(--color-border)' },
  mainTitle: { fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.2 },
  chapterTag: { fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' },
  readBtn: { width: '100%', gap: '0.5rem', justifyContent: 'center', fontWeight: 800, boxShadow: 'var(--shadow-glow-gold)' },
  scrollContent: { flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' },
  glassCard: { background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)' },
  summaryText: { margin: 0, fontSize: '1.15rem', lineHeight: 1.8, color: '#F5F5F7', fontWeight: 400 },
  
  contentGroup: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  groupTitle: { fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  keyPointsGrid: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  kpItem: { display: 'flex', gap: '1rem', fontSize: '1.1rem', color: 'var(--color-text-soft)', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)' },
  kpDot: { color: 'var(--color-primary)', fontWeight: 900 },
  
  vocabGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' },
  vocabCard: { background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  vocabWord: { color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 800 },
  vocabMean: { fontSize: '0.95rem', color: 'var(--color-text-soft)' },
  emptyContent: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: '1rem' },

  chatSection: { flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative' },
  chatHeader: { padding: '1.2rem 2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', color: 'var(--color-text-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
  statusDot: { width: '10px', height: '10px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 15px var(--color-success)' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column' },
  modeChoiceContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  modeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '700px' },
  modeBtn: { display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem', height: 'auto', textAlign: 'center' },
  subtopicsBar: { background: 'rgba(212, 175, 55, 0.05)', borderLeft: '3px solid var(--color-primary)', padding: '1.2rem', marginBottom: '2rem', borderRadius: '0 12px 12px 0' },
  subtopicsTitle: { fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 800, marginBottom: '0.8rem', letterSpacing: '0.05em' },
  subtopicsList: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  subtopicItem: { background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
  chatLabel: { fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  
  emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem' },

  inputArea: { padding: '2rem', background: 'linear-gradient(to top, #050505 85%, transparent)', position: 'relative' },
  inputShadow: { position: 'absolute', top: '-60px', left: 0, right: 0, height: '60px', background: 'linear-gradient(to top, #050505, transparent)', pointerEvents: 'none' },
  contextBar: { marginBottom: '1.2rem', minHeight: '40px' },
  hints: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  smallHint: { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '6px 16px', fontSize: '0.9rem', color: 'var(--color-text-soft)', cursor: 'pointer', transition: '0.3s' },
  listeningStatus: { display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 700 },
  
  inputRow: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  fieldWrap: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  sendIconBtn: { position: 'absolute', right: '10px', padding: '0.7rem 1.2rem', background: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-full)', color: '#000', cursor: 'pointer', fontWeight: 800 }
};

