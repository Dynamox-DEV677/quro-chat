import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 6s portfolio counter scene — shows a realistic trading P&L tick from
// ₹1,00,000 → ₹1,47,820 with a live candlestick chart, all in Quro green.
export const ReelCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const start = 100000;
  const end = 147820;
  // Ease the counter
  const value = Math.round(
    interpolate(frame, [10, 140], [start, end], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const formatted = '₹' + value.toLocaleString('en-IN');

  const pctValue = interpolate(frame, [10, 140], [0, 47.82], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });

  // Exit fade
  const exitOpacity = interpolate(frame, [165, 180], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Procedural candlestick data — deterministic
  const candles = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    const base = 100 + t * 48 + Math.sin(i * 0.8) * 6 + Math.cos(i * 1.4) * 4;
    const open = base;
    const close = base + (Math.sin(i * 1.7) + 0.3) * 5;
    const high = Math.max(open, close) + Math.abs(Math.sin(i * 2.3)) * 4;
    const low = Math.min(open, close) - Math.abs(Math.cos(i * 1.1)) * 4;
    return { open, close, high, low, up: close >= open };
  });

  const chartWidth = 880;
  const chartHeight = 520;
  const allHi = Math.max(...candles.map(c => c.high));
  const allLo = Math.min(...candles.map(c => c.low));
  const range = allHi - allLo || 1;
  const candleW = chartWidth / candles.length;
  const norm = (v: number) => chartHeight - ((v - allLo) / range) * chartHeight;

  // Reveal candles one by one
  const visibleCandles = Math.floor(interpolate(frame, [20, 130], [0, candles.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  return (
    <AbsoluteFill
      style={{
        opacity: exitOpacity,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        padding: 60,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          color: '#a0a0a8',
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity: labelOpacity,
          marginBottom: 16,
          transform: `translateY(${(1 - titleY) * 20}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Your Portfolio
      </div>

      {/* Counter */}
      <div
        style={{
          fontSize: 140,
          fontWeight: 900,
          color: '#f0f0f2',
          letterSpacing: -4,
          lineHeight: 1,
          opacity: labelOpacity,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {formatted}
      </div>

      {/* Pct gain pill */}
      <div
        style={{
          marginTop: 20,
          marginBottom: 60,
          padding: '16px 40px',
          borderRadius: 999,
          background: 'rgba(56,161,105,0.18)',
          border: '2px solid rgba(56,161,105,0.55)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity: labelOpacity,
        }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#3da87a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: '#3da87a',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          +{pctValue.toFixed(2)}%
        </div>
      </div>

      {/* Candlestick chart */}
      <div
        style={{
          width: chartWidth,
          height: chartHeight,
          position: 'relative',
          opacity: labelOpacity,
        }}
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <div
            key={p}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${p * 100}%`,
              borderTop: '1px dashed rgba(255,255,255,0.06)',
            }}
          />
        ))}

        {/* Candles */}
        <svg
          width={chartWidth}
          height={chartHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {candles.slice(0, visibleCandles).map((c, i) => {
            const x = i * candleW + candleW / 2;
            const bodyTop = norm(Math.max(c.open, c.close));
            const bodyBottom = norm(Math.min(c.open, c.close));
            const color = c.up ? '#3da87a' : '#e05050';
            return (
              <g key={i}>
                <line
                  x1={x}
                  x2={x}
                  y1={norm(c.high)}
                  y2={norm(c.low)}
                  stroke={color}
                  strokeWidth={2}
                />
                <rect
                  x={x - candleW * 0.35}
                  y={bodyTop}
                  width={candleW * 0.7}
                  height={Math.max(2, bodyBottom - bodyTop)}
                  fill={color}
                  rx={1}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
