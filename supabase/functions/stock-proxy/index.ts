// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Fetch a single stock's current price + change via v8 chart API (no auth needed)
async function fetchStockPrice(sym: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=5m&includePrePost=false`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const d = await r.json();
  const result = d.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta || {};
  const closes = (result.indicators?.quote?.[0]?.close || []).filter((c: any) => c !== null);
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose || meta.previousClose || (closes.length > 0 ? closes[0] : price);
  const chg = price - prev;
  const pct = prev ? (chg / prev) * 100 : 0;

  // Get high/low from today's candles
  const highs = (result.indicators?.quote?.[0]?.high || []).filter((v: any) => v !== null);
  const lows = (result.indicators?.quote?.[0]?.low || []).filter((v: any) => v !== null);
  const volumes = (result.indicators?.quote?.[0]?.volume || []).filter((v: any) => v !== null);
  const totalVol = volumes.reduce((a: number, b: number) => a + b, 0);

  return {
    symbol: sym,
    regularMarketPrice: price,
    regularMarketChange: chg,
    regularMarketChangePercent: pct,
    regularMarketDayHigh: highs.length ? Math.max(...highs) : price,
    regularMarketDayLow: lows.length ? Math.min(...lows) : price,
    regularMarketOpen: closes.length ? closes[0] : price,
    regularMarketVolume: totalVol,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price * 1.3,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price * 0.7,
    closes,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { action, symbols, symbol, range, interval } = await req.json();

    // ─── Action: quotes (batch — fetch each via v8 chart in parallel) ───
    if (action === "quotes" && symbols) {
      const symList = symbols.split(",").map((s: string) => s.trim()).filter(Boolean);
      // Fetch in parallel, batches of 10 to avoid overload
      const results: any[] = [];
      for (let i = 0; i < symList.length; i += 10) {
        const batch = symList.slice(i, i + 10);
        const batchResults = await Promise.allSettled(batch.map(fetchStockPrice));
        for (const r of batchResults) {
          if (r.status === "fulfilled" && r.value) results.push(r.value);
        }
      }
      return new Response(JSON.stringify({ ok: true, data: results }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ─── Action: chart (single symbol chart data) ───
    if (action === "chart" && symbol) {
      const r1 = range || "1d";
      const i1 = interval || "5m";
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r1}&interval=${i1}&includePrePost=false`;
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(`Yahoo returned ${r.status}`);
      const data = await r.json();
      const result = data.chart?.result?.[0];
      if (!result) throw new Error("No chart data");

      const closes = (result.indicators?.quote?.[0]?.close || []).filter((c: any) => c !== null);
      const meta = result.meta || {};
      return new Response(JSON.stringify({
        ok: true,
        closes,
        price: meta.regularMarketPrice,
        prev: meta.chartPreviousClose || meta.previousClose,
        currency: meta.currency,
      }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Invalid action. Use 'quotes' or 'chart'" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
