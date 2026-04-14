import React from 'react';
import { Composition } from 'remotion';
import { QuroPromo } from './QuroPromo';
import { QuroReel } from './QuroReel';
import { QuroChat } from './QuroChat';
import { GojoEdit } from './GojoEdit';
import { DynoReel } from './DynoReel';
import { QuroSettings } from './QuroSettings';
import { QuroStocks } from './QuroStocks';

// Vertical 9:16 videos for Instagram Reels / YouTube Shorts / TikTok.
// Uses real Quro brand colors (#09090b / #38a169 / #3da87a) and real
// screenshots from the Quro app via staticFile().
export const Root: React.FC = () => {
  return (
    <>
      {/* ──────────────────────────────────────────────────────── */}
      {/* DYNO'S HELP PROMO — 60s vertical reel                   */}
      {/* ──────────────────────────────────────────────────────── */}
      <Composition
        id="DynoReel"
        component={DynoReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ──────────────────────────────────────────────────────── */}
      {/* GOJO PHONK EDIT — 15s anime edit                         */}
      {/* ──────────────────────────────────────────────────────── */}
      <Composition
        id="GojoEdit"
        component={GojoEdit}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ──────────────────────────────────────────────────────── */}
      {/* CHAT PROMO — chat-system focused reel                    */}
      {/* ──────────────────────────────────────────────────────── */}
      <Composition
        id="QuroChat"
        component={QuroChat}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ──────────────────────────────────────────────────────── */}
      {/* MAIN REEL — landing-page focused reel                    */}
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
      {/* SETTINGS EXPLAINER — settings system promo               */}
      {/* ──────────────────────────────────────────────────────── */}
      <Composition
        id="QuroSettings"
        component={QuroSettings}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ──────────────────────────────────────────────────────── */}
      {/* STOCKS EXPLAINER — stock system promo                    */}
      {/* ──────────────────────────────────────────────────────── */}
      <Composition
        id="QuroStocks"
        component={QuroStocks}
        durationInFrames={1350}
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
