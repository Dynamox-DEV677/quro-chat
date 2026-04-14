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

// 5.5s — CTA "Track. Analyze. Trade." + QURO + url
export const StocksCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });

  const headY = spring({ frame: frame - 15, fps, config: { damping: 15, stiffness: 90 } });
  const headOp = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const subY = spring({ frame: frame - 35, fps, config: { damping: 15, stiffness: 90 } });
  const subOp = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const btnScale = spring({ frame: frame - 55, fps, config: { damping: 10, stiffness: 120 } });
  const btnOp = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const urlOp = interpolate(frame, [85, 105], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const pulse = 0.7 + 0.3 * Math.abs(Math.sin(frame * 0.1));

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <div style={{
        width: 180, height: 180, borderRadius: 44, overflow: 'hidden',
        transform: `scale(${logoScale})`,
        boxShadow: `0 0 ${80 * pulse}px rgba(56,161,105,${0.5 * pulse})`,
        marginBottom: 28,
      }}>
        <Img src={staticFile('quro-icon.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div style={{
        fontSize: 160, fontWeight: 900, letterSpacing: -6, color: '#f0f0f2',
        transform: `scale(${logoScale})`, lineHeight: 1, marginBottom: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        QURO
      </div>

      <div style={{
        fontSize: 56, fontWeight: 700, color: '#f0f0f2', textAlign: 'center', letterSpacing: -1.5,
        transform: `translateY(${(1 - headY) * 30}px)`, opacity: headOp, lineHeight: 1.15,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Track. Analyze.
      </div>
      <div style={{
        fontSize: 56, fontWeight: 700, color: '#3da87a', textAlign: 'center', letterSpacing: -1.5,
        transform: `translateY(${(1 - subY) * 30}px)`, opacity: subOp, lineHeight: 1.15, marginBottom: 56,
        textShadow: '0 0 30px rgba(56,161,105,0.4)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Paper Trade.
      </div>

      <div style={{
        transform: `scale(${btnScale})`, opacity: btnOp, display: 'flex', alignItems: 'center', gap: 18,
        padding: '32px 72px', borderRadius: 999,
        background: 'linear-gradient(135deg, #38a169 0%, #3da87a 100%)',
        boxShadow: `0 0 ${80 * pulse}px rgba(56,161,105,${0.6 * pulse}), 0 20px 60px rgba(0,0,0,0.6)`,
        marginBottom: 48,
      }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: '#09090b', letterSpacing: -1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          Start Trading
        </span>
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      <div style={{
        fontSize: 56, fontWeight: 600, color: 'rgba(240,240,242,0.9)', letterSpacing: 2, opacity: urlOp,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        quro-9.com
      </div>
    </AbsoluteFill>
  );
};
