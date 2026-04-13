// ═══════════════════════════════════════
// Paper Trading Terminal — Full Rewrite
// ═══════════════════════════════════════
import { sb } from './config.js?v=49';
import { ME, chatMode, curChannel, curServer, curDMUser, curGroupChat } from './state.js?v=49';
import { STK_STOCKS, stk_simPts, stk_fmtIN, drawCandlestick, attachCrosshair, stk_startLiveRefresh, stk_stopLiveRefresh } from './stocks.js?v=49';
import { escH, notify, getMsgKey } from './utils.js?v=49';
import { qConfirm } from './modal.js?v=49';

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

var _lastRealUpdate = 0; // timestamp of last real price sync from stocks.js

// Expose for cross-module access (stocks.js live refresh)
window.trdPrices = trdPrices;
window.trdHistory = trdHistory;
// stocks.js calls this on every successful sync — tracks liveness
window._trdMarkRealUpdate = function(){ _lastRealUpdate = Date.now(); };

// ─── Init prices — use base as placeholder until real data arrives ───
export function trd_initPrices() {
  STK_STOCKS.forEach(function(stk) {
    if (!trdPrices[stk.s]) {
      trdPrices[stk.s] = { price: stk.b, prev: stk.b, name: stk.n, sec: stk.sec, base: stk.b };
      trdHistory[stk.s] = [stk.b];
    }
  });
}

