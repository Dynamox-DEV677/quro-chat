import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

// Shared dark animated background: radial glow + grid + drifting particles
// Matches the Quro landing page aesthetic (dark/neon glassmorphism)
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Pre-compute deterministic particles so they don't jitter between frames
  const particles = React.useMemo(() => {
    const arr: { x: number; y: number; r: number; speed: number; hue: number }[] = [];
    // Seeded pseudo-random so it's stable across frames
    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: rnd() * width,
        y: rnd() * height,
        r: 1 + rnd() * 2.5,
        speed: 0.3 + rnd() * 0.8,
        hue: rnd() < 0.5 ? 180 : 270, // cyan or purple
      });
    }
    return arr;
  }, [width, height]);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at 20% 30%, rgba(56, 189, 248, 0.18) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 80% 70%, rgba(168, 85, 247, 0.18) 0%, transparent 55%),' +
          'linear-gradient(180deg, #050510 0%, #0a0a1a 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Grid overlay */}
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0, opacity: 0.08 }}
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#38bdf8" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Drifting particles */}
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0 }}
      >
        {particles.map((p, i) => {
          const y = (p.y + frame * p.speed) % height;
          const alpha = 0.3 + 0.5 * Math.abs(Math.sin((frame + i * 7) * 0.04));
          const color = p.hue === 180 ? '56, 189, 248' : '168, 85, 247';
          return (
            <circle
              key={i}
              cx={p.x}
              cy={y}
              r={p.r}
              fill={`rgba(${color}, ${alpha})`}
            />
          );
        })}
      </svg>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
