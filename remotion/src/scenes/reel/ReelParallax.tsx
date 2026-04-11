import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 12s cinematic parallax tour through the REAL Quro landing page.
// Uses landing-full.png (1080x~8000 tall screenshot) and slowly
// pans down through problem / solution / features / leaderboard,
// with short text labels that fade in/out over each section.
//
// The source image has this rough structure (y offsets):
//   0        hero
//   1920     problem ("Trading is broken")
//   3000     solution
//   3900     features
//   5000     demo / leaderboard
//   6200     why quro
//   7200     CTA
export const ReelParallax: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Parallax scroll — move from top of landing-full to ~75% of the way down
  // across 360 frames. The image is ~8000 tall, reel is 1920 tall, so we
  // slide objectPosition-y from 0 to ~6000.
  const scrollY = interpolate(frame, [0, 360], [800, 6200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gentle scale pulse for subtle life
  const scale = interpolate(frame, [0, 360], [1.08, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Entrance / exit fades
  const imgOpacity = interpolate(
    frame,
    [0, 15, 345, 360],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Text labels per section (timed to match scroll position)
  const labels = [
    { text: 'Paper-trade real Indian stocks',   start: 20,  end: 110 },
    { text: 'Chat with fellow traders, live',   start: 110, end: 200 },
    { text: 'Climb the weekly leaderboard',     start: 200, end: 290 },
    { text: 'All in one place. No more tabs.',  start: 290, end: 360 },
  ];

  return (
    <AbsoluteFill>
      {/* The landing page image, panning downward */}
      <AbsoluteFill
        style={{
          opacity: imgOpacity,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile('landing-full.png')}
          style={{
            width: '100%',
            height: 'auto',
            position: 'absolute',
            left: 0,
            top: -scrollY,
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      {/* Darken overlay for readability */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,11,0.75) 0%, rgba(9,9,11,0.25) 40%, rgba(9,9,11,0.25) 60%, rgba(9,9,11,0.9) 100%)',
        }}
      />

      {/* Labels */}
      {labels.map((label, i) => (
        <LabelOverlay key={i} {...label} frame={frame} fps={fps} />
      ))}

      {/* Accent side stripe */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background:
            'linear-gradient(180deg, transparent 0%, #38a169 30%, #3da87a 70%, transparent 100%)',
          opacity: imgOpacity,
          boxShadow: '0 0 30px rgba(56,161,105,0.6)',
        }}
      />
    </AbsoluteFill>
  );
};

const LabelOverlay: React.FC<{
  text: string;
  start: number;
  end: number;
  frame: number;
  fps: number;
}> = ({ text, start, end, frame, fps }) => {
  const localFrame = frame - start;
  const duration = end - start;

  const entry = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const opacity = interpolate(
    frame,
    [start, start + 10, end - 15, end],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (frame < start - 5 || frame > end + 5) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 240,
      }}
    >
      <div
        style={{
          padding: '24px 48px',
          borderRadius: 999,
          background: 'rgba(9,9,11,0.85)',
          border: '2px solid rgba(56,161,105,0.5)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(56,161,105,0.35), 0 20px 60px rgba(0,0,0,0.6)',
          transform: `translateY(${(1 - entry) * 30}px)`,
          opacity,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#f0f0f2',
            letterSpacing: -1,
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
