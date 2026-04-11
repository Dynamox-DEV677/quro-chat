import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { Background } from './components/Background';
import { LogoIntro } from './scenes/LogoIntro';
import { Tagline } from './scenes/Tagline';
import { Features } from './scenes/Features';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { ChartScene } from './scenes/ChartScene';
import { CTA } from './scenes/CTA';

// 30s @ 30fps = 900 frames
// Scenes:
//   LogoIntro     0 -  75  ( 2.5s)
//   Tagline      75 - 210  ( 4.5s)
//   Features    210 - 390  ( 6.0s)
//   Leaderboard 390 - 570  ( 6.0s)
//   Chart       570 - 750  ( 6.0s)
//   CTA         750 - 900  ( 5.0s)
export const QuroPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={75}>
          <LogoIntro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={135}>
          <Tagline />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <Features />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <LeaderboardScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <ChartScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <CTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
