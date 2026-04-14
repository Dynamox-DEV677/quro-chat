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

// 9s — Stock detail view (candlestick chart) screenshot
export const StocksDetailView: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const imgScale = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 70 } });
  const imgOp = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zoom = interpolate(frame, [30, 270], [1.0, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const lab1Op = interpolate(frame, [60, 80, 150, 170], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lab1Y = spring({ frame: frame - 60, fps, config: { damping: 16, stiffness: 110 } });

  const lab2Op = interpolate(frame, [170, 190, 250, 270], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lab2Y = spring({ frame: frame - 170, fps, config: { damping: 16, stiffness: 110 } });

  const exitOp = interpolate(frame, [255, 270], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80, zIndex: 10 }}>
        <div style={{
          fontSize: 64, fontWeight: 900, color: '#f0f0f2', letterSpacing: -2,
          opacity: titleOp, transform: `translateY(${(1 - titleY) * 20}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif', textAlign: 'center',
        }}>
          Candlestick <span style={{ color: '#3da87a' }}>Charts</span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 120 }}>
        <div style={{
          width: 920, height: 1500, borderRadius: 36,
          border: '3px solid rgba(255,255,255,0.12)', overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 60px rgba(56,161,105,0.15)',
          transform: `scale(${imgScale * zoom})`, opacity: imgOp, background: '#09090b',
        }}>
          <Img src={staticFile('stocks-detail.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 180, zIndex: 10 }}>
        {frame >= 55 && frame <= 175 && (
          <div style={{
            padding: '20px 44px', borderRadius: 999, background: 'rgba(9,9,11,0.88)',
            border: '2px solid rgba(56,161,105,0.5)',
            boxShadow: '0 0 50px rgba(56,161,105,0.3), 0 20px 60px rgba(0,0,0,0.5)',
            opacity: lab1Op, transform: `translateY(${(1 - lab1Y) * 20}px)`,
          }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: '#f0f0f2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              OHLC candlesticks + volume 🕯️
            </span>
          </div>
        )}
        {frame >= 165 && (
          <div style={{
            padding: '20px 44px', borderRadius: 999, background: 'rgba(9,9,11,0.88)',
            border: '2px solid rgba(56,161,105,0.5)',
            boxShadow: '0 0 50px rgba(56,161,105,0.3), 0 20px 60px rgba(0,0,0,0.5)',
            opacity: lab2Op, transform: `translateY(${(1 - lab2Y) * 20}px)`,
          }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: '#f0f0f2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              1D to 1Y range + intervals ⏱️
            </span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
