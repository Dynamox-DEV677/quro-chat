// ═══════════════════════════════════════
// Paper Trading Terminal — Full Rewrite
// ═══════════════════════════════════════
import { sb } from './config.js';
import { ME } from './state.js';
import { STK_STOCKS, stk_simPts, stk_fmtIN, drawCandlestick, attachCrosshair } from './stocks.js';
import { escH, notify } from './utils.js';
import { qConfirm } from './modal.js';

// ─── Module state ───
export var trdPrices = {};
export var trdHistory = {};
var trdPortfolio = { cash: 100000, holdings: {} };
var trdSelected = null;
var trdTab = 'buy';
var trdBottomMode = 'hold';
var trdTickerInt = null;
var trdWlFilter = '';
var _pendingOrder = null;
var _portfolioLoaded = false;

// Expose for cross-module access (stocks.js live refresh)
window.trdPrices = trdPrices;
window.trdHistory = trdHistory;

// ─── Init prices from simulated base ───
export function trd_initPrices() {
  STK_STOCKS.forEach(function(stk) {
    var pts = stk_simPts(stk.b, 80);
    trdPrices[stk.s] = { price: pts[pts.length - 1], prev: pts[0], name: stk.n, sec: stk.sec, base: stk.b };
    trdHistory[stk.s] = pts.slice();
  });
}

// ─── Live ticker (updates every 1.2s) ───
export function trd_startTicker() {
  trd_initPrices();
  trdTickerInt = setInterval(function() {
    STK_STOCKS.forEach(function(stk) {
      var p = trdPrices[stk.s];
      if (!p) return;
      var delta = p.price * (Math.random() - 0.495) * 0.007;
      p.price = Math.max(p.base * 0.4, p.price + delta);
      var hist = trdHistory[stk.s];
      hist.push(p.price);
      if (hist.length > 80) hist.shift();
    });
    trd_renderWatchlist();
    if (trdSelected) {
      trd_updateStockHd(trdSelected);
      trd_updateOrder();
      trd_drawChart();
      trd_drawMiniChart();
    }
    trd_updateSummary();
    if (trdBottomMode === 'hold') trd_renderHoldingsLive();
  }, 1200);
}

export function trd_stopTicker() {
  if (trdTickerInt) { clearInterval(trdTickerInt); trdTickerInt = null; }
}

// ─── Open / Close ───
export function openTradingPage() {
  document.getElementById('tradingPage').classList.add('open');
  document.body.classList.add('trading-open');
  var srvBtn = document.getElementById('srvTradingBtn');
  if (srvBtn) srvBtn.classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navBtn = document.getElementById('navTrading');
  if (navBtn) navBtn.classList.add('active');
  if (!trdTickerInt) trd_startTicker();
  trd_loadPortfolio();
}

export function closeTradingPage() {
  document.getElementById('tradingPage').classList.remove('open');
  document.body.classList.remove('trading-open');
  var srvBtn = document.getElementById('srvTradingBtn');
  if (srvBtn) srvBtn.classList.remove('active');
  trd_stopTicker();
  if (window.appMode === 'home') {
    document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
    var navHome = document.getElementById('navHome');
    if (navHome) navHome.classList.add('active');
  }
}

// ─── Load portfolio from Supabase ───
export async function trd_loadPortfolio() {
  if (!ME || !ME.id) return;
  try {
    // Load cash balance
    var res = await sb.from('stock_portfolios').select('*').eq('user_id', ME.id).single();
    if (res.error && res.error.code === 'PGRST116') {
      // No portfolio row — create default
      await sb.from('stock_portfolios').insert({ user_id: ME.id, cash_balance: 100000 });
      trdPortfolio.cash = 100000;
    } else if (res.error) {
      console.warn('[Quro] portfolio load:', res.error.message);
      trdPortfolio.cash = 100000;
    } else {
      trdPortfolio.cash = parseFloat(res.data.cash_balance) || 100000;
    }

    // Load holdings
    var hRes = await sb.from('stock_holdings').select('*').eq('user_id', ME.id);
    trdPortfolio.holdings = {};
    if (hRes.data) {
      hRes.data.forEach(function(h) {
        var shares = parseFloat(h.shares);
        if (shares > 0) {
          trdPortfolio.holdings[h.symbol] = { shares: shares, avgPrice: parseFloat(h.avg_buy_price) };
        }
      });
    }
    _portfolioLoaded = true;
  } catch (e) {
    console.warn('[Quro] portfolio load failed:', e.message);
    trdPortfolio.cash = 100000;
    trdPortfolio.holdings = {};
  }
  trd_updateSummary();
  trd_renderWatchlist();
  trd_renderBottom();
}

