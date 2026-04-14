import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FEATURES = [
  { icon: '🎨', title: 'Dark & Light Mode', desc: 'Switch themes instantly' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Desktop + sound alerts' },
  { icon: '🔐', title: 'Password Security', desc: 'Change anytime, end-to-end' },
  { icon: '🖼️', title: 'Custom Banners', desc: '9+ premium backgrounds' },
  { icon: '✨', title: 'Name Styling', desc: 'Fonts, colors, effects' },
  { icon: '📧', title: 'Email Linking', desc: 'Link email to your profile' },
];

// 9s — Settings feature cards (staggered entrance)
export const SettingsFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const exitOp = interpolate(frame, [255, 270], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', opacity: exitOp }}>
      <div style={{
        fontSize: 64,
        fontWeight: 900,
        color: '#f0f0f2',
        letterSpacing: -2,
        marginBottom: 80,
        opacity: titleOp,
        transform: `translateY(${(1 - titleY) * 20}px)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}>
        Every Setting. <span style={{ color: '#3da87a' }}>Covered.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 900, paddingLeft: 40, paddingRight: 40 }}>
        {FEATURES.map((f, i) => {
          const delay = 20 + i * 22;
          const rowScale = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 100 } });
          const rowOp = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '28px 36px',
                borderRadius: 24,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                transform: `scale(${rowScale}) translateX(${(1 - rowScale) * 30}px)`,
                opacity: rowOp,
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{
                fontSize: 52,
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'rgba(56,161,105,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{
                  fontSize: 38,
                  fontWeight: 700,
                  color: '#f0f0f2',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                  {f.title}
                </div>
                <div style={{
                  fontSize: 28,
                  color: 'rgba(240,240,242,0.45)',
                  fontWeight: 500,
                  marginTop: 4,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                  {f.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