// ─── Live ticker — UI refresh + simulated fallback when live feed drops ───
// Real prices come from stocks.js stk_fetchQuotes() every 3s.
// If no real update for 6s+, simulate tiny price jitter so trading stays alive.
export function trd_startTicker() {
  trd_initPrices();
  trdTickerInt = setInterval(function() {
    // Fallback: simulate small price movements if live feed is stale (>6s)
    if (Date.now() - _lastRealUpdate > 6000) {
      _trdSimulatePrices();
    }
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

// Simulate tiny random price jitter on all stocks (±0.15% max)
function _trdSimulatePrices() {
  STK_STOCKS.forEach(function(stk) {
    var p = trdPrices[stk.s];
    if (!p || !p.price) return;
    var drift = p.price * (Math.random() - 0.48) * 0.003;
    p.price = Math.max(p.base * 0.5, p.price + drift);
    // Push to history for chart
    if (!trdHistory[stk.s]) trdHistory[stk.s] = [];
    var hist = trdHistory[stk.s];
    if (hist.length === 0 || hist[hist.length - 1] !== p.price) {
      hist.push(p.price);
      if (hist.length > 80) hist.shift();
    }
  });
}

export function trd_stopTicker() {
  if (trdTickerInt) { clearInterval(trdTickerInt); trdTickerInt = null; }
}

// ─── Open / Close ───
// silent=true when called from mobileNavTo (nav already handled)
export function openTradingPage(silent) {
  document.getElementById('tradingPage').classList.add('open');
  document.body.classList.add('trading-open');
  var srvBtn = document.getElementById('srvTradingBtn');
  if (srvBtn) srvBtn.classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navBtn = document.getElementById('navTrading');
  if (navBtn) navBtn.classList.add('active');
  if (!trdTickerInt) trd_startTicker();
  // Start real-time Yahoo Finance price feed (3s interval + immediate first fetch)
  stk_startLiveRefresh();
  trd_loadPortfolio();
  // Sync mobile nav to show Trade as active
  if (!silent && typeof window.syncMobileNav === 'function') window.syncMobileNav('trade');
  if (typeof window.setActiveOverlay === 'function') window.setActiveOverlay('trade');
}

// ─── Open trade from chat ($SYMBOL tap) ───
export function openTradeFromChat(sym) {
  // Push 'chat' onto nav stack so closing trade returns to chat
  if (typeof window.navPush === 'function') window.navPush('trade');
  openTradingPage();
  // Small delay so the page slide-up renders before selecting stock
  setTimeout(function() { trd_select(sym); }, 80);
}

// ─── Open trade from stocks page ($SYMBOL tap on stock detail) ───
export function openTradeFromStocks(sym) {
  // Push 'stocks' BEFORE closing it (so the nav stack knows to return to stocks)
  _navStack_pushRaw('stocks');
  // Close stocks detail + stocks page (silent — we handle nav ourselves)
  if (typeof window.closeStkDetail === 'function') window.closeStkDetail(null, true);
  if (typeof window.closeStocksPanel === 'function') window.closeStocksPanel(true);
  // Small delay for the stocks page close animation to start
  setTimeout(function() {
    openTradingPage();
    setTimeout(function() { trd_select(sym); }, 80);
  }, 100);
}

// Helper: push a raw value onto the nav stack (bypasses current-state detection)
function _navStack_pushRaw(val) {
  if (typeof window._navStackPushRaw === 'function') window._navStackPushRaw(val);
}

// silent=true when called from _closeOverlaySilent in navigation.js
export function closeTradingPage(silent) {
  document.getElementById('tradingPage').classList.remove('open');
  document.body.classList.remove('trading-open');
  var srvBtn = document.getElementById('srvTradingBtn');
  if (srvBtn) srvBtn.classList.remove('active');
  trd_stopTicker();
  stk_stopLiveRefresh(); // Clean up price feed (smart: won't stop if stocks panel still open)
  if (typeof window.setActiveOverlay === 'function') window.setActiveOverlay(null);

  if (silent) return; // navigation.js handles nav state

  // Stack-aware: navigate back to where we came from
  if (typeof window.navigateBack === 'function') {
    window.navigateBack();
  } else {
    // Fallback: restore home nav state
    if (window.appMode === 'home') {
      document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
      var navHome = document.getElementById('navHome');
      if (navHome) navHome.classList.add('active');
    }
    if (typeof window.syncMobileNav === 'function') window.syncMobileNav('chats');
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

  // Top bar stats (with flash-on-change)
  _setText('trdTotalVal', totalStr);
  _setText('trdCash', cashStr);
  _setText('trdInvested', investedStr);
  var pnlEl = document.getElementById('trdPnL');
  if (pnlEl) {
    var prevPnlText = pnlEl.textContent;
    pnlEl.textContent = pnlStr;
    pnlEl.className = 'trd-ts-val ' + pnlCls;
    if (prevPnlText && prevPnlText !== pnlStr) _flashEl(pnlEl, up);
  }

  // Order panel portfolio card (always visible)
  _setText('trdPcTotal', totalStr);
  _setText('trdPcCash', cashStr);
  _setText('trdPcInvested', investedStr);
  var pcPnl = document.getElementById('trdPcPnl');
  if (pcPnl) { pcPnl.textContent = pnlStr; pcPnl.className = 'trd-pc-val ' + pnlCls; }
}

// ─── Watchlist — smart update with price flash ───
var _wlPrevPrices = {};
export function trd_renderWatchlist() {
  var list = document.getElementById('trdWatchlist');
  if (!list) return;
  var filter = trdWlFilter;
  var stocks = filter ? STK_STOCKS.filter(function(s) {
    return s.n.toLowerCase().includes(filter) || s.s.toLowerCase().includes(filter);
  }) : STK_STOCKS;

  // If list is empty or stock count changed, do full render
  var existingItems = list.querySelectorAll('.trd-wl-item');
  if (existingItems.length !== stocks.length || _wlForceRender) {
    _wlForceRender = false;
    _wlPrevPrices = {};
    list.innerHTML = stocks.map(function(stk) {
      var p = trdPrices[stk.s];
      if (!p) return '';
      var chg = p.price - p.prev;
      var pct = (chg / p.prev * 100);
      var up = chg >= 0;
      var held = trdPortfolio.holdings[stk.s] && trdPortfolio.holdings[stk.s].shares > 0;
      var active = trdSelected === stk.s;
      _wlPrevPrices[stk.s] = p.price;
      return '<div class="trd-wl-item' + (active ? ' active' : '') + '" data-sym="' + stk.s + '" onclick="trd_select(\'' + stk.s + '\')">' +
        '<div class="trd-wl-left">' +
        '<div class="trd-wl-sym">' + escH(stk.s) + (held ? '<span class="held-dot"></span>' : '') + '</div>' +
        '<div class="trd-wl-name">' + escH(stk.n) + '</div></div>' +
        '<div class="trd-wl-right">' +
        '<div class="trd-wl-price">\u20B9' + stk_fmtIN(p.price) + '</div>' +
        '<div class="trd-wl-chg ' + (up ? 'up' : 'down') + '">' + (up ? '+' : '') + pct.toFixed(2) + '%</div></div></div>';
    }).join('');
    return;
  }

  // Smart update — only update changed prices, flash on change
  stocks.forEach(function(stk, i) {
    var p = trdPrices[stk.s];
    if (!p) return;
    var el = existingItems[i];
    if (!el) return;
    var chg = p.price - p.prev;
    var pct = (chg / p.prev * 100);
    var up = chg >= 0;
    var held = trdPortfolio.holdings[stk.s] && trdPortfolio.holdings[stk.s].shares > 0;
    var active = trdSelected === stk.s;

    // Update active state
    el.classList.toggle('active', active);

    // Update price + flash if changed
    var priceEl = el.querySelector('.trd-wl-price');
    var chgEl = el.querySelector('.trd-wl-chg');
    if (priceEl) {
      var newPriceStr = '\u20B9' + stk_fmtIN(p.price);
      if (priceEl.textContent !== newPriceStr) {
        priceEl.textContent = newPriceStr;
        // Flash the whole row
        var prevP = _wlPrevPrices[stk.s];
        if (prevP !== undefined && prevP !== p.price) {
          var went = p.price > prevP;
          el.classList.remove('wl-tick-up', 'wl-tick-down');
          void el.offsetWidth;
          el.classList.add(went ? 'wl-tick-up' : 'wl-tick-down');
          setTimeout(function() { el.classList.remove('wl-tick-up', 'wl-tick-down'); }, 800);
        }
        _wlPrevPrices[stk.s] = p.price;
      }
    }
    if (chgEl) {
      chgEl.textContent = (up ? '+' : '') + pct.toFixed(2) + '%';
      chgEl.className = 'trd-wl-chg ' + (up ? 'up' : 'down');
    }
  });
}
var _wlForceRender = true;

var _wlFilterTimer = 0;
export function trd_filterWatch(q) {
  clearTimeout(_wlFilterTimer);
  _wlFilterTimer = setTimeout(function() {
    trdWlFilter = q.trim().toLowerCase();
    _wlForceRender = true;
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
  var qtyInput = document.getElementById('trdQtyInput');
  var qty = parseFloat(qtyInput?.value) || 0;
  if (qty <= 0) {
    notify('Enter a valid quantity', 'error');
    _shakeInput(qtyInput);
    return;
  }
  var total = qty * p.price;

  // Pre-validate
  if (trdTab === 'buy' && total > trdPortfolio.cash) {
    notify('Insufficient funds — you need \u20B9' + stk_fmtIN(total - trdPortfolio.cash) + ' more', 'error');
    _shakeInput(qtyInput);
    return;
  }
  if (trdTab === 'sell') {
    var h = trdPortfolio.holdings[trdSelected];
    if (!h || qty > h.shares) {
      notify('Not enough shares to sell', 'error');
      _shakeInput(qtyInput);
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

  var tradePnl = '';
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
      // Calculate profit BEFORE modifying holdings
      var profit = (price - h.avgPrice) * shares;
      tradePnl = (profit >= 0 ? '+' : '') + profit.toFixed(2);
      // Update local state
      trdPortfolio.cash += total;
      var remaining = h.shares - shares;
      if (remaining <= 0.0001) {
        delete trdPortfolio.holdings[symbol];
      } else {
        trdPortfolio.holdings[symbol] = { shares: remaining, avgPrice: h.avgPrice };
      }
      var profitUp = profit >= 0;
      notify('Sold ' + shares + ' x ' + p.name + ' — ' + (profitUp ? 'Profit' : 'Loss') + ' \u20B9' + stk_fmtIN(Math.abs(profit)), profitUp ? 'success' : 'error');
    }

    // Save to database
    await _saveToDb(symbol, action, shares, price, total, stk ? stk.n : symbol);
  } catch (e) {
    console.error('[Quro Trade]', e);
    notify('Trade executed locally — DB sync failed', 'error');
  }

  // Broadcast trade to chat feed
  _broadcastTrade(action, symbol, shares, price, stk ? stk.n : symbol, tradePnl);

  // Show success celebration
  _showTradeSuccess(action);

  // Refresh all UI
  trd_updateSummary();
  trd_renderWatchlist();
  trd_updateStockHd(symbol);
  trd_updateOrder();
  trd_renderBottom();
}

// ─── Input shake on validation error ───
function _shakeInput(el) {
  if (!el) return;
  el.classList.remove('shake-error');
  void el.offsetWidth; // force reflow to restart animation
  el.classList.add('shake-error');
  setTimeout(function() { el.classList.remove('shake-error'); }, 400);
}

// ─── Trade success celebration ───
function _showTradeSuccess(action) {
  // 1. Flash overlay with checkmark
  var overlay = document.createElement('div');
  overlay.className = 'trade-success-overlay ' + action;
  overlay.innerHTML = '<div class="trade-success-check ' + action + '"><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></div>';
  document.body.appendChild(overlay);
  setTimeout(function() { overlay.remove(); }, 700);

  // 2. Pulse the execute button
  var btn = document.getElementById('trdExecBtn');
  if (btn) {
    btn.classList.add('success-' + action);
    setTimeout(function() { btn.classList.remove('success-' + action); }, 600);
  }
}

// ─── Broadcast trade as special chat message ───
async function _broadcastTrade(action, symbol, shares, price, stockName, pnl) {
  if (!ME || !ME.id) return;
  try {
    var tradeTag = '[trade]' + action + '|' + symbol + '|' + stockName + '|' + shares + '|' + price.toFixed(2) + '|' + (pnl || '') + '[/trade]';

    await sb.from('messages').insert({
      server_channel: 'server:global:trade-feed',
      user_id: ME.id,
      author: ME.username,
      avatar: ME.avatar,
      photo: ME.photo || null,
      text: tradeTag,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name_font: ME.name_font || 'default',
      name_color: ME.name_color || ''
    });
  } catch (e) {
    console.warn('[Quro] trade broadcast failed:', e.message);
  }
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
    body.innerHTML = '<div class="trd-empty-msg">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>' +
      '<div class="trd-empty-title">No holdings yet</div>' +
      '<div class="trd-empty-sub">Pick a stock from the watchlist and place your first trade</div>' +
      '</div>';
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

  body.innerHTML = '<div style="padding:var(--sp-2) 0">' +
    '<div class="trd-skeleton-row"><div class="skeleton skeleton-badge"></div><div style="flex:1"><div class="skeleton skeleton-text w-70"></div><div class="skeleton skeleton-text w-40"></div></div><div class="skeleton skeleton-text" style="width:60px"></div></div>' +
    '<div class="trd-skeleton-row"><div class="skeleton skeleton-badge"></div><div style="flex:1"><div class="skeleton skeleton-text w-80"></div><div class="skeleton skeleton-text w-50"></div></div><div class="skeleton skeleton-text" style="width:60px"></div></div>' +
    '<div class="trd-skeleton-row"><div class="skeleton skeleton-badge"></div><div style="flex:1"><div class="skeleton skeleton-text w-70"></div><div class="skeleton skeleton-text w-40"></div></div><div class="skeleton skeleton-text" style="width:60px"></div></div>' +
    '</div>';

  try {
    var res = await sb.from('stock_transactions').select('*').eq('user_id', ME.id).order('created_at', { ascending: false }).limit(50);
    var txns = res.data || [];

    if (!txns.length) {
      body.innerHTML = '<div class="trd-empty-msg">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>' +
        '<div class="trd-empty-title">No transactions yet</div>' +
        '<div class="trd-empty-sub">Your buy and sell history will appear here</div>' +
        '</div>';
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
    body.innerHTML = '<div class="trd-empty-msg">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
      '<div class="trd-empty-title">Failed to load</div>' +
      '<div class="trd-empty-sub">Check your connection and try again</div>' +
      '</div>';
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
// ─── Animated text set — flashes green/red when value changes ───
var _prevValues = {};
function _setText(id, text) {
  var el = document.getElementById(id);
  if (!el) return;
  var prev = _prevValues[id];
  if (prev !== undefined && prev !== text) {
    // Value changed — flash it
    var grew = _compareCurrency(text, prev);
    el.textContent = text;
    _flashEl(el, grew);
  } else {
    el.textContent = text;
  }
  _prevValues[id] = text;
}

// Compare two currency strings to determine if value went up
function _compareCurrency(newStr, oldStr) {
  var nv = parseFloat((newStr || '').replace(/[^\d.\-]/g, '')) || 0;
  var ov = parseFloat((oldStr || '').replace(/[^\d.\-]/g, '')) || 0;
  return nv >= ov;
}

// Apply flash animation to an element
function _flashEl(el, isUp) {
  if (!el) return;
  el.classList.remove('val-flash-up', 'val-flash-down');
  void el.offsetWidth; // force reflow
  el.classList.add(isUp ? 'val-flash-up' : 'val-flash-down');
  setTimeout(function() { el.classList.remove('val-flash-up', 'val-flash-down'); }, 700);
}

function _findStock(sym) {
  for (var i = 0; i < STK_STOCKS.length; i++) {
    if (STK_STOCKS[i].s === sym) return STK_STOCKS[i];
  }
  return null;
}

// ─── Live Trade Ticker ───
var _tickerMax = 4;
export function trd_pushTicker(who, action, sym, shares, price) {
  var ticker = document.getElementById('trdLiveTicker');
  if (!ticker) return;
  var isBuy = action === 'buy';
  var item = document.createElement('div');
  item.className = 'trd-live-ticker-item';
  item.innerHTML =
    '<span class="tick-user">' + escH(who) + '</span>' +
    '<span class="tick-action ' + (isBuy ? 'buy' : 'sell') + '">' + (isBuy ? 'BUY' : 'SELL') + '</span>' +
    '<span>' + escH(sym) + '</span>' +
    '<span class="tick-dot"></span>' +
    '<span>' + shares + ' @ \u20B9' + price + '</span>';
  // Keep max items
  while (ticker.children.length >= _tickerMax) {
    ticker.removeChild(ticker.firstChild);
  }
  ticker.appendChild(item);
  ticker.classList.add('active');
  // Auto-hide after 15s if no new items
  clearTimeout(ticker._hideTimer);
  ticker._hideTimer = setTimeout(function() {
    ticker.classList.remove('active');
    setTimeout(function() { ticker.innerHTML = ''; }, 400);
  }, 15000);
}

