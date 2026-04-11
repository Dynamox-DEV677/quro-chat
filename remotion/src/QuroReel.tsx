import React from 'react';
import { AbsoluteFill, Audio, Series } from 'remotion';
import { ReelBackground } from './components/ReelBackground';
import { ReelIntro } from './scenes/reel/ReelIntro';
import { ReelHero } from './scenes/reel/ReelHero';
import { ReelParallax } from './scenes/reel/ReelParallax';
import { ReelFeatures } from './scenes/reel/ReelFeatures';
import { ReelCounter } from './scenes/reel/ReelCounter';
import { ReelCTA } from './scenes/reel/ReelCTA';

// 40 seconds @ 30fps = 1200 frames
// Scene layout:
//   Intro       3.0s   90 frames
//   Hero        6.0s  180 frames
//   Parallax   12.0s  360 frames
//   Features    7.0s  210 frames
//   Counter     6.0s  180 frames
//   CTA         6.0s  180 frames
// ───────────────────────────────
//   Total      40.0s 1200 frames
export const QuroReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b' }}>
      {/* Always-on dark backdrop with subtle animated green glow */}
      <ReelBackground />

      <Series>
        <Series.Sequence durationInFrames={90}>
          <ReelIntro />
        </Series.Sequence>

        <Series.Sequence durationInFrames={180}>
          <ReelHero />
        </Series.Sequence>

        <Series.Sequence durationInFrames={360}>
          <ReelParallax />
        </Series.Sequence>

        <Series.Sequence durationInFrames={210}>
          <ReelFeatures />
        </Series.Sequence>

        <Series.Sequence durationInFrames={180}>
          <ReelCounter />
        </Series.Sequence>

        <Series.Sequence durationInFrames={180}>
          <ReelCTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
