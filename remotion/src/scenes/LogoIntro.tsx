import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 2.5s — "QURO" logo slams in with a radial glow burst
export const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Letters pop in one at a time
  const letters = 'QURO'.split('');
  const letterDelay = 6; // frames between letters

  // Glow bursts behind the logo
  const burstScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 60 },
  });
  const burstOpacity = interpolate(frame, [0, 30, 60, 75], [0, 0.9, 0.6, 0], {
    extrapolateRight: 'clamp',
  });

  // Exit fade
  const exit = interpolate(frame, [65, 75], [1, 0], {
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
      {/* Radial burst */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(56,189,248,0.5) 0%, rgba(168,85,247,0.3) 40%, transparent 70%)',
          transform: `scale(${burstScale * 1.4})`,
          opacity: burstOpacity,
          filter: 'blur(20px)',
        }}
      />

      {/* Logo letters */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {letters.map((ltr, i) => {
          const start = i * letterDelay;
          const scale = spring({
            frame: frame - start,
            fps,
            config: { damping: 10, stiffness: 120, mass: 0.6 },
          });
          const letterFrame = frame - start;
          const opacity = interpolate(letterFrame, [0, 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <span
              key={i}
              style={{
                fontSize: 280,
                fontWeight: 900,
                letterSpacing: -8,
                color: '#fff',
                transform: `scale(${scale})`,
                opacity,
                textShadow:
                  '0 0 40px rgba(56,189,248,0.8), 0 0 80px rgba(168,85,247,0.6)',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'inline-block',
              }}
            >
              {ltr}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