// ─── Portfolio summary (top bar stats) ───
export function trd_updateSummary() {
  var invested = 0, curVal = 0;
  Object.keys(trdPortfolio.holdings).forEach(function(sym) {
    var h = trdPortfolio.holdings[sym];
    if (!h || h.shares <= 0) return;
    var p = trdPrices[sym];
    var cur = p ? p.price : h.avgPrice;
    invested += h.shares * h.avgPrice;
    curVal += h.shares * cur;
  });
  var pnl = curVal - invested;
  var total = trdPortfolio.cash + curVal;
  var pnlPct = invested > 0 ? (pnl / invested * 100) : 0;
  var up = pnl >= 0;

  var totalStr = '\u20B9' + stk_fmtIN(total);
  var cashStr = '\u20B9' + stk_fmtIN(trdPortfolio.cash);
  var investedStr = '\u20B9' + stk_fmtIN(curVal);
  var pnlStr = pnl === 0 ? '\u20B90' : (up ? '+' : '') + '\u20B9' + stk_fmtIN(Math.abs(pnl)) + ' (' + (up ? '+' : '') + pnlPct.toFixed(2) + '%)';
  var pnlCls = pnl === 0 ? '' : (up ? 'up' : 'down');

  // Top bar stats
  _setText('trdTotalVal', totalStr);
  _setText('trdCash', cashStr);
  _setText('trdInvested', investedStr);
  var pnlEl = document.getElementById('trdPnL');
  if (pnlEl) { pnlEl.textContent = pnlStr; pnlEl.className = 'trd-ts-val ' + pnlCls; }

  // Order panel portfolio card (always visible)
  _setText('trdPcTotal', totalStr);
  _setText('trdPcCash', cashStr);
  _setText('trdPcInvested', investedStr);
  var pcPnl = document.getElementById('trdPcPnl');
  if (pcPnl) { pcPnl.textContent = pnlStr; pcPnl.className = 'trd-pc-val ' + pnlCls; }
}

// ─── Watchlist ───
export function trd_renderWatchlist() {
  var list = document.getElementById('trdWatchlist');
  if (!list) return;
  var filter = trdWlFilter;
  var stocks = filter ? STK_STOCKS.filter(function(s) {
    return s.n.toLowerCase().includes(filter) || s.s.toLowerCase().includes(filter);
  }) : STK_STOCKS;

  list.innerHTML = stocks.map(function(stk) {
    var p = trdPrices[stk.s];
    if (!p) return '';
    var chg = p.price - p.prev;
    var pct = (chg / p.prev * 100);
    var up = chg >= 0;
    var held = trdPortfolio.holdings[stk.s] && trdPortfolio.holdings[stk.s].shares > 0;
    var active = trdSelected === stk.s;
    return '<div class="trd-wl-item' + (active ? ' active' : '') + '" onclick="trd_select(\'' + stk.s + '\')">' +
      '<div class="trd-wl-left">' +
      '<div class="trd-wl-sym">' + escH(stk.s) + (held ? '<span class="held-dot"></span>' : '') + '</div>' +
      '<div class="trd-wl-name">' + escH(stk.n) + '</div></div>' +
      '<div class="trd-wl-right">' +
      '<div class="trd-wl-price">\u20B9' + stk_fmtIN(p.price) + '</div>' +
      '<div class="trd-wl-chg ' + (up ? 'up' : 'down') + '">' + (up ? '+' : '') + pct.toFixed(2) + '%</div></div></div>';
  }).join('');
}

