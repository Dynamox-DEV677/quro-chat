import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

// Quro uses near-black (#09090b) with a subtle green accent (#38a169).
// This background matches the real app's dark, minimalist vibe — no
// cyan or purple, just deep black with soft drifting green halos.
export const ReelBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow drifting green halos
  const haloY1 = 300 + Math.sin(frame * 0.01) * 80;
  const haloY2 = 1400 + Math.cos(frame * 0.008) * 100;

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b', overflow: 'hidden' }}>
      {/* Top green glow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: haloY1,
          transform: 'translate(-50%, -50%)',
          width: 1400,
          height: 1400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(56,161,105,0.18) 0%, rgba(56,161,105,0.06) 35%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Bottom green glow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: haloY2,
          transform: 'translate(-50%, -50%)',
          width: 1600,
          height: 1600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(61,168,122,0.14) 0%, rgba(61,168,122,0.04) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Faint grid lines for that "trading terminal" feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 85%)',
        }}
      />

      {/* Vignette edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
