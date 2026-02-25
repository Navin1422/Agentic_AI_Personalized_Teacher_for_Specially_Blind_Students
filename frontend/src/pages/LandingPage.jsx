import { useState, useEffect, useRef } from 'react';
import { useStudent } from '../context/StudentContext';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';

export default function LandingPage({ onDone }) {
  const { loginStudent } = useStudent();
  const { speak } = useSpeechSynthesis();

  const [name, setName]         = useState('');
  const [classLvl, setClassLvl] = useState('');
  const [step, setStep]         = useState('intro'); // intro | name | class | ready
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef(null);

  // On mount: speak welcome
  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Vanakkam! Welcome to EduVoice. I am Akka, your AI teacher! Please type your name to get started.", { rate: 0.9 });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Focus input when step changes
  useEffect(() => {
    if ((step === 'name' || step === 'class') && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleStart = () => {
    setStep('name');
    speak("Please tell me your name!", { rate: 0.95 });
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('class');
    speak(`Hello ${name}! Which class are you in? Please choose your class.`, { rate: 0.95 });
  };

  const handleClassSelect = async (cls) => {
    setClassLvl(cls);
    setLoading(true);
    try {
      const res = await loginStudent(name.trim(), cls);
      const msg = res.isNew
        ? `Welcome ${name}! I am so happy to be your teacher today! Let us start learning together!`
        : `Welcome back ${name}! I missed you! Shall we continue from where we left off?`;
      setGreeting(msg);
      speak(msg, { rate: 0.9 });
      setStep('ready');
    } catch (err) {
      console.error(err);
      speak("Oops! Something went wrong. Please try again.", { rate: 0.9 });
    } finally {
      setLoading(false);
    }
  };

  const classes = ['1','2','3','4','5','6','7','8','9','10'];
  const classEmojis = { '1':'🐣','2':'🐥','3':'🌱','4':'🌿','5':'🌻','6':'⭐','7':'🚀','8':'💡','9':'🎓','10':'🏆' };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} aria-hidden="true" />
      <div style={styles.blob2} aria-hidden="true" />

      <main style={styles.main}>

        {/* Logo + hero */}
        <div className="animate-fadeInUp" style={styles.hero}>
          <div className="animate-float" style={styles.logoWrap} aria-hidden="true">
            <span style={styles.logoEmoji}>🎓</span>
          </div>
          <h1 style={styles.title}>
            Edu<span style={styles.titleAccent}>Voice</span>
          </h1>
          <p style={styles.subtitle}>AI Teacher for Tamil Nadu Students</p>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap', marginTop:'0.5rem' }}>
            <span className="badge badge-blue">🎙️ Voice-First</span>
            <span className="badge badge-gold">👩‍🏫 AI Teacher Akka</span>
            <span className="badge badge-green">📚 TN State Board</span>
          </div>
        </div>

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="card animate-fadeInUp" style={styles.card}>
            <p style={styles.introText}>
              🙏 Vanakkam! I am <strong>Akka</strong>, your personal AI teacher.<br />
              I can teach you <strong>Science, Maths, and Social Studies</strong> in a fun way!<br />
              Just talk to me — I will listen and explain everything.
            </p>
            <button
              className="btn btn-primary"
              style={{ width:'100%', fontSize:'1.15rem', padding:'0.9rem' }}
              onClick={handleStart}
              aria-label="Get started — click to begin"
            >
              🚀 Let's Start Learning!
            </button>
          </div>
        )}

        {/* Step: Enter name */}
        {step === 'name' && (
          <div className="card animate-fadeInUp" style={styles.card}>
            <h2 style={styles.stepTitle}>👤 What is your name?</h2>
            <p style={styles.stepHint}>Type your name below</p>
            <form onSubmit={handleNameSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <input
                ref={inputRef}
                className="input-field"
                type="text"
                placeholder="e.g. Priya, Karthik, Anbu..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={40}
                aria-label="Enter your name"
                style={{ textAlign:'center', fontSize:'1.1rem' }}
                autoComplete="off"
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!name.trim()}
                style={{ width:'100%' }}
                aria-label="Continue after entering name"
              >
                Continue →
              </button>
            </form>
          </div>
        )}

        {/* Step: Pick class */}
        {step === 'class' && (
          <div className="card animate-fadeInUp" style={styles.card}>
            <h2 style={styles.stepTitle}>📚 Hello <span style={{ color:'var(--color-secondary)' }}>{name}</span>! Which class are you in?</h2>
            <p style={styles.stepHint}>Tap your class number</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'0.6rem', marginTop:'0.5rem' }}>
              {classes.map(cls => (
                <button
                  key={cls}
                  className="select-card"
                  onClick={() => handleClassSelect(cls)}
                  disabled={loading}
                  aria-label={`Class ${cls}`}
                  style={{ padding:'0.8rem 0.3rem' }}
                >
                  <span className="icon" style={{ fontSize:'1.4rem' }}>{classEmojis[cls] || '📖'}</span>
                  <span style={{ fontSize:'0.9rem' }}>Class {cls}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Ready */}
        {step === 'ready' && (
          <div className="card animate-fadeInUp" style={{ ...styles.card, textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🌟</div>
            <h2 style={styles.stepTitle}>You are all set, {name}!</h2>
            <p style={{ color:'var(--color-text-soft)', margin:'0.5rem 0 1.5rem' }}>{greeting}</p>
            <button
              className="btn btn-gold"
              style={{ width:'100%', fontSize:'1.15rem', padding:'0.9rem' }}
              onClick={onDone}
              aria-label="Go to lessons dashboard"
            >
              📚 Go to My Lessons!
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'fixed', top: '-100px', left: '-100px',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'fixed', bottom: '-100px', right: '-80px',
    width: '350px', height: '350px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,230,190,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  main: {
    width: '100%', maxWidth: '560px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
    position: 'relative', zIndex: 1,
  },
  hero: { textAlign: 'center' },
  logoWrap: {
    width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 1rem',
    background: 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(99,230,190,0.2))',
    border: '2px solid rgba(79,142,247,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--shadow-glow-blue)',
  },
  logoEmoji: { fontSize: '2.6rem' },
  title: {
    fontSize: 'clamp(2.5rem, 8vw, 3.8rem)',
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  titleAccent: {
    background: 'linear-gradient(135deg, #4f8ef7, #63e6be)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: 'var(--color-text-soft)', fontSize: '1.1rem', marginTop: '0.25rem',
  },
  card: {
    width: '100%',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  introText: {
    color: 'var(--color-text-soft)', lineHeight: 1.8,
    textAlign: 'center', fontSize: '1.05rem',
  },
  stepTitle: {
    fontSize: '1.3rem', fontWeight: 700, textAlign: 'center',
  },
  stepHint: {
    color: 'var(--color-text-soft)', textAlign: 'center', fontSize: '0.9rem',
  },
};