var _wlFilterTimer = 0;
export function trd_filterWatch(q) {
  clearTimeout(_wlFilterTimer);
  _wlFilterTimer = setTimeout(function() {
    trdWlFilter = q.trim().toLowerCase();
    trd_renderWatchlist();
  }, 120);
}

// ─── Select stock ───
export function trd_select(sym) {
  trdSelected = sym;
  document.getElementById('trdNoSelect').style.display = 'none';
  var hd = document.getElementById('trdStockHd');
  if (hd) hd.style.display = '';
  // Toggle has-stock class on center panel (controls mobile layout)
  var center = document.querySelector('.trd-center');
  if (center) center.classList.add('has-stock');
  trd_renderWatchlist();
  trd_updateStockHd(sym);
  trd_updateOrder();
  trd_drawChart();
  trd_drawMiniChart();
}

export function trd_updateStockHd(sym) {
  var p = trdPrices[sym];
  if (!p) return;
  var chg = p.price - p.prev;
  var pct = (chg / p.prev * 100);
  var up = chg >= 0;
  var stk = _findStock(sym);

  _setText('trdStockName', p.name);
  _setText('trdStockMeta', (stk ? stk.sec : '') + ' \xB7 NSE \xB7 Simulated');
  _setText('trdStockPrice', '\u20B9' + stk_fmtIN(p.price));

  var chgEl = document.getElementById('trdStockChg');
  if (chgEl) {
    chgEl.textContent = (up ? '\u25B2 +' : '\u25BC ') + Math.abs(chg).toFixed(2) + ' (' + (up ? '+' : '') + pct.toFixed(2) + '%)';
    chgEl.className = 'trd-stock-chg ' + (up ? 'up' : 'down');
  }

  // Holdings strip
  var h = trdPortfolio.holdings[sym];
  var strip = document.getElementById('trdHeldStrip');
  if (!strip) return;
  if (h && h.shares > 0) {
    var cur = h.shares * p.price, buy = h.shares * h.avgPrice, pl = cur - buy, pu = pl >= 0;
    strip.innerHTML =
      '<span>Holding: <b>' + h.shares + ' shares</b></span>' +
      '<span>Avg: <b>\u20B9' + stk_fmtIN(h.avgPrice) + '</b></span>' +
      '<span>P&L: <b style="color:' + (pu ? 'var(--success)' : 'var(--error)') + '">' + (pu ? '+' : '') + '\u20B9' + stk_fmtIN(Math.abs(pl)) + '</b></span>';
    strip.style.display = '';
  } else {
    strip.style.display = 'none';
  }
}

// ─── Candlestick chart ───
export function trd_drawChart() {
  var cv = document.getElementById('trdChart');
  var pts = trdHistory[trdSelected] || [];
  if (!cv || pts.length < 2) return;

  // Build OHLC candles from price history
  var candles = [];
  var now = Math.floor(Date.now() / 1000);
  for (var i = 0; i < pts.length; i++) {
    var o = i > 0 ? pts[i - 1] : pts[i];
    var c = pts[i];
    var h = Math.max(o, c) * (1 + Math.random() * 0.002);
    var l = Math.min(o, c) * (1 - Math.random() * 0.002);
    var p = trdPrices[trdSelected];
    var base = p ? p.price : 1000;
    var v = Math.floor((0.3 + Math.random() * 0.7) * base * 150);
    candles.push({ o: o, h: h, l: l, c: c, v: v, t: now - (pts.length - i) * 90 });
  }
  drawCandlestick(cv, candles);
  attachCrosshair(cv);
}

// ─── Order panel ───
export function trd_setTab(tab) {
  trdTab = tab;
  var buyTab = document.getElementById('trdBuyTab');
  var sellTab = document.getElementById('trdSellTab');
  if (buyTab) buyTab.classList.toggle('active', tab === 'buy');
  if (sellTab) sellTab.classList.toggle('active', tab === 'sell');
  // Reset quantity on tab switch
  var qtyInput = document.getElementById('trdQtyInput');
  if (qtyInput) qtyInput.value = '1';
  trd_updateOrder();
}

export function trd_setQty(n) {
  var el = document.getElementById('trdQtyInput');
  if (el) el.value = n;
  trd_updateOrder();
}

