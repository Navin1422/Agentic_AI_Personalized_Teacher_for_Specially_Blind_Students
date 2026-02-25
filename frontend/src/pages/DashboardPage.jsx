import { useState, useEffect } from 'react';
import { useStudent } from '../context/StudentContext';
import { getClasses, getSubjects, getChapters } from '../services/api';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import VoiceButton from '../components/VoiceButton';

const subjectIcons = { science:'🔬', maths:'🔢', math:'🔢', social:'🌍', english:'📖', tamil:'🌺', evs:'🌿' };

export default function DashboardPage({ onStartLesson }) {
  const { student, selectedClass, setSelectedClass, selectedSubject, setSelectedSubject, setSelectedChapter } = useStudent();
  const { speak } = useSpeechSynthesis();
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();

  const [classes, setClasses]   = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [step, setStep]         = useState('class');

  // Load available classes
  useEffect(() => {
    getClasses().then(res => setClasses(res.data.classes)).catch(console.error);
    setTimeout(() => {
      const greeting = student
        ? `Welcome back ${student.name}! You are in Class ${student.class || selectedClass}. Please choose a subject to start learning!`
        : `Welcome! Please choose your class first.`;
      speak(greeting, { rate: 0.9 });
    }, 500);
  }, []);

  // Load subjects when class is selected
  useEffect(() => {
    if (!selectedClass) return;
    setStep('subject');
    getSubjects(selectedClass).then(res => {
      setSubjects(res.data.subjects);
      speak(`You are in Class ${selectedClass}. Which subject shall we study today?`, { rate: 0.9 });
    });
  }, [selectedClass]);

  // Load chapters when subject is selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;
    setStep('chapter');
    getChapters(selectedClass, selectedSubject).then(res => {
      setChapters(res.data.chapters);
      speak(`${selectedSubject} for Class ${selectedClass}. Choose a chapter!`, { rate: 0.9 });
    });
  }, [selectedSubject]);

  // Voice command parser
  useEffect(() => {
    if (!transcript || isListening) return;
    const t = transcript.toLowerCase();

    // Detect class
    const classMatch = t.match(/class\s*(\d+)|(\d+)(th|st|nd|rd)?\s*class|standard\s*(\d+)/);
    if (classMatch) {
      const num = classMatch[1] || classMatch[2] || classMatch[4];
      if (num) { setSelectedClass(num); setTranscript(''); return; }
    }
    // Detect subject
    const subjectMap = { science:'science', maths:'maths', math:'maths', social:'social', english:'english', tamil:'tamil' };
    for (const [key, val] of Object.entries(subjectMap)) {
      if (t.includes(key)) { setSelectedSubject(val); setTranscript(''); return; }
    }
    // Detect chapter
    const chapterMatch = t.match(/chapter\s*(\d+)|(\d+)(st|nd|rd|th)?\s*chapter/);
    if (chapterMatch && chapters.length) {
      const num = parseInt(chapterMatch[1] || chapterMatch[2]);
      const ch  = chapters.find(c => c.chapterNumber === num);
      if (ch) { handleChapterSelect(ch); setTranscript(''); return; }
    }
  }, [transcript, isListening]);

  const handleChapterSelect = (ch) => {
    setSelectedChapter(ch);
    speak(`Starting Chapter ${ch.chapterNumber}: ${ch.title}. Let us begin!`, { rate: 0.9 });
    setTimeout(() => onStartLesson(), 800);
  };

  const classEmojis = {'1':'🐣','2':'🐥','3':'🌱','4':'🌿','5':'🌻','6':'⭐','7':'🚀','8':'💡','9':'🎓','10':'🏆'};

  return (
    <div style={styles.page}>
      <div style={styles.blob1} aria-hidden="true" />

      <header style={styles.header}>
        <div style={styles.logo}><span>🎓</span> EduVoice</div>
        {student && (
          <div style={styles.studentChip} aria-label={`Logged in as ${student.name}, Class ${student.class}`}>
            <span>👤</span>
            <span>{student.name}</span>
            {student.class && <span className="badge badge-blue">Class {student.class}</span>}
          </div>
        )}
      </header>

      <main style={styles.main} role="main">
        {/* Breadcrumb */}
        <nav style={styles.breadcrumb} aria-label="Lesson navigation">
          <span style={step === 'class' ? styles.crumbActive : styles.crumb}>Class</span>
          <span style={styles.crumbSep}>›</span>
          <span style={selectedClass ? (step === 'subject' ? styles.crumbActive : styles.crumb) : styles.crumbMuted}>Subject</span>
          <span style={styles.crumbSep}>›</span>
          <span style={selectedSubject ? (step === 'chapter' ? styles.crumbActive : styles.crumb) : styles.crumbMuted}>Chapter</span>
        </nav>

        {/* Voice command area */}
        <div style={styles.voiceRow}>
          <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
          <div style={styles.voiceText} aria-live="polite" aria-label="Voice input status">
            {isListening
              ? <span style={{ color:'var(--color-primary)' }}>🎙️ Listening... speak now!</span>
              : transcript
                ? <span style={{ color:'var(--color-text-soft)' }}>Heard: "{transcript}"</span>
                : <span style={{ color:'var(--color-text-muted)' }}>Tap mic or click to select below</span>
            }
          </div>
        </div>

        {/* Class Selection */}
        {step === 'class' && (
          <section aria-labelledby="class-heading">
            <h2 id="class-heading" style={styles.sectionTitle}>📚 Choose Your Class</h2>
            <div className="select-grid">
              {(classes.length ? classes : ['5','6']).map(cls => (
                <button key={cls} className={`select-card ${selectedClass === cls ? 'active' : ''}`}
                  onClick={() => setSelectedClass(cls)} aria-label={`Class ${cls}`} aria-pressed={selectedClass === cls}>
                  <span className="icon">{classEmojis[cls] || '📖'}</span>
                  Class {cls}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Subject Selection */}
        {step === 'subject' && subjects.length > 0 && (
          <section aria-labelledby="subject-heading">
            <h2 id="subject-heading" style={styles.sectionTitle}>🎯 Class {selectedClass} — Choose a Subject</h2>
            <div className="select-grid">
              {subjects.map(sub => (
                <button key={sub} className={`select-card ${selectedSubject === sub ? 'active' : ''}`}
                  onClick={() => setSelectedSubject(sub)} aria-label={sub} aria-pressed={selectedSubject === sub}>
                  <span className="icon">{subjectIcons[sub.toLowerCase()] || '📖'}</span>
                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop:'1rem' }}
              onClick={() => { setSelectedClass(''); setStep('class'); }} aria-label="Back to class selection">
              ← Back to Classes
            </button>
          </section>
        )}

        {/* Chapter Selection */}
        {step === 'chapter' && chapters.length > 0 && (
          <section aria-labelledby="chapter-heading">
            <h2 id="chapter-heading" style={styles.sectionTitle}>
              {subjectIcons[selectedSubject?.toLowerCase()] || '📖'} Class {selectedClass} {selectedSubject} — Chapters
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {chapters.map(ch => (
                <button key={ch.chapterNumber}
                  style={styles.chapterCard}
                  onClick={() => handleChapterSelect(ch)}
                  aria-label={`Chapter ${ch.chapterNumber}: ${ch.title}`}
                >
                  <span style={styles.chapterNum}>Ch {ch.chapterNumber}</span>
                  <span style={styles.chapterTitle}>{ch.title}</span>
                  <span style={{ color:'var(--color-primary)', fontSize:'1.2rem' }}>▶</span>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ marginTop:'1rem' }}
              onClick={() => { setSelectedSubject(''); setStep('subject'); }} aria-label="Back to subject selection">
              ← Back to Subjects
            </button>
          </section>
        )}

        {step === 'subject' && subjects.length === 0 && (
          <div style={{ textAlign:'center', color:'var(--color-text-soft)', padding:'2rem' }}>
            <div style={{ fontSize:'2rem' }}>📭</div>
            <p>Loading subjects...</p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight:'100vh', position:'relative', overflow:'hidden', padding:'0 0 3rem' },
  blob1: {
    position:'fixed', top:'-150px', right:'-100px', width:'500px', height:'500px', borderRadius:'50%',
    background:'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)', pointerEvents:'none',
  },
  header: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'1.2rem 1.5rem', borderBottom:'1px solid var(--color-border)',
    position:'sticky', top:0, background:'rgba(13,17,23,0.9)', backdropFilter:'blur(12px)', zIndex:100,
  },
  logo: { display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:800, fontSize:'1.3rem', color:'var(--color-primary)' },
  studentChip: {
    display:'flex', alignItems:'center', gap:'0.5rem',
    background:'var(--color-surface)', borderRadius:'var(--radius-full)',
    padding:'0.4rem 1rem', border:'1px solid var(--color-border)', fontSize:'0.9rem',
  },
  main: { maxWidth:'720px', margin:'0 auto', padding:'2rem 1.5rem', display:'flex', flexDirection:'column', gap:'1.5rem' },
  sectionTitle: { fontSize:'1.3rem', fontWeight:700, marginBottom:'1rem', color:'var(--color-text)' },
  breadcrumb: { display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.9rem' },
  crumb:       { color:'var(--color-text-soft)', fontWeight:600 },
  crumbActive: { color:'var(--color-primary)', fontWeight:700 },
  crumbMuted:  { color:'var(--color-text-muted)' },
  crumbSep:    { color:'var(--color-text-muted)' },
  voiceRow: {
    display:'flex', alignItems:'center', gap:'1rem',
    background:'var(--color-surface)', borderRadius:'var(--radius-full)',
    padding:'0.8rem 1.2rem', border:'1px solid var(--color-border)',
  },
  voiceText: { flex:1, fontSize:'1rem' },
  chapterCard: {
    display:'flex', alignItems:'center', gap:'1rem',
    background:'var(--color-surface)', border:'1.5px solid var(--color-border)',
    borderRadius:'var(--radius-md)', padding:'1rem 1.2rem',
    cursor:'pointer', transition:'var(--transition)', textAlign:'left', fontFamily:'var(--font-main)',
    color:'var(--color-text)',
  },
  chapterNum:   { minWidth:'48px', fontWeight:800, color:'var(--color-primary)', fontSize:'1rem' },
  chapterTitle: { flex:1, fontWeight:600, fontSize:'1.05rem' },
};
