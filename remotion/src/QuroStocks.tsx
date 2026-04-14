import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { ReelBackground } from './components/ReelBackground';
import { StocksIntro } from './scenes/stocks/StocksIntro';
import { StocksListView } from './scenes/stocks/StocksListView';
import { StocksDetailView } from './scenes/stocks/StocksDetailView';
import { StocksFeatures } from './scenes/stocks/StocksFeatures';
import { StocksCTA } from './scenes/stocks/StocksCTA';

// 45s @ 30fps = 1350 frames — Stocks system explainer
//
// Scene layout:
//   Intro          3.5s   105 frames
//   List View      9.0s   270 frames  (stocks panel screenshot)
//   Detail View    9.0s   270 frames  (candlestick chart screenshot)
//   Features       9.0s   270 frames  (6 feature rows)
//   CTA            5.5s   165 frames
// ──────────────────────────────
//   Subtotal      36.0s  1080 frames
//   (padded to 1350 for music/breathing room)
export const QuroStocks: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b' }}>
      <ReelBackground />

      <Audio src={staticFile('calm-bg.mp3')} volume={0.18} />

      <Series>
        <Series.Sequence durationInFrames={105}>
          <StocksIntro />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <StocksListView />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <StocksDetailView />
        </Series.Sequence>

        <Series.Sequence durationInFrames={270}>
          <StocksFeatures />
        </Series.Sequence>

        <Series.Sequence durationInFrames={165}>
          <StocksCTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
