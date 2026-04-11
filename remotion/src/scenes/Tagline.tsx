import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 4.5s — "Trade Together. Win Together." hero line slides up
export const Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Y = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const line2Y = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const subOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const subY = interpolate(frame, [40, 60], [30, 0], {
    extrapolateRight: 'clamp',
  });

  // Exit
  const exit = interpolate(frame, [120, 135], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exit,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 140,
            fontWeight: 800,
            margin: 0,
            color: '#fff',
            letterSpacing: -4,
            lineHeight: 1,
            transform: `translateY(${(1 - line1Y) * 80}px)`,
            opacity: line1Y,
          }}
        >
          Trade Together.
        </h1>
        <h1
          style={{
            fontSize: 140,
            fontWeight: 800,
            margin: '16px 0 0 0',
            background:
              'linear-gradient(90deg, #38bdf8 0%, #a855f7 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: -4,
            lineHeight: 1,
            transform: `translateY(${(1 - line2Y) * 80}px)`,
            opacity: line2Y,
            filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.6))',
          }}
        >
          Win Together.
        </h1>
        <p
          style={{
            marginTop: 60,
            fontSize: 42,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 1,
            fontWeight: 400,
            transform: `translateY(${subY}px)`,
            opacity: subOpacity,
          }}
        >
          The social trading app built for the next generation
        </p>
      </div>
    </AbsoluteFill>
  );
};
