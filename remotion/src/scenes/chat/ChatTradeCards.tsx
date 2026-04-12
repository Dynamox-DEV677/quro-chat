import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 7s — Animated trade cards appearing as chat messages, showing the
// unique Quro feature: trade actions appear live in the chat feed.
export const ChatTradeCards: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });

  const trades = [
    { user: 'A', color: '#00F5A0,#4F8EF7', action: 'BUY', sym: 'INFY', name: 'Infosys Ltd', shares: 20, price: '₹1,468.75', total: '₹29,375', type: 'buy' as const, delay: 30 },
    { user: 'R', color: '#FFD93D,#FF9130', action: 'BUY', sym: 'TCS', name: 'TCS Ltd', shares: 10, price: '₹3,890.50', total: '₹38,905', type: 'buy' as const, delay: 70 },
    { user: 'V', color: '#38bdf8,#22d3ee', action: 'SELL', sym: 'RELIANCE', name: 'Reliance Industries', shares: 15, price: '₹2,840.50', total: '+₹1,420', type: 'sell' as const, delay: 110 },
    { user: 'P', color: '#A855F7,#EC4899', action: 'BUY', sym: 'HDFC', name: 'HDFC Bank', shares: 25, price: '₹1,620.30', total: '₹40,508', type: 'buy' as const, delay: 150 },
  ];

  const exitOp = interpolate(frame, [195, 210], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: exitOp, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 50 }}>
      {/* Title */}
      <div style={{
        fontSize: 68,
        fontWeight: 900,
        color: '#f0f0f2',
        letterSpacing: -2,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 1.1,
        opacity: titleOp,
        transform: `translateY(${(1 - titleY) * 20}px)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Every trade is <span style={{ color: '#3da87a' }}>shared</span>
      </div>
      <div style={{
        fontSize: 36,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 60,
        opacity: titleOp,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Live in the chat feed
      </div>

      {/* Trade cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
        {trades.map((t, i) => (
          <TradeCard key={i} {...t} frame={frame} fps={fps} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const TradeCard: React.FC<{
  user: string;
  color: string;
  action: string;
  sym: string;
  name: string;
  shares: number;
  price: string;
  total: string;
  type: 'buy' | 'sell';
  delay: number;
  frame: number;
  fps: number;
}> = ({ user, color, action, sym, name, shares, price, total, type, delay, frame, fps }) => {
  const slide = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const isBuy = type === 'buy';
  const accentColor = isBuy ? '#3da87a' : '#e05050';
  const accentDim = isBuy ? 'rgba(61,168,122,0.12)' : 'rgba(224,80,80,0.12)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '28px 32px',
      borderRadius: 24,
      background: 'rgba(17,17,19,0.95)',
      border: `2px solid rgba(255,255,255,0.07)`,
      borderLeft: `5px solid ${accentColor}`,
      transform: `translateY(${(1 - slide) * 60}px)`,
      opacity: op,
      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 26,
        color: '#fff',
        flexShrink: 0,
      }}>
        {user}
      </div>

      {/* Badge */}
      <div style={{
        padding: '8px 16px',
        borderRadius: 10,
        background: accentDim,
        color: accentColor,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 1,
        flexShrink: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {action}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
        }}>
          <span style={{ fontWeight: 700, fontSize: 28, color: '#f0f0f2', letterSpacing: 0.5, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{sym}</span>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.34)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{name}</span>
        </div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {shares} shares @ {price}
        </div>
      </div>

      {/* Total */}
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: type === 'sell' ? '#3da87a' : '#f0f0f2',
        flexShrink: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {total}
      </div>
    </div>
  );
};
