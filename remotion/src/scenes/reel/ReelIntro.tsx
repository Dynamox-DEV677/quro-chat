import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 3s logo reveal. Clean black background, Quro green accent, no cyan/purple.
export const ReelIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo mark scales in
  const markScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Wordmark slides up
  const wordY = spring({
    frame: frame - 12,
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  const wordOpacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle fade
  const subOpacity = interpolate(frame, [32, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit fade
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gentle pulse on the mark
  const pulse = 0.8 + 0.2 * Math.abs(Math.sin(frame * 0.12));

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        opacity: exitOpacity,
      }}
    >
      {/* Logo mark — rounded square with up-trend icon (matches Quro navbar logo) */}
      <div
        style={{
          width: 280,
          height: 280,
          borderRadius: 64,
          background:
            'linear-gradient(135deg, rgba(56,161,105,0.22) 0%, rgba(61,168,122,0.08) 100%)',
          border: '3px solid rgba(56,161,105,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${markScale})`,
          boxShadow: `0 0 ${120 * pulse}px rgba(56,161,105,${0.5 * pulse}), inset 0 0 60px rgba(56,161,105,0.15)`,
          marginBottom: 60,
        }}
      >
        <svg width={180} height={180} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
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
          transform: `translateY(${(1 - wordY) * 40}px)`,
          opacity: wordOpacity,
          lineHeight: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        QURO
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 38,
          fontWeight: 500,
          color: '#3da87a',
          letterSpacing: 4,
          marginTop: 24,
          opacity: subOpacity,
          textTransform: 'uppercase',
        }}
      >
        Chat · Trade · Compete
      </div>
    </AbsoluteFill>
  );
};
