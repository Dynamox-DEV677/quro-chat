import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { ReelBackground } from './components/ReelBackground';
import { ChatIntro } from './scenes/chat/ChatIntro';
import { ChatServerView } from './scenes/chat/ChatServerView';
import { ChatDMView } from './scenes/chat/ChatDMView';
import { ChatTradeCards } from './scenes/chat/ChatTradeCards';
import { ChatFeatures } from './scenes/chat/ChatFeatures';
import { ChatCTA } from './scenes/chat/ChatCTA';

// 45 seconds @ 30fps = 1350 frames
// Chat-focused promo for IG Reels / YT Shorts
//
// Scene layout:
//   Intro          3.5s   105 frames
//   Server View    8.0s   240 frames   (real chat screenshot)
//   DM View        8.0s   240 frames   (real DM screenshot)
//   Trade Cards    7.0s   210 frames   (trades appearing in chat)
//   Features       8.0s   240 frames   (chat features callout)
//   CTA            5.5s   165 frames
// ──────────────────────────────────────
//   Total         40.0s  1200 frames (kept same for consistency)
//
// Update: going with 1350 (45s) for more breathing room
export const QuroChat: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b' }}>
      <ReelBackground />

      <Series>
        <Series.Sequence durationInFrames={105}>
          <ChatIntro />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <ChatServerView />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <ChatDMView />
        </Series.Sequence>

        <Series.Sequence durationInFrames={210}>
          <ChatTradeCards />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <ChatFeatures />
        </Series.Sequence>

        <Series.Sequence durationInFrames={225}>
          <ChatCTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
