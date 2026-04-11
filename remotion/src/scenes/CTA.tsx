import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 5s — Final CTA: "Join Quro" + quro-9.site
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const headlineY = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const btnScale = spring({
    frame: frame - 35,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  const urlOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulsing button glow
  const btnPulse = 0.7 + 0.3 * Math.abs(Math.sin(frame * 0.1));

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      {/* Quro logo */}
      <div
        style={{
          fontSize: 200,
          fontWeight: 900,
          letterSpacing: -6,
          background:
            'linear-gradient(90deg, #38bdf8 0%, #a855f7 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          transform: `scale(${logoScale})`,
          filter: 'drop-shadow(0 0 40px rgba(168,85,247,0.6))',
          marginBottom: 20,
          lineHeight: 1,
        }}
      >
        QURO
      </div>

      {/* Headline */}
      <h2
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: '#fff',
          margin: 0,
          marginBottom: 60,
          letterSpacing: -2,
          transform: `translateY(${(1 - headlineY) * 40}px)`,
          opacity: headlineY,
          textAlign: 'center',
        }}
      >
        Start trading. <span style={{ color: '#38bdf8' }}>Free. Forever.</span>
      </h2>

      {/* Launch App button */}
      <div
        style={{
          transform: `scale(${btnScale})`,
          opacity: btnScale,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '32px 72px',
          borderRadius: 999,
          background:
            'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
          boxShadow: `0 0 ${60 * btnPulse}px rgba(56,189,248,${0.6 * btnPulse}), 0 0 ${120 * btnPulse}px rgba(168,85,247,${0.4 * btnPulse})`,
          marginBottom: 60,
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: -1,
          }}
        >
          Launch App
        </span>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      {/* URL */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: 1,
          opacity: urlOpacity,
          transform: `translateY(${(1 - urlOpacity) * 20}px)`,
        }}
      >
        quro-9.site
      </div>
    </AbsoluteFill>
  );
};
