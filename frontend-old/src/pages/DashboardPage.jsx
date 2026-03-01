import { useState, useEffect, useRef } from 'react';
import { useStudent } from '../context/StudentContext';
import { getClasses, getSubjects, getChapters } from '../services/api';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import VoiceButton from '../components/VoiceButton';

const subjectIcons = { science:'🔬', maths:'🔢', math:'🔢', social:'🌍', english:'📖', tamil:'🌺', evs:'🌿' };

export default function DashboardPage({ onStartLesson }) {
  const { student, selectedClass, setSelectedClass, selectedSubject, setSelectedSubject, setSelectedChapter, setChatHistory } = useStudent();
  const { speak } = useSpeechSynthesis();
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();

  const [classes, setClasses]   = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [step, setStep]         = useState('class');

  const hasSpokenInitial = useRef(false);

  // Load available classes
  useEffect(() => {
    getClasses().then(res => setClasses(res.data.classes)).catch(console.error);
    
    // Only speak the "Welcome Back" if we aren't immediately jumping to a deeper step
    setTimeout(() => {
      if (!hasSpokenInitial.current && !selectedClass) {
        const greeting = student
          ? `Welcome back ${student.name}! Please choose a subject to start learning!`
          : `Welcome! Please choose your class first.`;
        speak(greeting, { rate: 0.9 });
        hasSpokenInitial.current = true;
      }
    }, 500);
  }, []);

  // Load subjects when class is selected
  useEffect(() => {
    if (!selectedClass) return;
    setStep('subject');
    getSubjects(selectedClass).then(res => {
      setSubjects(res.data.subjects);
      // Only speak if we haven't spoken yet (initial load jump) and NOT jumping to chapters
      if (!hasSpokenInitial.current && !selectedSubject) {
        speak(`You are in Class ${selectedClass}. Which subject shall we study today?`, { rate: 0.9 });
        hasSpokenInitial.current = true;
      }
    });
  }, [selectedClass]);

  // Load chapters when subject is selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;
    setStep('chapter');
    getChapters(selectedClass, selectedSubject).then(res => {
      setChapters(res.data.chapters);
      // The deepest step always speaks on initial load if not already spoken
      if (!hasSpokenInitial.current) {
        speak(`${selectedSubject} for Class ${selectedClass}. Choose a chapter!`, { rate: 0.9 });
        hasSpokenInitial.current = true;
      }
    });
  }, [selectedSubject]);

  // Voice command parser
  useEffect(() => {
    if (!transcript || isListening) return;
    const t = transcript.trim().toLowerCase();
    setTranscript('');

    // 1. Navigation Commands
    if (t.includes('back') || t.includes('previous')) {
      if (step === 'chapter') { 
        setSelectedSubject(''); setStep('subject'); 
        speak("Going back to subjects. Which one would you like?"); 
        setTimeout(startListening, 3000);
      }
      else if (step === 'subject') { 
        setSelectedClass(''); setStep('class'); 
        speak("Going back to class selection. Which class are you in?"); 
        setTimeout(startListening, 3500);
      }
      return;
    }

    // 2. Selection Commands
    if (step === 'class') {
      const match = t.match(/class\s*(\d+)|(\d+)(th|st|nd|rd)?\s*class|standard\s*(\d+)|(\d+)/);
      if (match) {
        const num = match[1] || match[2] || match[4] || match[5];
        if (num) { setSelectedClass(num); return; }
      }
    }

    if (step === 'subject') {
      const subjectMap = { 
        science:['science', 'signs'], 
        maths:['maths', 'math', 'mathematics'], 
        social:['social', 'social science', 'history', 'geography'], 
        english:['english', 'england'], 
        tamil:['tamil', 'terminal'] 
      };
      for (const [val, keywords] of Object.entries(subjectMap)) {
        if (keywords.some(k => t.includes(k))) {
          setSelectedSubject(val);
          return;
        }
      }
    }

    if (step === 'chapter' && chapters.length) {
      const match = t.match(/chapter\s*(\d+)|(\d+)(st|nd|rd|th)?\s*chapter|lesson\s*(\d+)|(\d+)/);
      if (match) {
        const num = parseInt(match[1] || match[2] || match[4] || match[5]);
        const ch  = chapters.find(c => c.chapterNumber === num);
        if (ch) { handleChapterSelect(ch); return; }
      }
    }

    // Fallback if no command recognized
    speak("I heard " + t + ". Could you please repeat that or say a subject name like Science?", { rate: 0.95 });
    setTimeout(startListening, 4000);
  }, [transcript, isListening, step, chapters]);

  const handleChapterSelect = (ch) => {
    setChatHistory([]); // Clear previous chat history for the new lesson
    setSelectedChapter(ch);
    speak(`Starting Chapter ${ch.chapterNumber}: ${ch.title}. Let us begin!`, { rate: 0.9 });
    setTimeout(() => onStartLesson(), 800);
  };

  const classEmojis = {'1':'🐣','2':'🐥','3':'🌱','4':'🌿','5':'🌻','6':'⭐','7':'🚀','8':'💡','9':'🎓','10':'🏆'};

  return (
    <div style={styles.page}>
      <div className="premium-bg" />
      <div className="mesh-glow" />

      <header style={styles.header}>
        <div style={styles.logo}>
          <img src="/brixbee.png" alt="Brixbee" style={styles.headerAvatar} />
          <span>EduVoice Dashboard</span>
        </div>
        {student && (
          <div style={styles.studentChip} aria-label={`Logged in as ${student.name}, Class ${student.class}`}>
            <span>👤</span>
            <span style={{ fontWeight: 700 }}>{student.name}</span>
            {student.class && <span className="badge badge-gold">Class {student.class}</span>}
          </div>
        )}
      </header>

      <main style={styles.main} role="main" className="animate-fadeInUp">
        {/* Breadcrumb */}
        <nav style={styles.breadcrumb} aria-label="Lesson navigation">
          <span style={step === 'class' ? styles.crumbActive : styles.crumb}>Class Selection</span>
          <span style={styles.crumbSep}>›</span>
          <span style={selectedClass ? (step === 'subject' ? styles.crumbActive : styles.crumb) : styles.crumbMuted}>Subject</span>
          <span style={styles.crumbSep}>›</span>
          <span style={selectedSubject ? (step === 'chapter' ? styles.crumbActive : styles.crumb) : styles.crumbMuted}>Topic</span>
        </nav>

        {/* Voice command area */}
        <div style={styles.voiceRow}>
          <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} size="md" />
          <div style={styles.voiceText} aria-live="polite">
            {isListening
              ? <span style={{ color:'var(--color-primary)', fontWeight: 700 }}>Brixbee is listening...</span>
              : transcript
                ? <span style={{ color:'var(--color-text-soft)' }}>Heard: "{transcript}"</span>
                : <span style={{ color:'var(--color-text-muted)' }}>Tap Brixbee or use voice commands</span>
            }
          </div>
        </div>

        {/* Class Selection */}
        {step === 'class' && (
          <section aria-labelledby="class-heading">
            <h2 id="class-heading" style={styles.sectionTitle}>📚 Which class are you in?</h2>
            <div className="select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {(classes.length ? classes : ['5','6']).map(cls => (
                <button key={cls} className={`select-card ${selectedClass === cls ? 'active' : ''}`}
                  onClick={() => setSelectedClass(cls)} aria-label={`Class ${cls}`} aria-pressed={selectedClass === cls}>
                  <span className="icon" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>{classEmojis[cls] || '📖'}</span>
                  <span style={{ fontWeight: 700 }}>Class {cls}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Subject Selection */}
        {step === 'subject' && subjects.length > 0 && (
          <section aria-labelledby="subject-heading">
            <h2 id="subject-heading" style={styles.sectionTitle}>🎯 Class {selectedClass} — Pick a Subject</h2>
            <div className="select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
              {subjects.map(sub => (
                <button key={sub} className={`select-card ${selectedSubject === sub ? 'active' : ''}`}
                  onClick={() => setSelectedSubject(sub)} aria-label={sub} aria-pressed={selectedSubject === sub}>
                  <span className="icon" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>{subjectIcons[sub.toLowerCase()] || '📖'}</span>
                  <span style={{ fontWeight: 700 }}>{sub.charAt(0).toUpperCase() + sub.slice(1)}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop:'2rem', width: '100%' }}
              onClick={() => { setSelectedClass(''); setStep('class'); }} aria-label="Back to class selection">
              ← Back to Classes
            </button>
          </section>
        )}

        {/* Chapter Selection */}
        {step === 'chapter' && chapters.length > 0 && (
          <section aria-labelledby="chapter-heading">
            <h2 id="chapter-heading" style={styles.sectionTitle}>
              {subjectIcons[selectedSubject?.toLowerCase()] || '📖'} Choose a Lesson
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {chapters.map(ch => (
                <button key={ch.chapterNumber}
                  className="card"
                  style={styles.chapterCard}
                  onClick={() => handleChapterSelect(ch)}
                  aria-label={`Chapter ${ch.chapterNumber}: ${ch.title}`}
                >
                  <div style={styles.chapterNum}>CH {ch.chapterNumber}</div>
                  <div style={styles.chapterTitle}>{ch.title}</div>
                  <div style={styles.playIcon}>▶</div>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop:'2rem', width: '100%' }}
              onClick={() => { setSelectedSubject(''); setStep('subject'); }} aria-label="Back to subject selection">
              ← Back to Subjects
            </button>
          </section>
        )}

        {step === 'subject' && subjects.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--color-text-soft)', padding:'4rem' }}>
            <div className="animate-spin" style={{ fontSize:'2.5rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontWeight: 600 }}>Loading lessons for you...</p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight:'100vh', position:'relative', overflow:'hidden', background: '#050505' },
  header: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'1.5rem 2rem', borderBottom:'1px solid var(--color-border)',
    position:'sticky', top:0, background:'rgba(5, 5, 5, 0.8)', backdropFilter:'blur(20px)', zIndex:100,
  },
  logo: { display:'flex', alignItems:'center', gap:'1rem', fontWeight:800, fontSize:'1.4rem', color:'#fff' },
  headerAvatar: { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-primary)' },
  studentChip: {
    display:'flex', alignItems:'center', gap:'0.75rem',
    background:'rgba(255,255,255,0.05)', borderRadius:'var(--radius-full)',
    padding:'0.5rem 1.2rem', border:'1px solid var(--color-border)', fontSize:'0.9rem',
  },
  main: { maxWidth:'800px', margin:'0 auto', padding:'3rem 2rem', display:'flex', flexDirection:'column', gap:'2rem' },
  sectionTitle: { fontSize:'1.8rem', fontWeight:800, marginBottom:'1.5rem', color:'#fff', letterSpacing: '-0.02em' },
  breadcrumb: { display:'flex', alignItems:'center', gap:'0.6rem', fontSize:'0.95rem' },
  crumb:       { color:'var(--color-text-soft)', fontWeight:600 },
  crumbActive: { color:'var(--color-primary)', fontWeight:800 },
  crumbMuted:  { color:'var(--color-text-muted)' },
  crumbSep:    { color:'var(--color-text-muted)' },
  voiceRow: {
    display:'flex', alignItems:'center', gap:'1.5rem',
    background:'rgba(255,255,255,0.03)', borderRadius:'var(--radius-lg)',
    padding:'1.2rem 1.8rem', border:'1px solid var(--color-border)',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
  },
  voiceText: { flex:1, fontSize:'1.1rem', fontWeight: 500 },
  chapterCard: {
    display:'flex', alignItems:'center', gap:'1.5rem',
    padding:'1.2rem 1.8rem',
    cursor:'pointer', textAlign:'left'
  },
  chapterNum:   { minWidth:'60px', fontWeight:900, color:'var(--color-primary)', fontSize:'1rem', letterSpacing: '0.05em' },
  chapterTitle: { flex:1, fontWeight:700, fontSize:'1.2rem', color: '#fff' },
  playIcon: { width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }
};

