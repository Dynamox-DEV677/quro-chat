import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 7s feature showcase — 3 stacked cards, Quro black+green theme.
// Each card slides in sequentially and stays on screen together at the end.
export const ReelFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Section title
  const titleY = spring({ frame, fps, config: { damping: 18, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const features = [
    {
      icon: (
        <svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: 'Real-time Chat',
      body: 'Discord-style servers, DMs and voice calls.',
      delay: 25,
    },
    {
      icon: (
        <svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      title: 'Paper Trading',
      body: 'Live Indian stocks. Zero risk. Real charts.',
      delay: 55,
    },
    {
      icon: (
        <svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
      title: 'Global Leaderboard',
      body: 'Compete with traders worldwide, weekly.',
      delay: 85,
    },
  ];

  // Scene exit fade
  const exitOpacity = interpolate(frame, [195, 210], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: exitOpacity,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        padding: 60,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 88,
          fontWeight: 900,
          color: '#f0f0f2',
          letterSpacing: -3,
          marginBottom: 80,
          textAlign: 'center',
          lineHeight: 1,
          transform: `translateY(${(1 - titleY) * 30}px)`,
          opacity: titleOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Everything you need.
        <br />
        <span style={{ color: '#3da87a' }}>Nothing you don't.</span>
      </div>

      {/* Cards stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%' }}>
        {features.map((f, i) => (
          <FeatureCard key={i} {...f} frame={frame} fps={fps} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  delay: number;
  frame: number;
  fps: number;
}> = ({ icon, title, body, delay, frame, fps }) => {
  const slide = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 85 },
  });
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        padding: 48,
        borderRadius: 28,
        background:
          'linear-gradient(135deg, rgba(22,22,26,0.95) 0%, rgba(17,17,19,0.95) 100%)',
        border: '2px solid rgba(56,161,105,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 36,
        transform: `translateX(${(1 - slide) * -200}px)`,
        opacity,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(56,161,105,0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Icon box */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 20,
          background:
            'linear-gradient(135deg, rgba(56,161,105,0.18) 0%, rgba(56,161,105,0.04) 100%)',
          border: '2px solid rgba(56,161,105,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#f0f0f2',
            letterSpacing: -1.5,
            marginBottom: 12,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: '#a0a0a8',
            lineHeight: 1.35,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
};
