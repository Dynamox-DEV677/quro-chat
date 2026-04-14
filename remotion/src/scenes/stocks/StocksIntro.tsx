import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 3.5s — Chart icon + "Real Stocks. Real Data." intro
export const StocksIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });

  // Animated candlestick bars rising
  const bar1H = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 80 } });
  const bar2H = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 80 } });
  const bar3H = spring({ frame: frame - 15, fps, config: { damping: 18, stiffness: 80 } });

  const l1Y = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 90 } });
  const l1Op = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const l2Y = spring({ frame: frame - 40, fps, config: { damping: 16, stiffness: 90 } });
  const l2Op = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const exitOp = interpolate(frame, [90, 105], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', opacity: exitOp }}>
      {/* Chart icon with animated bars */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: 52,
          background: 'linear-gradient(135deg, rgba(56,161,105,0.2) 0%, rgba(61,168,122,0.06) 100%)',
          border: '3px solid rgba(56,161,105,0.55)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 14,
          paddingBottom: 40,
          transform: `scale(${iconScale})`,
          boxShadow: '0 0 80px rgba(56,161,105,0.4)',
          marginBottom: 60,
        }}
      >
        <div style={{ width: 22, height: bar1H * 60, borderRadius: 6, background: '#3da87a' }} />
        <div style={{ width: 22, height: bar2H * 90, borderRadius: 6, background: '#38a169' }} />
        <div style={{ width: 22, height: bar3H * 50, borderRadius: 6, background: '#3da87a' }} />
        <div style={{ width: 22, height: bar2H * 75, borderRadius: 6, background: '#38a169' }} />
        <div style={{ width: 22, height: bar1H * 100, borderRadius: 6, background: '#3da87a' }} />
      </div>

      <div style={{
        fontSize: 72, fontWeight: 800, color: '#f0f0f2', textAlign: 'center',
        letterSpacing: -3, lineHeight: 1.1,
        transform: `translateY(${(1 - l1Y) * 30}px)`, opacity: l1Op,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Real Stocks.
      </div>

      <div style={{
        fontSize: 72, fontWeight: 800, color: '#3da87a', textAlign: 'center',
        letterSpacing: -3, lineHeight: 1.1, marginTop: 16,
        transform: `translateY(${(1 - l2Y) * 30}px)`, opacity: l2Op,
        textShadow: '0 0 40px rgba(56,161,105,0.5)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Real Data.
      </div>
    </AbsoluteFill>
  );
};
