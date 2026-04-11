import React from 'react';
import { Composition } from 'remotion';
import { QuroPromo } from './QuroPromo';
import { QuroReel } from './QuroReel';

// 9:16 cinematic reel for Instagram Reels / YouTube Shorts / TikTok.
// 40 seconds at 30fps = 1200 frames.
// Uses real Quro brand colors (#09090b / #38a169 / #3da87a) and real
// screenshots from the Quro landing page via staticFile().
export const Root: React.FC = () => {
  return (
    <>
      {/* ──────────────────────────────────────────────────────── */}
      {/* PRIMARY — vertical cinematic reel (use this one)         */}
      {/* ──────────────────────────────────────────────────────── */}
      <Composition
        id="QuroReel"
        component={QuroReel}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ──────────────────────────────────────────────────────── */}
      {/* LEGACY — first draft promo (kept for reference)          */}
      {/* ──────────────────────────────────────────────────────── */}
      <Composition
        id="QuroPromo"
        component={QuroPromo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="QuroPromoVertical"
        component={QuroPromo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="QuroPromoSquare"
        component={QuroPromo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
