import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudent } from '../context/StudentContext';
import { sendMessage, endSession } from '../services/api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import VoiceButton from '../components/VoiceButton';

// ─── Typing indicator ───
const TypingDots = () => (
  <div className="chat-bubble teacher" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem' }}>
    <span style={{ fontSize:'0.85rem', color:'var(--color-text-soft)' }}>Akka is thinking</span>
    <div className="typing-indicator" aria-label="AI teacher is typing">
      <span /><span /><span />
    </div>
  </div>
);

// ─── Audio wave when AI is speaking ───
const AudioWave = () => (
  <div className="audio-wave" aria-hidden="true" style={{ height:'20px' }}>
    {[...Array(5)].map((_,i) => <div key={i} className="bar" style={{ height:'60%' }} />)}
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
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  // Greet when chapter loads
  useEffect(() => {
    if (selectedChapter && chatHistory.length === 0) {
      const greet = student?.weakTopics?.length
        ? `Hello ${student?.name || 'dear'}! We are starting Chapter ${selectedChapter.chapterNumber}: "${selectedChapter.title}". By the way, last time you had some difficulty with ${student.weakTopics[student.weakTopics.length - 1]}. Shall we also revise that later? Now let us begin! What would you like to know?`
        : `Hello ${student?.name || 'dear'}! Welcome to Chapter ${selectedChapter.chapterNumber}: "${selectedChapter.title}"! I am Akka, your teacher. You can ask me anything about this chapter. What would you like to know?`;
      addMessage('teacher', greet);
      speak(greet, { rate: 0.88 });
      setLastResponse(greet);
    }
  }, [selectedChapter]);

  // Handle transcript after voice stops
  useEffect(() => {
    if (!transcript || isListening) return;
    const text = transcript.trim();
    if (!text) return;

    // Check special voice commands
    if (/^repeat( that)?$/i.test(text)) {
      if (lastResponse) speak(lastResponse, { rate: 0.88 });
      setTranscript('');
      return;
    }
    if (/^(go )?home$/i.test(text) || /^dashboard$/i.test(text)) {
      onBack();
      return;
    }
    // Submit text as message
    setTranscript('');
    handleSend(text);
  }, [transcript, isListening]);

  const handleSend = useCallback(async (text) => {
    const msg = (text || textInput).trim();
    if (!msg || isThinking) return;
    setTextInput('');

    addMessage('student', msg);
    setIsThinking(true);
    stop(); // Stop any current speech

    try {
      const payload = {
        studentId:          student?.studentId,
        message:            msg,
        classLevel:         selectedClass,
        subject:            selectedSubject,
        chapterNumber:      selectedChapter?.chapterNumber,
        conversationHistory: chatHistory.slice(-14), // last 7 exchanges for context
      };
      const res = await sendMessage(payload);
      const reply = res.data.response;

      addMessage('teacher', reply);
      setLastResponse(reply);
      setIsThinking(false);

      // Speak AI response
      setIsSpeaking(true);
      const utt = speak(reply, { rate: 0.88 });
      if (utt) {
        utt.onend = () => {
          setIsSpeaking(false);
          startListening(); // Enable auto-listening for blind students
        };
        utt.onerror = () => setIsSpeaking(false);
      } else {
        setTimeout(() => setIsSpeaking(false), 3000);
      }
    } catch (err) {
      console.error(err);
      const errMsg = 'Oops! I had a small problem. Please make sure the backend is running and your API key is set, then try again!';
      addMessage('teacher', errMsg);
      setIsThinking(false);
      speak(errMsg, { rate: 0.9 });
    }
  }, [textInput, isThinking, student, selectedClass, selectedSubject, selectedChapter]);

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
      {/* ─── Global Header ─── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button className="btn btn-ghost" style={styles.backBtn} onClick={handleEndSession} aria-label="Go back">
            ← Exit
          </button>
          <div style={styles.headerDivider} />
          <div style={styles.lessonMeta}>
            <span style={styles.clBadge}>Class {selectedClass}</span>
            <span style={styles.subBadge}>{selectedSubject}</span>
          </div>
        </div>

        <div style={styles.headerCenter}>
          <div style={styles.akkaBrand}>
            <span style={styles.akkaIcon}>👩‍🏫</span>
            <span style={styles.akkaTitle}>Akka AI Teacher</span>
          </div>
          {isSpeaking && <AudioWave />}
        </div>

        <div style={styles.headerRight}>
          {student && (
            <div style={styles.studentChip}>
              <span>👤</span>
              <span style={{ fontWeight: 600 }}>{student.name}</span>
            </div>
          )}
        </div>
      </header>

      <div style={styles.mainContainer}>
        {/* ─── Left: Lesson Content ─── */}
        <aside style={styles.contentSection} aria-label="Lesson Materials">
          {selectedChapter ? (
            <>
              <div style={styles.contentTitleArea}>
                <h1 style={styles.mainTitle}>{selectedChapter.title}</h1>
                <p style={styles.chapterTag}>Chapter {selectedChapter.chapterNumber}</p>
                <button className="btn btn-primary" style={styles.readBtn} onClick={() => speak(selectedChapter.content, { rate: 0.85 })}>
                  <span>🔊</span> Listen to Lesson
                </button>
              </div>

              <div style={styles.scrollContent}>
                <div style={styles.glassCard}>
                  <p style={styles.summaryText}>{selectedChapter.content}</p>
                </div>

                {selectedChapter.keyPoints?.length > 0 && (
                  <div style={styles.contentGroup}>
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
                  <div style={styles.contentGroup}>
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
            <span>💬 Live Discussion</span>
            <div style={styles.statusDot} />
          </div>

          <div style={styles.chatMessages} role="log" aria-live="polite">
            {chatHistory.length === 0 && !isThinking && (
              <div style={styles.emptyChat}>
                <div style={styles.akkaAvatarLarge}>👩‍🏫</div>
                <h2>Ask Akka!</h2>
                <p>I'm here to help you understand this lesson. What should we talk about?</p>
              </div>
            )}

            {chatHistory.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'student' ? 'flex-end' : 'flex-start',
                  marginBottom: '1.2rem'
                }}
              >
                <div style={{
                  ...styles.chatLabel,
                  textAlign: msg.role === 'student' ? 'right' : 'left'
                }}>
                  {msg.role === 'teacher' ? 'Akka' : 'You'}
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
            
            {/* Context bar / Transcript */}
            <div style={styles.contextBar}>
              {isListening ? (
                <div style={styles.listeningStatus}>
                  <div className="audio-wave small">
                    <div className="bar" /><div className="bar" /><div className="bar" />
                  </div>
                  <span>{transcript || 'Listening to your voice...'}</span>
                </div>
              ) : (
                <div style={styles.hints}>
                  {['"Explain this"', '"Quiz me"', '"Repeat"'].map(h => (
                    <button key={h} style={styles.smallHint} onClick={() => setTextInput(h.replace(/"/g, ''))}>
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
                  placeholder="Ask a question..."
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
    background:'radial-gradient(circle at top right, #1a2236 0%, #0d1117 100%)' 
  },
  header: {
    height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--color-border)', zIndex: 100, flexShrink: 0
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  headerDivider: { width: '1px', height: '24px', background: 'var(--color-border)' },
  backBtn: { padding: '0.4rem 1rem', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)' },
  lessonMeta: { display: 'flex', gap: '0.5rem' },
  clBadge: { background: 'rgba(79, 142, 247, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(79, 142, 247, 0.2)' },
  subBadge: { background: 'rgba(247, 201, 79, 0.1)', color: 'var(--color-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(247, 201, 79, 0.2)', textTransform: 'capitalize' },
  
  headerCenter: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  akkaBrand: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  akkaIcon: { fontSize: '1.5rem' },
  akkaTitle: { fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px', background: 'linear-gradient(to right, #fff, #99a)' , WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  
  headerRight: { width: '150px', display: 'flex', justifyContent: 'flex-end' },
  studentChip: { background: 'var(--color-surface-2)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--color-border)' },

  mainContainer: { flex: 1, display: 'flex', overflow: 'hidden' },
  
  // Content Aside
  contentSection: { 
    width: '420px', background: 'rgba(22, 27, 34, 0.3)', borderRight: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  contentTitleArea: { padding: '1.5rem', flexShrink: 0, borderBottom: '1px solid var(--color-border)' },
  mainTitle: { fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem', lineHeight: 1.2 },
  chapterTag: { fontSize: '0.85rem', color: 'var(--color-text-soft)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' },
  readBtn: { width: '100%', gap: '0.5rem', justifyContent: 'center', fontWeight: 700 },
  scrollContent: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' },
  glassCard: { background: 'rgba(255, 255, 255, 0.03)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' },
  summaryText: { margin: 0, fontSize: '1.05rem', lineHeight: 1.7, color: '#d0d7de' },
  
  contentGroup: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  groupTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  keyPointsGrid: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  kpItem: { display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--color-text-soft)', lineHeight: 1.4 },
  kpDot: { color: 'var(--color-primary)', fontWeight: 900 },
  
  vocabGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' },
  vocabCard: { background: 'var(--color-surface-2)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  vocabWord: { color: 'var(--color-secondary)', fontSize: '0.95rem' },
  vocabMean: { fontSize: '0.85rem', color: 'var(--color-text-soft)' },
  emptyContent: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: '1rem' },

  // Chat Main
  chatSection: { flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative' },
  chatHeader: { padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--color-text-soft)', fontWeight: 600 },
  statusDot: { width: '8px', height: '8px', background: '#238636', borderRadius: '50%', boxShadow: '0 0 8px #238636' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' },
  chatLabel: { fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' },
  akkaAvatarLarge: { fontSize: '4rem', marginBottom: '1rem' },

  inputArea: { padding: '1.5rem', background: 'linear-gradient(to top, #0d1117 80%, transparent)', position: 'relative' },
  inputShadow: { position: 'absolute', top: '-40px', left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, #0d1117, transparent)', pointerEvents: 'none' },
  contextBar: { marginBottom: '0.8rem', minHeight: '32px' },
  hints: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  smallHint: { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.75rem', color: 'var(--color-text-soft)', cursor: 'pointer', transition: '0.2s' },
  listeningStatus: { display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600 },
  
  inputRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  fieldWrap: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  sendIconBtn: { position: 'absolute', right: '8px', padding: '0.5rem 0.8rem', background: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-full)', color: '#fff', cursor: 'pointer' }
};
