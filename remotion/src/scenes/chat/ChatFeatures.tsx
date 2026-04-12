import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 9s — Chat-specific features: Reactions, Replies, Voice Calls,
// Trade Feed, Typing Indicators, Clickable $TICKER symbols.
export const ChatFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });

  const features = [
    { icon: '💬', text: 'Servers, channels & group chats', delay: 25 },
    { icon: '🔔', text: 'Clickable $TICKER in every message', delay: 50 },
    { icon: '📞', text: 'Voice & video calls', delay: 75 },
    { icon: '📊', text: 'Live trade feed in chat', delay: 100 },
    { icon: '🔥', text: 'Reactions, replies & emojis', delay: 125 },
    { icon: '📎', text: 'File, image & audio sharing', delay: 150 },
  ];

  const exitOp = interpolate(frame, [255, 270], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: exitOp, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 60 }}>
      {/* Title */}
      <div style={{
        fontSize: 80,
        fontWeight: 900,
        color: '#f0f0f2',
        letterSpacing: -3,
        textAlign: 'center',
        lineHeight: 1.1,
        marginBottom: 16,
        opacity: titleOp,
        transform: `translateY(${(1 - titleY) * 20}px)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Built for <span style={{ color: '#3da87a' }}>traders</span>
      </div>
      <div style={{
        fontSize: 36,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 60,
        opacity: titleOp,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Every feature designed around trading
      </div>

      {/* Feature rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        {features.map((f, i) => {
          const entryScale = spring({
            frame: frame - f.delay,
            fps,
            config: { damping: 14, stiffness: 90 },
          });
          const entryOp = interpolate(frame, [f.delay, f.delay + 15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '28px 36px',
                borderRadius: 22,
                background: 'linear-gradient(135deg, rgba(22,22,26,0.95) 0%, rgba(17,17,19,0.95) 100%)',
                border: '2px solid rgba(56,161,105,0.2)',
                transform: `translateX(${(1 - entryScale) * -120}px)`,
                opacity: entryOp,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'rgba(56,161,105,0.1)',
                border: '2px solid rgba(56,161,105,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div style={{
                fontSize: 40,
                fontWeight: 600,
                color: '#f0f0f2',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>
                {f.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
