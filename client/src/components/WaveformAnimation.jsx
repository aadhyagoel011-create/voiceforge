import React from 'react';

export default function WaveformAnimation({
  mode = 'idle',
  frequencyData = null,
  height = 54,
  barCount = 28
}) {
  const isSpeaking = mode === 'speaking';
  const isListening = mode === 'listening';
  const isActive = isSpeaking || isListening;

  const bars = Array.from({ length: barCount }, (_, i) => {
    let barHeight = 6;
    let barColor = '#D8D2E7';

    if (frequencyData && frequencyData.length > 0 && isActive) {
      // Map real frequency data directly to bar heights
      const step = Math.floor(frequencyData.length / barCount);
      const val = frequencyData[Math.min(i * step, frequencyData.length - 1)] || 0;
      const ratio = val / 255;
      barHeight = Math.max(6, Math.min(height, Math.round(ratio * height * 1.2)));

      if (isSpeaking) {
        barColor = i % 3 === 0 ? '#FF765F' : i % 2 === 0 ? '#4936A8' : '#8067E8';
      } else if (isListening) {
        barColor = i % 2 === 0 ? '#4936A8' : '#8067E8';
      }
    } else if (isActive) {
      // Organic speech animation based on sine synthesis
      const randomScale = (Math.sin(i * 0.75 + (isSpeaking ? 1.5 : 0.5)) + 1.25) / 2.25;
      barHeight = isSpeaking
        ? Math.max(12, Math.floor(randomScale * height))
        : Math.max(8, Math.floor(randomScale * height * 0.6));

      if (isSpeaking) {
        barColor = i % 3 === 0 ? '#FF765F' : i % 2 === 0 ? '#4936A8' : '#8067E8';
      } else {
        barColor = i % 2 === 0 ? '#8067E8' : '#B8ACEC';
      }
    }

    const delay = (i * 0.05).toFixed(2);
    const duration = isSpeaking ? '0.7s' : '1.1s';

    return (
      <div
        key={i}
        className={`waveform-bar ${isSpeaking ? 'speaking' : isListening ? 'listening' : ''}`}
        style={{
          height: `${barHeight}px`,
          backgroundColor: barColor,
          animationDuration: duration,
          animationDelay: `${delay}s`,
          width: '4px',
          borderRadius: '4px',
          margin: '0 1.5px',
          transition: 'height 0.08s ease'
        }}
      />
    );
  });

  return (
    <div
      className="waveform-container"
      style={{
        height: `${height + 20}px`,
        backgroundColor: isActive ? 'var(--bg-subtle)' : '#FCFBFD'
      }}
      aria-label={`Waveform visualization (${mode})`}
    >
      {bars}
    </div>
  );
}
