import { useState, useEffect, useRef } from 'react';
import { useStudent } from '../context/StudentContext';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import VoiceButton from '../components/VoiceButton';

export default function LandingPage({ onDone }) {
  const { loginStudent } = useStudent();
  const { speak } = useSpeechSynthesis();
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();

  const [name, setName]         = useState('');
  const [classLvl, setClassLvl] = useState('');
  const [step, setStep]         = useState('intro'); // intro | name | class | ready
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef(null);

  // Focus and speak on start
  useEffect(() => {
    const welcome = "Vanakkam! Welcome to EduVoice. I am Akka, your AI teacher! Tap anywhere or click Enter to get started.";
    speak(welcome, { rate: 0.95 });

    // Global listeners for "Tap anywhere or Enter"
    const triggerStart = (e) => {
      if (step === 'intro') {
        if (e.type === 'click' || (e.type === 'keydown' && e.key === 'Enter')) {
          handleStart();
        }
      }
    };

    window.addEventListener('click', triggerStart);
    window.addEventListener('keydown', triggerStart);
    return () => {
      window.removeEventListener('click', triggerStart);
      window.removeEventListener('keydown', triggerStart);
    };
  }, [step]);

  // Voice command handler
  useEffect(() => {
    if (!transcript || isListening) return;
    const t = transcript.trim().toLowerCase();
    setTranscript('');

    if (step === 'intro' && (t.includes('start') || t.includes('ready') || t.includes('hello') || t.includes('vanakkam'))) {
      handleStart();
    } else if (step === 'name' && t.length > 1) {
      handleNameVoice(transcript.trim());
    } else if (step === 'class') {
      const match = t.match(/class\s*(\d+)|(\d+)/);
      if (match) {
        const num = match[1] || match[2];
        if (num) handleClassSelect(num);
      }
    } else if (step === 'ready' && (t.includes('go') || t.includes('lesson') || t.includes('start') || t.includes('dashboard'))) {
      onDone();
    }
  }, [transcript, isListening]);

  const handleStart = () => {
    setStep('name');
    speak("Wonderful! Please tell me your name.", { rate: 0.95 });
    setTimeout(startListening, 2500); // Wait for speech to finish then listen
  };

  const handleNameVoice = (voicedName) => {
    setName(voicedName);
    setStep('class');
    speak(`Hello ${voicedName}! Which class are you in? Say a number from one to ten.`, { rate: 0.95 });
    setTimeout(startListening, 4500);
  };

  const handleNameSubmit = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    setStep('class');
    speak(`Hello ${name}! Which class are you in? Say a number from one to ten.`, { rate: 0.95 });
    setTimeout(startListening, 4500);
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
      speak(msg + " Say 'go to lessons' to begin.", { rate: 0.95 });
      setStep('ready');
      setTimeout(startListening, 6000);
    } catch (err) {
      console.error(err);
      speak("Oops! Something went wrong. Please try again.", { rate: 0.95 });
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
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center' }}>
              <button
                className="btn btn-primary"
                style={{ width:'100%', fontSize:'1.15rem', padding:'0.9rem' }}
                onClick={handleStart}
                aria-label="Get started — click to begin"
              >
                🚀 Let's Start Learning!
              </button>
              <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
            </div>
          </div>
        )}

        {/* Step: Enter name */}
        {step === 'name' && (
          <div className="card animate-fadeInUp" style={styles.card}>
            <h2 style={styles.stepTitle}>👤 What is your name?</h2>
            <p style={styles.stepHint}>Say your name clearly after tapping mic</p>
            <form onSubmit={handleNameSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center' }}>
              <input
                ref={inputRef}
                className="input-field"
                type="text"
                placeholder="e.g. Priya, Karthik..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={40}
                aria-label="Enter your name"
                style={{ textAlign:'center', fontSize:'1.1rem' }}
                autoComplete="off"
              />
              <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!name.trim()}
                style={{ width:'100%' }}
                aria-label="Continue"
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
            <p style={styles.stepHint}>Say your class number (1-10)</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center', marginTop:'0.5rem' }}>
              <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'0.6rem', width:'100%' }}>
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
          </div>
        )}

        {/* Step: Ready */}
        {step === 'ready' && (
          <div className="card animate-fadeInUp" style={{ ...styles.card, textAlign:'center', alignItems:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🌟</div>
            <h2 style={styles.stepTitle}>You are all set, {name}!</h2>
            <p style={{ color:'var(--color-text-soft)', margin:'0.5rem 0 1.5rem' }}>{greeting}</p>
            <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
            <button
              className="btn btn-gold"
              style={{ width:'100%', fontSize:'1.15rem', padding:'0.9rem', marginTop:'1rem' }}
              onClick={onDone}
              aria-label="Go to lessons"
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