export function trd_setMax() {
  if (!trdSelected) return;
  var p = trdPrices[trdSelected];
  if (!p) return;
  var el = document.getElementById('trdQtyInput');
  if (!el) return;
  if (trdTab === 'buy') {
    el.value = Math.max(1, Math.floor(trdPortfolio.cash / p.price));
  } else {
    var h = trdPortfolio.holdings[trdSelected];
    el.value = h ? Math.floor(h.shares) : 0;
  }
  trd_updateOrder();
}

export function trd_updateOrder() {
  var btn = document.getElementById('trdExecBtn');
  if (!btn) return;

  if (!trdSelected) {
    btn.textContent = 'Select a stock';
    btn.disabled = true;
    btn.className = 'trd-exec-btn';
    return;
  }

  var p = trdPrices[trdSelected];
  if (!p) return;
  var qty = parseFloat(document.getElementById('trdQtyInput')?.value) || 0;
  var total = qty * p.price;

  _setText('trdOPrice', '\u20B9' + stk_fmtIN(p.price));
  _setText('trdOTotal', qty > 0 ? '\u20B9' + stk_fmtIN(total) : '\u2014');

  if (trdTab === 'buy') {
    _setText('trdOAvail', '\u20B9' + stk_fmtIN(trdPortfolio.cash));
    var ok = qty > 0 && total <= trdPortfolio.cash;
    btn.textContent = 'Buy ' + qty + ' ' + p.name;
    btn.disabled = !ok;
    btn.className = 'trd-exec-btn' + (ok ? ' trd-exec-buy' : '');
  } else {
    var h = trdPortfolio.holdings[trdSelected];
    var held = h ? h.shares : 0;
    _setText('trdOAvail', held + ' shares held');
    var ok = qty > 0 && qty <= held;
    btn.textContent = 'Sell ' + qty + ' ' + p.name;
    btn.disabled = !ok;
    btn.className = 'trd-exec-btn' + (ok ? ' trd-exec-sell' : '');
  }
}

// ─── Order confirmation ───
function showTrdConfirm(action, symbol, shares, price) {
  _pendingOrder = { action: action, symbol: symbol, shares: shares, price: price };

  var actionEl = document.getElementById('trdConfirmAction');
  if (actionEl) {
    actionEl.textContent = action.toUpperCase();
    actionEl.style.color = action === 'buy' ? 'var(--success)' : 'var(--error)';
  }
  _setText('trdConfirmSymbol', symbol);
  _setText('trdConfirmShares', shares.toString());
  _setText('trdConfirmPrice', '\u20B9' + price.toLocaleString('en-IN'));
  _setText('trdConfirmTotal', '\u20B9' + (shares * price).toLocaleString('en-IN'));

  var execBtn = document.getElementById('trdConfirmExec');
  if (execBtn) {
    execBtn.textContent = 'Confirm ' + (action === 'buy' ? 'Buy' : 'Sell');
    execBtn.className = 'trd-confirm-exec ' + action;
  }

  var overlay = document.getElementById('trdConfirmOverlay');
  if (overlay) overlay.classList.add('open');
}

export function closeTrdConfirm() {
  var overlay = document.getElementById('trdConfirmOverlay');
  if (overlay) overlay.classList.remove('open');
  _pendingOrder = null;
}

export function confirmTrdExec() {
  if (!_pendingOrder) return;
  var order = _pendingOrder;
  closeTrdConfirm();
  _doExecuteTrade(order.action, order.symbol, order.shares, order.price);
}

// ─── Execute trade (button click -> show confirm) ───
export function trd_execute() {
  if (!trdSelected || !ME) return;
  var p = trdPrices[trdSelected];
  if (!p) return;
  var qty = parseFloat(document.getElementById('trdQtyInput')?.value) || 0;
  if (qty <= 0) { notify('Enter a valid quantity', 'error'); return; }
  var total = qty * p.price;

  // Pre-validate
  if (trdTab === 'buy' && total > trdPortfolio.cash) {
    notify('Insufficient funds — you need \u20B9' + stk_fmtIN(total - trdPortfolio.cash) + ' more', 'error');
    return;
  }
  if (trdTab === 'sell') {
    var h = trdPortfolio.holdings[trdSelected];
    if (!h || qty > h.shares) {
      notify('Not enough shares to sell', 'error');
      return;
    }
  }

  showTrdConfirm(trdTab, trdSelected, qty, p.price);
}

