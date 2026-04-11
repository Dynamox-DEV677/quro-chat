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

// 6s hero: real Quro landing page screenshot with Ken Burns zoom +
// overlay text. This is the "wow, that's the real app" moment.
export const ReelHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns zoom from 1.0 → 1.12 over the full scene
  const zoom = interpolate(frame, [0, 180], [1.02, 1.14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Entrance fade in
  const imgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline line 1: "Trade Together."
  const line1Y = spring({
    frame: frame - 25,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const line1Opacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline line 2: "Win Together."
  const line2Y = spring({
    frame: frame - 45,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const line2Opacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit fade
  const exitOpacity = interpolate(frame, [165, 180], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      {/* Real Quro landing page screenshot */}
      <AbsoluteFill
        style={{
          opacity: imgOpacity,
          transform: `scale(${zoom})`,
        }}
      >
        <Img
          src={staticFile('landing-hero.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      </AbsoluteFill>

      {/* Dark gradient overlay so the text is readable */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,11,0.3) 0%, rgba(9,9,11,0.6) 50%, rgba(9,9,11,0.95) 100%)',
        }}
      />

      {/* Overlay headline at the bottom third */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 280,
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: '#f0f0f2',
            letterSpacing: -4,
            lineHeight: 1,
            transform: `translateY(${(1 - line1Y) * 40}px)`,
            opacity: line1Opacity,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Trade Together.
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: '#3da87a',
            letterSpacing: -4,
            lineHeight: 1,
            marginTop: 10,
            transform: `translateY(${(1 - line2Y) * 40}px)`,
            opacity: line2Opacity,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '0 0 40px rgba(56,161,105,0.5)',
          }}
        >
          Win Together.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
