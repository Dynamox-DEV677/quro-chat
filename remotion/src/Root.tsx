import React from 'react';
import { Composition } from 'remotion';
import { QuroPromo } from './QuroPromo';

// 30-second promo @ 30fps @ 1920x1080 (16:9 — great for YouTube / Twitter / landing page)
// Total: 900 frames
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="QuroPromo"
        component={QuroPromo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Vertical version for Instagram Reels / TikTok / Shorts — 9:16 */}
      <Composition
        id="QuroPromoVertical"
        component={QuroPromo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Square version for feed posts — 1:1 */}
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
