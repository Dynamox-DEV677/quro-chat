import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { ReelBackground } from './components/ReelBackground';
import { SettingsIntro } from './scenes/settings/SettingsIntro';
import { SettingsOverview } from './scenes/settings/SettingsOverview';
import { SettingsFeatures } from './scenes/settings/SettingsFeatures';
import { SettingsCTA } from './scenes/settings/SettingsCTA';

// 40s @ 30fps = 1200 frames — Settings system explainer
//
// Scene layout:
//   Intro          3.5s   105 frames
//   Overview       9.0s   270 frames  (real screenshot in phone)
//   Features       9.0s   270 frames  (6 feature rows)
//   CTA            5.5s   165 frames
// ──────────────────────────────
//   Subtotal      27.0s   810 frames
//   (padded to 1200 for breathing room with music)
export const QuroSettings: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b' }}>
      <ReelBackground />

      <Audio src={staticFile('calm-bg.mp3')} volume={0.18} />

      <Series>
        <Series.Sequence durationInFrames={105}>
          <SettingsIntro />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <SettingsOverview />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <SettingsFeatures />
        </Series.Sequence>

        <Series.Sequence durationInFrames={165}>
          <SettingsCTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
