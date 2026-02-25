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
        utt.onend = () => setIsSpeaking(false);
        utt.onerror = () => setIsSpeaking(false);
      } else {
        setTimeout(() => setIsSpeaking(false), 2000);
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

      {/* ─── Header ─── */}
      <header style={styles.header}>
        <button className="btn btn-ghost" style={{ padding:'0.5rem 1rem', fontSize:'0.9rem' }}
          onClick={handleEndSession} aria-label="Go back to lesson dashboard">
          ← Back
        </button>
        <div style={styles.headerCenter}>
          <span style={styles.akkaAvatar} aria-hidden="true">👩‍🏫</span>
          <div>
            <div style={styles.akkaName}>Akka — AI Teacher</div>
            {selectedChapter && (
              <div style={styles.chapterInfo} aria-label={`Chapter ${selectedChapter.chapterNumber}: ${selectedChapter.title}`}>
                Ch {selectedChapter.chapterNumber}: {selectedChapter.title}
              </div>
            )}
          </div>
          {isSpeaking && <AudioWave />}
        </div>
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {selectedClass  && <span className="badge badge-blue"  aria-label={`Class ${selectedClass}`}>Cl {selectedClass}</span>}
          {selectedSubject && <span className="badge badge-gold" aria-label={`Subject: ${selectedSubject}`} style={{ textTransform:'capitalize' }}>{selectedSubject}</span>}
        </div>
      </header>

      {/* ─── Chat area ─── */}
      <div
        style={styles.chatArea}
        role="log"
        aria-label="Conversation with AI teacher"
        aria-live="polite"
        aria-atomic="false"
      >
        {chatHistory.length === 0 && !isThinking && (
          <div style={styles.emptyState}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>👩‍🏫</div>
            <p style={{ color:'var(--color-text-soft)' }}>Ask Akka anything about your lesson!</p>
          </div>
        )}

        {chatHistory.map(msg => (
          <div
            key={msg.id}
            style={{ display:'flex', flexDirection:'column', alignItems: msg.role === 'student' ? 'flex-end' : 'flex-start' }}
          >
            {msg.role === 'teacher' && (
              <div style={styles.roleLabel} aria-hidden="true">👩‍🏫 Akka</div>
            )}
            {msg.role === 'student' && (
              <div style={{ ...styles.roleLabel, textAlign:'right' }} aria-hidden="true">You 👤</div>
            )}
            <div
              className={`chat-bubble ${msg.role}`}
              role={msg.role === 'teacher' ? 'article' : 'note'}
              aria-label={`${msg.role === 'teacher' ? 'Akka says' : 'You said'}: ${msg.text}`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isThinking && <TypingDots />}
        <div ref={chatEndRef} />
      </div>

      {/* ─── Voice Commands hint ─── */}
      <div style={styles.hintBar} aria-label="Voice command examples">
        <span style={{ color:'var(--color-text-muted)', fontSize:'0.8rem' }}>💬 Try saying: </span>
        {['"Explain photosynthesis"', '"Give me 5 questions"', '"Repeat that"', '"I don\'t understand"'].map(h => (
          <span key={h} style={styles.hint}>{h}</span>
        ))}
      </div>

      {/* ─── Input area ─── */}
      <div style={styles.inputArea} role="form" aria-label="Send a message to Akka">
        {/* Mic transcript display */}
        {isListening && (
          <div style={styles.transcriptBar} aria-live="polite" aria-label="Listening for your voice">
            <span style={{ color:'var(--color-primary)' }}>🎙️</span>
            <span style={{ flex:1, color:'var(--color-text-soft)' }}>
              {transcript || 'Listening... speak now!'}
            </span>
          </div>
        )}

        <div style={styles.inputRow}>
          <VoiceButton
            isListening={isListening}
            onStart={startListening}
            onStop={stopListening}
            size="md"
          />
          <input
            ref={inputRef}
            className="input-field"
            type="text"
            placeholder={isSupported ? "Type or use mic to speak…" : "Type your question…"}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking || isListening}
            aria-label="Type your question to Akka"
            style={{ flex:1, borderRadius:'var(--radius-full)' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={!textInput.trim() || isThinking}
            aria-label="Send message"
            style={{ padding:'0.7rem 1.4rem', whiteSpace:'nowrap' }}
          >
            Send ➤
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden', background:'var(--color-bg)' },
  header: {
    display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem',
    padding:'0.8rem 1.2rem', borderBottom:'1px solid var(--color-border)',
    background:'rgba(13,17,23,0.95)', backdropFilter:'blur(12px)', flexShrink:0, flexWrap:'wrap',
  },
  headerCenter: { display:'flex', alignItems:'center', gap:'0.75rem', flex:1, justifyContent:'center' },
  akkaAvatar: { fontSize:'1.8rem', lineHeight:1 },
  akkaName:   { fontWeight:700, color:'var(--color-text)', fontSize:'1rem' },
  chapterInfo:{ fontSize:'0.75rem', color:'var(--color-text-soft)', maxWidth:'220px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  chatArea: {
    flex:1, overflowY:'auto', padding:'1.5rem 1rem',
    display:'flex', flexDirection:'column', gap:'1rem',
  },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, opacity:0.6 },
  roleLabel:  { fontSize:'0.75rem', color:'var(--color-text-muted)', marginBottom:'2px', paddingLeft:'4px' },
  hintBar: {
    padding:'0.5rem 1rem', display:'flex', flexWrap:'wrap', gap:'0.5rem', alignItems:'center',
    borderTop:'1px solid var(--color-border)', background:'var(--color-surface)', flexShrink:0,
  },
  hint: {
    fontSize:'0.75rem', color:'var(--color-text-soft)',
    background:'var(--color-surface-2)', padding:'2px 8px', borderRadius:'var(--radius-full)',
    border:'1px solid var(--color-border)',
  },
  inputArea: {
    padding:'0.75rem 1rem', borderTop:'1px solid var(--color-border)',
    background:'var(--color-surface)', flexShrink:0, display:'flex', flexDirection:'column', gap:'0.5rem',
  },
  transcriptBar: {
    display:'flex', alignItems:'center', gap:'0.5rem',
    background:'rgba(79,142,247,0.08)', borderRadius:'var(--radius-full)',
    padding:'0.4rem 1rem', border:'1px solid rgba(79,142,247,0.3)',
    fontSize:'0.95rem',
  },
  inputRow: { display:'flex', alignItems:'center', gap:'0.75rem' },
};
