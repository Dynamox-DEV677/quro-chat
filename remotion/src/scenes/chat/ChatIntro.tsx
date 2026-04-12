import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 3.5s — "Not another charting app" → "A trading community"
export const ChatIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Chat bubble icon
  const iconScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Line 1
  const l1Y = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 90 } });
  const l1Op = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Line 2
  const l2Y = spring({ frame: frame - 35, fps, config: { damping: 16, stiffness: 90 } });
  const l2Op = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Exit
  const exitOp = interpolate(frame, [90, 105], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', opacity: exitOp }}>
      {/* Chat bubble icon */}
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
          transform: `scale(${iconScale})`,
          boxShadow: '0 0 80px rgba(56,161,105,0.4)',
          marginBottom: 60,
        }}
      >
        <svg width={120} height={120} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
        Not another charting app.
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
        A trading community.
      </div>
    </AbsoluteFill>
  );
};
