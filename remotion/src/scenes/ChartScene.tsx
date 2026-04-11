import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 6s — Animated candlestick chart that draws itself, then line ticks up
// to a big P&L number
export const ChartScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerY = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

  // Build a deterministic bullish candle series (up trend)
  const candles = React.useMemo(() => {
    const arr: { o: number; h: number; l: number; c: number }[] = [];
    let price = 100;
    let seed = 77;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 40; i++) {
      const trendUp = i / 40;
      const o = price;
      const drift = (rnd() - 0.35) * 3 + trendUp * 0.4;
      const c = Math.max(50, o + drift);
      const wick = Math.abs(c - o) * (0.5 + rnd() * 0.8);
      const h = Math.max(o, c) + wick;
      const l = Math.min(o, c) - wick;
      arr.push({ o, h, l, c });
      price = c;
    }
    return arr;
  }, []);

  // Chart bounds
  const chartW = 1400;
  const chartH = 520;
  const candleW = chartW / candles.length;
  const allValues = candles.flatMap((c) => [c.h, c.l]);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV;

  // How many candles are revealed so far
  const revealProgress = interpolate(frame, [15, 120], [0, candles.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Animated portfolio value
  const startVal = 100000;
  const endVal = 147820;
  const valProgress = interpolate(frame, [30, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentVal = startVal + (endVal - startVal) * valProgress;
  const pctGain = ((currentVal - startVal) / startVal) * 100;

  const exit = interpolate(frame, [160, 180], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exit,
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - headerY) * 40}px)`,
          opacity: headerY,
          marginBottom: 30,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 12 }}>
          YOUR PORTFOLIO
        </div>
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: '#22c55e',
            textShadow: '0 0 40px rgba(34,197,94,0.6)',
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          ₹{Math.round(currentVal).toLocaleString('en-IN')}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#22c55e',
            marginTop: 8,
          }}
        >
          ▲ +{pctGain.toFixed(2)}%
        </div>
      </div>

      {/* Chart */}
      <svg width={chartW} height={chartH} style={{ marginTop: 20 }}>
        {candles.map((c, i) => {
          if (i >= revealProgress) return null;
          const partial = Math.min(1, revealProgress - i);
          const x = i * candleW + candleW / 2;
          const yOpen = ((maxV - c.o) / range) * chartH;
          const yClose = ((maxV - c.c) / range) * chartH;
          const yHigh = ((maxV - c.h) / range) * chartH;
          const yLow = ((maxV - c.l) / range) * chartH;
          const up = c.c >= c.o;
          const color = up ? '#22c55e' : '#ef4444';
          const bodyTop = Math.min(yOpen, yClose);
          const bodyH = Math.max(2, Math.abs(yClose - yOpen));

          return (
            <g key={i} opacity={partial}>
              {/* Wick */}
              <line
                x1={x}
                y1={yHigh}
                x2={x}
                y2={yLow}
                stroke={color}
                strokeWidth={1.5}
              />
              {/* Body */}
              <rect
                x={x - candleW * 0.35}
                y={bodyTop}
                width={candleW * 0.7}
                height={bodyH}
                fill={color}
                rx={1}
              />
            </g>
          );
        })}

        {/* Gradient trend line overlay */}
        <defs>
          <linearGradient id="trendLine" x1="0" x2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {revealProgress > 5 && (
          <polyline
            fill="none"
            stroke="url(#trendLine)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.6))' }}
            points={candles
              .slice(0, Math.floor(revealProgress))
              .map((c, i) => {
                const x = i * candleW + candleW / 2;
                const y = ((maxV - c.c) / range) * chartH;
                return `${x},${y}`;
              })
              .join(' ')}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
