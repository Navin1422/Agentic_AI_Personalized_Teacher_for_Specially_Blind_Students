
export default function VoiceButton({ onResult, isListening, onStart, onStop, size = 'lg' }) {
  const sizeMap = { sm: 56, md: 68, lg: 80, xl: 96 };
  const px = sizeMap[size] || 80;

  return (
    <div className="mic-wrapper" style={{ width: px, height: px }}>
      {isListening && (
        <>
          <span className="mic-pulse-ring" />
          <span className="mic-pulse-ring" />
          <span className="mic-pulse-ring" />
        </>
      )}
      <button
        className={`mic-btn ${isListening ? 'active' : ''}`}
        style={{ width: px, height: px, fontSize: px * 0.38 }}
        onClick={isListening ? onStop : onStart}
        aria-label={isListening ? 'Stop recording — click to stop' : 'Start recording — click to speak'}
        aria-pressed={isListening}
        title={isListening ? 'Tap to stop' : 'Tap to speak'}
      >
        {isListening ? '⏹' : '🎙️'}
      </button>
    </div>
  );
}