// ─── Actual trade execution (after confirm) ───
async function _doExecuteTrade(action, symbol, shares, price) {
  if (!ME || !ME.id) { notify('Not logged in', 'error'); return; }
  var p = trdPrices[symbol];
  if (!p) { notify('Stock data not available', 'error'); return; }

  var total = shares * price;
  var stk = _findStock(symbol);
  var btn = document.getElementById('trdExecBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing\u2026'; }

  try {
    if (action === 'buy') {
      if (total > trdPortfolio.cash) { notify('Insufficient funds!', 'error'); trd_updateOrder(); return; }
      // Update local state
      trdPortfolio.cash -= total;
      var h = trdPortfolio.holdings[symbol];
      if (h && h.shares > 0) {
        var ns = h.shares + shares;
        var na = (h.shares * h.avgPrice + shares * price) / ns;
        trdPortfolio.holdings[symbol] = { shares: ns, avgPrice: na };
      } else {
        trdPortfolio.holdings[symbol] = { shares: shares, avgPrice: price };
      }
      notify('Bought ' + shares + ' x ' + p.name + ' @ \u20B9' + stk_fmtIN(price), 'success');
    } else {
      var h = trdPortfolio.holdings[symbol];
      if (!h || shares > h.shares) { notify('Not enough shares', 'error'); trd_updateOrder(); return; }
      // Update local state
      trdPortfolio.cash += total;
      var remaining = h.shares - shares;
      if (remaining <= 0.0001) {
        delete trdPortfolio.holdings[symbol];
      } else {
        trdPortfolio.holdings[symbol] = { shares: remaining, avgPrice: h.avgPrice };
      }
      // Calculate profit for notification
      var profit = (price - h.avgPrice) * shares;
      var profitUp = profit >= 0;
      notify('Sold ' + shares + ' x ' + p.name + ' — ' + (profitUp ? 'Profit' : 'Loss') + ' \u20B9' + stk_fmtIN(Math.abs(profit)), profitUp ? 'success' : 'error');
    }

    // Save to database
    await _saveToDb(symbol, action, shares, price, total, stk ? stk.n : symbol);
  } catch (e) {
    console.error('[Quro Trade]', e);
    notify('Trade executed locally — DB sync failed', 'error');
  }

  // Refresh all UI
  trd_updateSummary();
  trd_renderWatchlist();
  trd_updateStockHd(symbol);
  trd_updateOrder();
  trd_renderBottom();
}

