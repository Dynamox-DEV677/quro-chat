import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 6s final CTA — "QURO" wordmark, "Start trading. Free. Forever.",
// Launch App button, and the URL quro-9.com. All Quro black/green.
export const ReelCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const headlineY = spring({
    frame: frame - 18,
    fps,
    config: { damping: 15, stiffness: 90 },
  });
  const headlineOpacity = interpolate(frame, [18, 38], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const btnScale = spring({
    frame: frame - 42,
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const btnOpacity = interpolate(frame, [42, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const urlOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulsing green glow on button
  const btnPulse = 0.7 + 0.3 * Math.abs(Math.sin(frame * 0.1));

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: 44,
          background:
            'linear-gradient(135deg, rgba(56,161,105,0.25) 0%, rgba(61,168,122,0.08) 100%)',
          border: '3px solid rgba(56,161,105,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${logoScale})`,
          boxShadow: `0 0 ${80 * btnPulse}px rgba(56,161,105,${0.5 * btnPulse})`,
          marginBottom: 32,
        }}
      >
        <svg width={120} height={120} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      </div>

      {/* QURO wordmark */}
      <div
        style={{
          fontSize: 180,
          fontWeight: 900,
          letterSpacing: -8,
          color: '#f0f0f2',
          transform: `scale(${logoScale})`,
          lineHeight: 1,
          marginBottom: 24,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        QURO
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 58,
          fontWeight: 700,
          color: '#f0f0f2',
          textAlign: 'center',
          letterSpacing: -1.5,
          transform: `translateY(${(1 - headlineY) * 30}px)`,
          opacity: headlineOpacity,
          lineHeight: 1.15,
          marginBottom: 64,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Start trading. <br />
        <span style={{ color: '#3da87a' }}>Free. Forever.</span>
      </div>

      {/* Launch App button */}
      <div
        style={{
          transform: `scale(${btnScale})`,
          opacity: btnOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '36px 84px',
          borderRadius: 999,
          background:
            'linear-gradient(135deg, #38a169 0%, #3da87a 100%)',
          boxShadow: `0 0 ${80 * btnPulse}px rgba(56,161,105,${0.6 * btnPulse}), 0 20px 60px rgba(0,0,0,0.6)`,
          marginBottom: 60,
        }}
      >
        <span
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: '#09090b',
            letterSpacing: -1,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Launch App
        </span>
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      {/* URL */}
      <div
        style={{
          fontSize: 62,
          fontWeight: 600,
          color: 'rgba(240,240,242,0.9)',
          letterSpacing: 2,
          opacity: urlOpacity,
          transform: `translateY(${(1 - urlOpacity) * 20}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        quro-9.com
      </div>
    </AbsoluteFill>
  );
};
