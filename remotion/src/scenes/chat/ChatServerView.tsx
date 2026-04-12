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

// 9s — real chat screenshot: server channels + group chat + trade cards.
// Phone-frame presentation with label overlay.
export const ChatServerView: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title slide in
  const titleY = spring({ frame, fps, config: { damping: 16, stiffness: 100 } });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Screenshot entrance
  const imgScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 70 },
  });
  const imgOp = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Ken Burns zoom
  const zoom = interpolate(frame, [30, 270], [1.0, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Label 1: "Discord-style servers"
  const lab1Op = interpolate(frame, [60, 80, 140, 160], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lab1Y = spring({ frame: frame - 60, fps, config: { damping: 16, stiffness: 110 } });

  // Label 2: "Live trade cards in chat"
  const lab2Op = interpolate(frame, [160, 180, 240, 260], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lab2Y = spring({ frame: frame - 160, fps, config: { damping: 16, stiffness: 110 } });

  // Exit
  const exitOp = interpolate(frame, [255, 270], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      {/* Title */}
      <AbsoluteFill style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 80,
        zIndex: 10,
      }}>
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: '#f0f0f2',
          letterSpacing: -2,
          opacity: titleOp,
          transform: `translateY(${(1 - titleY) * 20}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
        }}>
          Group Chat <span style={{ color: '#3da87a' }}>+ Trading</span>
        </div>
      </AbsoluteFill>

      {/* Phone frame with screenshot */}
      <AbsoluteFill style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 120,
      }}>
        <div style={{
          width: 920,
          height: 1500,
          borderRadius: 36,
          border: '3px solid rgba(255,255,255,0.12)',
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 60px rgba(56,161,105,0.15)',
          transform: `scale(${imgScale * zoom})`,
          opacity: imgOp,
          background: '#09090b',
        }}>
          <Img
            src={staticFile('chat-full.png')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Floating labels */}
      <AbsoluteFill style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 180,
        zIndex: 10,
      }}>
        {/* Label 1 */}
        {frame >= 55 && frame <= 165 && (
          <div style={{
            padding: '20px 44px',
            borderRadius: 999,
            background: 'rgba(9,9,11,0.88)',
            border: '2px solid rgba(56,161,105,0.5)',
            boxShadow: '0 0 50px rgba(56,161,105,0.3), 0 20px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            opacity: lab1Op,
            transform: `translateY(${(1 - lab1Y) * 20}px)`,
          }}>
            <span style={{
              fontSize: 44,
              fontWeight: 700,
              color: '#f0f0f2',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              Discord-style servers 💬
            </span>
          </div>
        )}
        {/* Label 2 */}
        {frame >= 155 && (
          <div style={{
            padding: '20px 44px',
            borderRadius: 999,
            background: 'rgba(9,9,11,0.88)',
            border: '2px solid rgba(56,161,105,0.5)',
            boxShadow: '0 0 50px rgba(56,161,105,0.3), 0 20px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            opacity: lab2Op,
            transform: `translateY(${(1 - lab2Y) * 20}px)`,
          }}>
            <span style={{
              fontSize: 44,
              fontWeight: 700,
              color: '#f0f0f2',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              Live trade cards in chat 📈
            </span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