// ─── Save trade to Supabase ───
async function _saveToDb(sym, type, shares, price, total, stockName) {
  if (!ME || !ME.id) return;

  // 1. Save cash balance
  var r1 = await sb.from('stock_portfolios').upsert(
    { user_id: ME.id, cash_balance: trdPortfolio.cash, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (r1.error) console.warn('[Quro] portfolio save:', r1.error.message);

  // 2. Save or delete holding
  var h = trdPortfolio.holdings[sym];
  if (h && h.shares > 0) {
    var r2 = await sb.from('stock_holdings').upsert(
      { user_id: ME.id, symbol: sym, shares: h.shares, avg_buy_price: h.avgPrice, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,symbol' }
    );
    if (r2.error) console.warn('[Quro] holding save:', r2.error.message);
  } else {
    var r3 = await sb.from('stock_holdings').delete().eq('user_id', ME.id).eq('symbol', sym);
    if (r3.error) console.warn('[Quro] holding delete:', r3.error.message);
  }

  // 3. Record transaction
  var r4 = await sb.from('stock_transactions').insert({
    user_id: ME.id, symbol: sym, stock_name: stockName,
    type: type, shares: shares, price: price, total: total
  });
  if (r4.error) console.warn('[Quro] transaction save:', r4.error.message);
}

// ─── Bottom panel ───
export function trd_showBottom(mode) {
  trdBottomMode = mode;
  var holdTab = document.getElementById('trdHoldTab');
  var histTab = document.getElementById('trdHistTab');
  if (holdTab) holdTab.classList.toggle('active', mode === 'hold');
  if (histTab) histTab.classList.toggle('active', mode === 'hist');
  trd_renderBottom();
}

export function trd_renderBottom() {
  if (trdBottomMode === 'hold') trd_renderHoldingsLive();
  else trd_renderHistory();
}

export function trd_renderHoldingsLive() {
  if (trdBottomMode !== 'hold') return;
  var body = document.getElementById('trdBottomBody');
  if (!body) return;
  var syms = Object.keys(trdPortfolio.holdings).filter(function(s) { return trdPortfolio.holdings[s].shares > 0; });

  if (!syms.length) {
    body.innerHTML = '<div class="trd-empty-msg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>No holdings yet. Pick a stock and buy!</div>';
    return;
  }

  var header = '<div class="trd-hold-header"><span>Stock</span><span>Qty</span><span>Value</span><span>P&L</span></div>';
  body.innerHTML = header + syms.map(function(sym) {
    var h = trdPortfolio.holdings[sym];
    var p = trdPrices[sym];
    var cur = p ? p.price : h.avgPrice;
    var curVal = h.shares * cur, buyVal = h.shares * h.avgPrice;
    var pnl = curVal - buyVal, pnlPct = buyVal > 0 ? (pnl / buyVal * 100) : 0, up = pnl >= 0;
    var stk = _findStock(sym);
    return '<div class="trd-hold-item" onclick="trd_select(\'' + sym + '\')">' +
      '<div><div class="trd-hold-name">' + escH(stk ? stk.n : sym) + '</div>' +
      '<div class="trd-hold-sub">' + escH(sym) + ' \xB7 Avg \u20B9' + stk_fmtIN(h.avgPrice) + '</div></div>' +
      '<div class="trd-hold-qty">' + h.shares.toFixed(h.shares % 1 === 0 ? 0 : 2) + '</div>' +
      '<div class="trd-hold-val">\u20B9' + stk_fmtIN(curVal) + '</div>' +
      '<div class="trd-hold-pnl ' + (up ? 'up' : 'down') + '">' + (up ? '+' : '') + '\u20B9' + stk_fmtIN(Math.abs(pnl)) + '<br><span style="font-size:8px">' + (up ? '+' : '') + pnlPct.toFixed(2) + '%</span></div></div>';
  }).join('');
}

export async function trd_renderHistory() {
  var body = document.getElementById('trdBottomBody');
  if (!body) return;
  if (!ME || !ME.id) { body.innerHTML = '<div class="trd-empty-msg">Not logged in</div>'; return; }

  body.innerHTML = '<div class="trd-empty-msg" style="font-size:9px;letter-spacing:1px;padding:var(--sp-4)">LOADING\u2026</div>';

  try {
    var res = await sb.from('stock_transactions').select('*').eq('user_id', ME.id).order('created_at', { ascending: false }).limit(50);
    var txns = res.data || [];

    if (!txns.length) {
      body.innerHTML = '<div class="trd-empty-msg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>No transactions yet</div>';
      return;
    }

    body.innerHTML = txns.map(function(t) {
      var isBuy = t.type === 'buy';
      var d = new Date(t.created_at);
      var ts = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return '<div class="trd-hist-item">' +
        '<div class="trd-hist-badge ' + (isBuy ? 'buy' : 'sell') + '">' + (isBuy ? 'B' : 'S') + '</div>' +
        '<div class="trd-hist-info"><div class="trd-hist-name">' + escH(t.stock_name || t.symbol) + ' \xD7 ' + t.shares + '</div>' +
        '<div class="trd-hist-sub">@ \u20B9' + stk_fmtIN(t.price) + ' \xB7 ' + ts + '</div></div>' +
        '<div class="trd-hist-amt ' + (isBuy ? 'buy' : 'sell') + '">' + (isBuy ? '\u2212' : '+') + '\u20B9' + stk_fmtIN(t.total) + '</div></div>';
    }).join('');
  } catch (e) {
    console.warn('[Quro] history load:', e.message);
    body.innerHTML = '<div class="trd-empty-msg">Failed to load history</div>';
  }
}

// ─── Reset portfolio ───
export async function trd_resetPortfolio() {
  var ok=await qConfirm('Reset portfolio','All holdings and trade history will be cleared. Cash resets to \u20B91,00,000.');if(!ok)return;
  if (!ME || !ME.id) return;

  try {
    await Promise.all([
      sb.from('stock_holdings').delete().eq('user_id', ME.id),
      sb.from('stock_transactions').delete().eq('user_id', ME.id),
      sb.from('stock_portfolios').upsert(
        { user_id: ME.id, cash_balance: 100000, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    ]);
  } catch (e) {
    console.warn('[Quro] reset error:', e.message);
  }

  trdPortfolio = { cash: 100000, holdings: {} };
  trdSelected = null;
  var hd = document.getElementById('trdStockHd');
  if (hd) hd.style.display = 'none';
  var ns = document.getElementById('trdNoSelect');
  if (ns) ns.style.display = '';
  var center = document.querySelector('.trd-center');
  if (center) center.classList.remove('has-stock');
  var miniWrap = document.getElementById('trdMiniChartWrap');
  if (miniWrap) miniWrap.classList.add('hidden');
  trd_updateSummary();
  trd_renderWatchlist();
  trd_renderBottom();
  notify('Portfolio reset to \u20B91,00,000!', 'success');
}

// ─── Mini sparkline in order panel ───
function trd_drawMiniChart() {
  var wrap = document.getElementById('trdMiniChartWrap');
  var cv = document.getElementById('trdMiniChart');
  if (!wrap || !cv) return;

  if (!trdSelected || !trdHistory[trdSelected] || trdHistory[trdSelected].length < 3) {
    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');

  var pts = trdHistory[trdSelected];
  var p = trdPrices[trdSelected];
  _setText('trdMiniLabel', p ? p.name : trdSelected);

  var dpr = window.devicePixelRatio || 1;
  var rect = cv.getBoundingClientRect();
  var w = rect.width, h = rect.height;
  if (w < 10 || h < 10) return;
  cv.width = w * dpr;
  cv.height = h * dpr;
  var ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  var min = Infinity, max = -Infinity;
  for (var i = 0; i < pts.length; i++) {
    if (pts[i] < min) min = pts[i];
    if (pts[i] > max) max = pts[i];
  }
  var range = max - min || 1;
  var pad = 2;
  var chartW = w - pad * 2;
  var chartH = h - pad * 2;

  // Determine color based on trend
  var up = pts[pts.length - 1] >= pts[0];
  var lineColor = up ? '#3da87a' : '#e05050';
  var fillTop = up ? 'rgba(61,168,122,.15)' : 'rgba(224,80,80,.15)';
  var fillBot = 'rgba(0,0,0,0)';

  // Draw filled area
  ctx.beginPath();
  for (var i = 0; i < pts.length; i++) {
    var x = pad + (i / (pts.length - 1)) * chartW;
    var y = pad + (1 - (pts[i] - min) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  // Close path down to bottom for fill
  ctx.lineTo(pad + chartW, pad + chartH);
  ctx.lineTo(pad, pad + chartH);
  ctx.closePath();
  var grad = ctx.createLinearGradient(0, pad, 0, pad + chartH);
  grad.addColorStop(0, fillTop);
  grad.addColorStop(1, fillBot);
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  for (var i = 0; i < pts.length; i++) {
    var x = pad + (i / (pts.length - 1)) * chartW;
    var y = pad + (1 - (pts[i] - min) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Current price dot
  var lastX = pad + chartW;
  var lastY = pad + (1 - (pts[pts.length - 1] - min) / range) * chartH;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();
}

// ─── Helpers ───
function _setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

function _findStock(sym) {
  for (var i = 0; i < STK_STOCKS.length; i++) {
    if (STK_STOCKS[i].s === sym) return STK_STOCKS[i];
  }
  return null;
}

