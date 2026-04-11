import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Player = {
  rank: number;
  name: string;
  pct: number;
  avatar: string;
  color: string;
};

const TOP3: Player[] = [
  { rank: 1, name: 'Dynamox', pct: 47.82, avatar: 'D', color: '#fbbf24' }, // gold
  { rank: 2, name: 'quro',    pct: 38.14, avatar: 'Q', color: '#cbd5e1' }, // silver
  { rank: 3, name: 'Arjun',   pct: 29.67, avatar: 'A', color: '#f97316' }, // bronze
];

// Podium order: silver(left), gold(center, taller), bronze(right)
const PODIUM = [TOP3[1], TOP3[0], TOP3[2]];
const PODIUM_HEIGHTS = [380, 520, 320];

// 6s — Live leaderboard podium
export const LeaderboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerY = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

  // Animated climbing % numbers
  const countProgress = interpolate(frame, [30, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
        padding: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          transform: `translateY(${(1 - headerY) * 40}px)`,
          opacity: headerY,
          marginBottom: 60,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 32px',
            borderRadius: 999,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow:
                '0 0 12px #ef4444, 0 0 24px rgba(239,68,68,0.6)',
            }}
          />
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 28, letterSpacing: 2 }}>
            LIVE LEADERBOARD
          </span>
        </div>
        <h2
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#fff',
            margin: 0,
            letterSpacing: -2,
          }}
        >
          Compete every week
        </h2>
      </div>

      {/* Podium */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40 }}>
        {PODIUM.map((p, i) => {
          const start = 25 + i * 10;
          const rise = spring({
            frame: frame - start,
            fps,
            config: { damping: 16, stiffness: 70, mass: 1.1 },
          });
          const h = PODIUM_HEIGHTS[i] * rise;
          const isGold = p.rank === 1;
          const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉';
          const animatedPct = p.pct * countProgress;

          return (
            <div
              key={p.rank}
              style={{
                width: 280,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Avatar + medal floats above */}
              <div
                style={{
                  opacity: rise,
                  transform: `translateY(${(1 - rise) * 20}px)`,
                  marginBottom: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 72, marginBottom: 10 }}>{medal}</div>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${p.color}, ${p.color}80)`,
                    border: `4px solid ${p.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 56,
                    fontWeight: 800,
                    color: '#fff',
                    boxShadow: `0 0 60px ${p.color}80`,
                    marginBottom: 16,
                  }}
                >
                  {p.avatar}
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color: '#22c55e',
                    marginTop: 8,
                    textShadow: '0 0 20px rgba(34,197,94,0.6)',
                  }}
                >
                  +{animatedPct.toFixed(2)}%
                </div>
              </div>

              {/* Podium block */}
              <div
                style={{
                  width: '100%',
                  height: h,
                  borderRadius: '20px 20px 0 0',
                  background: `linear-gradient(180deg, ${p.color}50, ${p.color}15)`,
                  border: `2px solid ${p.color}`,
                  borderBottom: 'none',
                  boxShadow: `0 0 60px ${p.color}40, inset 0 0 40px ${p.color}20`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: 20,
                }}
              >
                <div
                  style={{
                    fontSize: isGold ? 120 : 96,
                    fontWeight: 900,
                    color: p.color,
                    textShadow: `0 0 20px ${p.color}`,
                    lineHeight: 1,
                  }}
                >
                  {p.rank}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
