import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Feature = {
  title: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: 'Chat',
    desc: 'Real-time rooms, DMs & servers',
    color: '#38bdf8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Paper Trading',
    desc: 'Zero-risk NSE stock simulator',
    color: '#a855f7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Leaderboard',
    desc: 'Weekly comp with your friends',
    color: '#ec4899',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
        <path d="M4 22h16" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
];

// 6s — Three glassmorphism feature cards fly in stagger
export const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerY = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const exit = interpolate(frame, [160, 180], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exit,
        flexDirection: 'column',
      }}
    >
      <h2
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 80,
          transform: `translateY(${(1 - headerY) * 40}px)`,
          opacity: headerY,
          letterSpacing: -2,
        }}
      >
        Everything in <span style={{ color: '#38bdf8' }}>one app</span>
      </h2>

      <div style={{ display: 'flex', gap: 50 }}>
        {FEATURES.map((f, i) => {
          const start = 15 + i * 12;
          const appear = spring({
            frame: frame - start,
            fps,
            config: { damping: 12, stiffness: 90 },
          });
          const y = (1 - appear) * 120;
          return (
            <div
              key={i}
              style={{
                width: 420,
                height: 460,
                borderRadius: 32,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${f.color}40`,
                padding: 48,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                transform: `translateY(${y}px) scale(${appear})`,
                opacity: appear,
                boxShadow: `0 0 80px ${f.color}30, inset 0 0 40px rgba(255,255,255,0.02)`,
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 32,
                  background: `linear-gradient(135deg, ${f.color}30, ${f.color}10)`,
                  border: `2px solid ${f.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 40,
                  color: f.color,
                  boxShadow: `0 0 60px ${f.color}60`,
                }}
              >
                <div style={{ width: 72, height: 72 }}>{f.icon}</div>
              </div>
              <h3
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: '#fff',
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 28,
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0,
                  lineHeight: 1.35,
                }}
              >
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
