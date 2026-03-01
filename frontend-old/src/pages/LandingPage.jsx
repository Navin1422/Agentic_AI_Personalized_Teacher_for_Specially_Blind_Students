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
    if (step === 'intro') {
      const welcome = "Vanakkam! Welcome to EduVoice. I am Akka, your AI teacher! Tap anywhere or click Enter to get started.";
      speak(welcome, { rate: 0.95 });
    }

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
    setTimeout(startListening, 2500); 
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
      <div className="premium-bg" />
      <div className="mesh-glow" />
      
      <main style={styles.main}>

        {/* Logo + hero */}
        <div className="animate-fadeInUp" style={styles.hero}>
          <div className="animate-float" style={styles.logoWrap} aria-hidden="true">
            <img src="/brixbee.png" alt="Brixbee" style={styles.logoImg} />
          </div>
          <h1 style={styles.title}>
            Edu<span style={styles.titleAccent}>Voice</span>
          </h1>
          <p style={styles.subtitle}>AI Teacher for Specially Abled Children</p>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap', marginTop:'1.5rem' }}>
            <span className="badge badge-gold">🎙️ Voice-First</span>
            <span className="badge badge-blue">👩‍🏫 AI Teacher Akka</span>
            <span className="badge badge-gold">🐝 Powered by Brixbee</span>
          </div>
        </div>

        {/* Step: Intro */}
        {step === 'intro' && (
          <div className="card animate-fadeInUp" style={styles.card}>
            <p style={styles.introText}>
              🙏 Vanakkam! I am <strong>Akka</strong>, your personal AI teacher.<br />
              Supported by your companion <strong>Brixbee</strong>, I can teach you anything!<br />
              Just talk to me — I am listening.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', alignItems:'center' }}>
              <button
                className="btn btn-primary"
                style={{ width:'100%', fontSize:'1.2rem', padding:'1.1rem' }}
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
            <form onSubmit={handleNameSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.5rem', alignItems:'center' }}>
              <input
                ref={inputRef}
                className="input-field"
                type="text"
                placeholder="e.g. Priya, Karthik..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={40}
                aria-label="Enter your name"
                style={{ textAlign:'center', fontSize:'1.2rem' }}
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
            <h2 style={styles.stepTitle}>📚 Hello <span style={{ color:'var(--color-primary)' }}>{name}</span>!</h2>
            <p style={styles.stepHint}>Which class are you in? Say it or pick one.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', alignItems:'center', marginTop:'0.5rem' }}>
              <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'0.8rem', width:'100%' }}>
                {classes.map(cls => (
                  <button
                    key={cls}
                    className="select-card"
                    onClick={() => handleClassSelect(cls)}
                    disabled={loading}
                    aria-label={`Class ${cls}`}
                    style={{ padding:'1rem 0.4rem' }}
                  >
                    <span className="icon" style={{ fontSize:'1.6rem' }}>{classEmojis[cls] || '📖'}</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:700 }}>Class {cls}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Ready */}
        {step === 'ready' && (
          <div className="card animate-fadeInUp" style={{ ...styles.card, textAlign:'center', alignItems:'center' }}>
            <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🌟</div>
            <h2 style={styles.stepTitle}>You are all set, {name}!</h2>
            <p style={{ color:'var(--color-text-soft)', margin:'1rem 0 2rem', fontSize:'1.1rem' }}>{greeting}</p>
            <VoiceButton isListening={isListening} onStart={startListening} onStop={stopListening} />
            <button
              className="btn btn-primary"
              style={{ width:'100%', fontSize:'1.2rem', padding:'1.1rem', marginTop:'1.5rem' }}
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
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
  },
  main: {
    width: '100%', maxWidth: '600px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem',
    position: 'relative', zIndex: 1,
  },
  hero: { textAlign: 'center' },
  logoWrap: {
    width: '180px', height: '180px', borderRadius: '50%', margin: '0 auto 1.5rem',
    background: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--shadow-glow-gold)',
    overflow: 'hidden'
  },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  title: {
    fontSize: 'clamp(3rem, 10vw, 4.5rem)',
    fontWeight: 800,
    letterSpacing: '-1px',
    color: '#fff'
  },
  titleAccent: {
    color: 'var(--color-primary)',
    textShadow: '0 0 30px rgba(212, 175, 55, 0.4)'
  },
  subtitle: {
    color: 'var(--color-text-soft)', fontSize: '1.2rem', marginTop: '0.5rem',
    fontWeight: 500, letterSpacing: '0.02em'
  },
  card: {
    width: '100%',
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
  },
  introText: {
    color: 'var(--color-text-soft)', lineHeight: 1.8,
    textAlign: 'center', fontSize: '1.15rem',
  },
  stepTitle: {
    fontSize: '1.6rem', fontWeight: 800, textAlign: 'center',
  },
  stepHint: {
    color: 'var(--color-text-soft)', textAlign: 'center', fontSize: '1rem',
    marginBottom: '0.5rem'
  },
};

