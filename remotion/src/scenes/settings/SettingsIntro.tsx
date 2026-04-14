import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 3.5s — Gear icon + "Your App, Your Way" intro
export const SettingsIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const iconRotate = interpolate(frame, [0, 60], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const l1Y = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 90 } });
  const l1Op = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const l2Y = spring({ frame: frame - 40, fps, config: { damping: 16, stiffness: 90 } });
  const l2Op = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const exitOp = interpolate(frame, [90, 105], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', opacity: exitOp }}>
      {/* Gear icon */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: 52,
          background: 'linear-gradient(135deg, rgba(56,161,105,0.2) 0%, rgba(61,168,122,0.06) 100%)',
          border: '3px solid rgba(56,161,105,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
          boxShadow: '0 0 80px rgba(56,161,105,0.4)',
          marginBottom: 60,
        }}
      >
        <svg width={120} height={120} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>

      <div style={{
        fontSize: 72,
        fontWeight: 800,
        color: '#f0f0f2',
        textAlign: 'center',
        letterSpacing: -3,
        lineHeight: 1.1,
        transform: `translateY(${(1 - l1Y) * 30}px)`,
        opacity: l1Op,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Your App.
      </div>

      <div style={{
        fontSize: 72,
        fontWeight: 800,
        color: '#3da87a',
        textAlign: 'center',
        letterSpacing: -3,
        lineHeight: 1.1,
        marginTop: 16,
        transform: `translateY(${(1 - l2Y) * 30}px)`,
        opacity: l2Op,
        textShadow: '0 0 40px rgba(56,161,105,0.5)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Your Way.
      </div>
    </AbsoluteFill>
  );
};
