// ═══ TRADING LEADERBOARD — Competitive Ranking ═══
import { sb } from './config.js?v=49';
import { ME, appMode } from './state.js?v=49';
import { escH, stk_fmtIN } from './utils.js?v=49';
import { STK_STOCKS, stk_startLiveRefresh } from './stocks.js?v=49';

var _lpPeriod = 'weekly'; // 'weekly' | 'alltime'
var _lpPrevRanks = {}; // userId -> previous rank (for rank change indicators)
var _lpPrevData = {}; // userId -> {pctReturn, total} for value flash detection
var _lpRefreshInt = null; // auto-refresh interval for live feel
var _lpFirstRender = true; // skip animations on first load
var STARTING_CASH = 100000;

// ─── Starfield background ───
var _lpStarRAF = null;
var _lpStars = [];
var _lpShootingStar = null;
var _lpShootTimer = 0;

function _startLpStars() {
  if (_lpStarRAF) return; // already running
  var cv = document.getElementById('lpStars');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w, h;

  function resize() {
    var lp = document.getElementById('leaderPage');
    w = lp ? lp.offsetWidth : window.innerWidth;
    h = lp ? lp.offsetHeight : window.innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (_lpStars.length === 0) spawnStars();
  }
  resize();
  window.addEventListener('resize', resize);
  cv._resizeHandler = resize;

  function spawnStars() {
    _lpStars = [];
    var count = Math.min(Math.floor(w * h / 4000), 200);
    count = Math.max(count, 60);
    for (var i = 0; i < count; i++) {
      _lpStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.3 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.025,
        baseAlpha: 0.1 + Math.random() * 0.5,
        color: Math.random() < 0.7 ? 255 : (Math.random() < 0.5 ? 200 : 180),
        g: Math.random() < 0.3 ? 220 : 255,
        b: Math.random() < 0.2 ? 180 : 255,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < _lpStars.length; i++) {
      var s = _lpStars[i];
      s.phase += s.speed;
      var alpha = s.baseAlpha * (0.4 + 0.6 * Math.abs(Math.sin(s.phase)));
      if (s.r > 1.2) {
        ctx.strokeStyle = 'rgba(' + s.color + ',' + s.g + ',' + s.b + ',' + (alpha * 0.3) + ')';
        ctx.lineWidth = 0.5;
        var rayLen = s.r * 2;
        ctx.beginPath();
        ctx.moveTo(s.x - rayLen, s.y); ctx.lineTo(s.x + rayLen, s.y);
        ctx.moveTo(s.x, s.y - rayLen); ctx.lineTo(s.x, s.y + rayLen);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.color + ',' + s.g + ',' + s.b + ',' + alpha + ')';
      ctx.fill();
      if (s.r > 0.8) {
        var grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
        grd.addColorStop(0, 'rgba(' + s.color + ',' + s.g + ',' + s.b + ',' + (alpha * 0.2) + ')');
        grd.addColorStop(1, 'rgba(' + s.color + ',' + s.g + ',' + s.b + ',0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }
    // Shooting star
    _lpShootTimer++;
    if (!_lpShootingStar && _lpShootTimer > 300 && Math.random() < 0.005) {
      _lpShootingStar = {
        x: Math.random() * w * 0.6 + w * 0.2, y: Math.random() * h * 0.3,
        vx: 3 + Math.random() * 4, vy: 1.5 + Math.random() * 2,
        life: 1, len: 30 + Math.random() * 50,
      };
      _lpShootTimer = 0;
    }
    if (_lpShootingStar) {
      var ss = _lpShootingStar;
      ss.x += ss.vx; ss.y += ss.vy; ss.life -= 0.012;
      if (ss.life <= 0) { _lpShootingStar = null; }
      else {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var ssGrad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * ss.len * 0.3, ss.y - ss.vy * ss.len * 0.3);
        ssGrad.addColorStop(0, 'rgba(255,255,255,' + (ss.life * 0.8) + ')');
        ssGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = ssGrad; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * ss.len * 0.3, ss.y - ss.vy * ss.len * 0.3);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (ss.life * 0.6) + ')';
        ctx.fill();
        ctx.restore();
      }
    }
    _lpStarRAF = requestAnimationFrame(tick);
  }
  tick();
}

function _stopLpStars() {
  if (_lpStarRAF) { cancelAnimationFrame(_lpStarRAF); _lpStarRAF = null; }
  _lpStars = [];
  _lpShootingStar = null;
  _lpShootTimer = 0;
  var cv = document.getElementById('lpStars');
  if (cv && cv._resizeHandler) {
    window.removeEventListener('resize', cv._resizeHandler);
    cv._resizeHandler = null;
  }
}

// ─── Seed window.trdPrices from stock base prices so leaderboard math works
// even if user never opened the trading page (otherwise all pnl = 0) ───
function _seedPricesFromBase() {
  if (!window.trdPrices) window.trdPrices = {};
  STK_STOCKS.forEach(function(stk) {
    if (!window.trdPrices[stk.s]) {
      window.trdPrices[stk.s] = { price: stk.b, prev: stk.b, name: stk.n, sec: stk.sec, base: stk.b };
    }
  });
}

export function openLeaderPage() {
  document.getElementById('leaderPage').classList.add('open');
  var srvBtn = document.getElementById('srvLeaderBtn');
  if (srvBtn) srvBtn.classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navBtn = document.getElementById('navLeader');
  if (navBtn) navBtn.classList.add('active');
  if (typeof window.setActiveOverlay === 'function') window.setActiveOverlay('leaderboard');
  if (typeof window.syncMobileNav === 'function') window.syncMobileNav('leaderboard');
  _startLpStars();
  _lpFirstRender = true;
  // Make sure trdPrices is populated so portfolio values render correctly
  _seedPricesFromBase();
  // Start the live price feed so portfolios reflect real market movement
  try { stk_startLiveRefresh(); } catch(e) {}
  loadLeaderboard();
  // Auto-refresh every 8s for live competition feel
  if (_lpRefreshInt) clearInterval(_lpRefreshInt);
  _lpRefreshInt = setInterval(function() { loadLeaderboard(); }, 8000);
}

// silent=true when called from navigation.js _closeOverlaySilent
export function closeLeaderPage(silent) {
  document.getElementById('leaderPage').classList.remove('open');
  _stopLpStars();
  if (_lpRefreshInt) { clearInterval(_lpRefreshInt); _lpRefreshInt = null; }
  var srvBtn = document.getElementById('srvLeaderBtn');
  if (srvBtn) srvBtn.classList.remove('active');
  if (typeof window.setActiveOverlay === 'function') window.setActiveOverlay(null);

  if (silent) return;

  if (typeof window.navigateBack === 'function') {
    window.navigateBack();
  } else {
    if (appMode === 'home') {
      document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
      var navHome = document.getElementById('navHome');
      if (navHome) navHome.classList.add('active');
    }
    if (typeof window.syncMobileNav === 'function') window.syncMobileNav('chats');
  }
}

export function lpSwitchPeriod(period) {
  _lpPeriod = period;
  _lpFirstRender = true;
  _lpPrevData = {};
  document.getElementById('lpTabWeekly').classList.toggle('active', period === 'weekly');
  document.getElementById('lpTabAlltime').classList.toggle('active', period === 'alltime');
  loadLeaderboard();
}

// ─── Weekly reset timer ───
function _getWeekResetDate() {
  var now = new Date();
  // Next Monday 00:00 IST
  var day = now.getDay(); // 0=Sun
  var daysUntilMon = day === 0 ? 1 : (8 - day);
  var reset = new Date(now);
  reset.setDate(reset.getDate() + daysUntilMon);
  reset.setHours(0, 0, 0, 0);
  return reset;
}

function _getWeekStart() {
  var now = new Date();
  var day = now.getDay();
  var diff = day === 0 ? 6 : (day - 1); // Monday is start
  var start = new Date(now);
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function _renderResetBar() {
  var bar = document.getElementById('lpResetBar');
  if (!bar) return;
  if (_lpPeriod !== 'weekly') { bar.style.display = 'none'; return; }
  bar.style.display = '';
  var reset = _getWeekResetDate();
  var now = Date.now();
  var diff = reset.getTime() - now;
  if (diff <= 0) { bar.innerHTML = '<span class="lp-reset-label">Resets now</span>'; return; }
  var d = Math.floor(diff / 86400000);
  var h = Math.floor((diff % 86400000) / 3600000);
  var m = Math.floor((diff % 3600000) / 60000);
  var parts = [];
  if (d > 0) parts.push(d + 'd');
  parts.push(h + 'h');
  parts.push(m + 'm');
  bar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;opacity:.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
    '<span class="lp-reset-label">Resets in <strong>' + parts.join(' ') + '</strong></span>';
}

// ─── Load previous ranks from sessionStorage for rank change ───
function _loadPrevRanks() {
  try {
    var raw = sessionStorage.getItem('quro_lb_ranks_' + _lpPeriod);
    if (raw) _lpPrevRanks = JSON.parse(raw);
    else _lpPrevRanks = {};
  } catch (e) { _lpPrevRanks = {}; }
}

function _saveCurRanks(entries) {
  var ranks = {};
  entries.forEach(function(e, i) { ranks[e.userId] = i + 1; });
  try { sessionStorage.setItem('quro_lb_ranks_' + _lpPeriod, JSON.stringify(ranks)); } catch (e) { /* */ }
}

// ─── Main load ───
export async function loadLeaderboard() {
  var body = document.getElementById('lpBody');
  var podium = document.getElementById('lpPodium');
  var myRank = document.getElementById('lpMyRank');

  // Only show skeletons on first render
  if (_lpFirstRender) {
    body.innerHTML = '<div style="padding:var(--sp-2) 0">' +
      [1,2,3,4,5].map(function() {
        return '<div class="skeleton-row"><div class="skeleton skeleton-text" style="width:24px;height:24px;border-radius:var(--r-full);flex-shrink:0"></div>' +
          '<div class="skeleton skeleton-avatar"></div>' +
          '<div style="flex:1"><div class="skeleton skeleton-text w-70"></div><div class="skeleton skeleton-text w-40"></div></div>' +
          '<div class="skeleton skeleton-text" style="width:50px"></div></div>';
      }).join('') + '</div>';
    podium.innerHTML = '';
    myRank.style.display = 'none';
  }
  _renderResetBar();
  _loadPrevRanks();

  try {
    // Fetch all portfolios, holdings, profiles, and weekly transactions
    var queries = [
      sb.from('stock_portfolios').select('user_id,cash_balance'),
      sb.from('stock_holdings').select('user_id,symbol,shares,avg_buy_price'),
      sb.from('profiles').select('id,username,avatar,photo,name_font,name_color')
    ];

    // For weekly: also fetch transaction counts this week
    if (_lpPeriod === 'weekly') {
      var weekStart = _getWeekStart().toISOString();
      queries.push(
        sb.from('stock_transactions').select('user_id,type,shares,price,created_at')
          .gte('created_at', weekStart)
      );
    }

    var results = await Promise.all(queries);
    var pRes = results[0], hRes = results[1], prRes = results[2];
    var weeklyTxns = results[3] ? (results[3].data || []) : [];

    var profMap = {};
    (prRes.data || []).forEach(function(p) { profMap[p.id] = p; });

    var holdsByUser = {};
    (hRes.data || []).forEach(function(h) {
      if (!holdsByUser[h.user_id]) holdsByUser[h.user_id] = [];
      holdsByUser[h.user_id].push(h);
    });

    // Weekly trade counts per user
    var weeklyTradeCount = {};
    weeklyTxns.forEach(function(t) {
      weeklyTradeCount[t.user_id] = (weeklyTradeCount[t.user_id] || 0) + 1;
    });

    // ── Build entries with % returns ──
    var entries = (pRes.data || []).map(function(p) {
      var prof = profMap[p.user_id] || { username: 'Unknown', avatar: '?', photo: '' };
      var cash = parseFloat(p.cash_balance) || 0;
      var curValue = 0;
      (holdsByUser[p.user_id] || []).forEach(function(h) {
        var curPrice = (window.trdPrices && window.trdPrices[h.symbol]) ? window.trdPrices[h.symbol].price : h.avg_buy_price;
        curValue += h.shares * curPrice;
      });
      var total = cash + curValue;
      var pnl = total - STARTING_CASH;
      var pctReturn = (pnl / STARTING_CASH) * 100;
      var trades = weeklyTradeCount[p.user_id] || 0;
      return { prof: prof, total: total, pnl: pnl, pctReturn: pctReturn, userId: p.user_id, trades: trades };
    });

    // ── Sort by % return (descending) ──
    entries.sort(function(a, b) { return b.pctReturn - a.pctReturn; });

    // For weekly: prefer users who've actually traded this week, but fall back
    // to full list if the RLS-restricted trade count is unreliable (stock_transactions
    // SELECT may be locked to the current user, so other users show 0 trades).
    var displayEntries = entries;
    if (_lpPeriod === 'weekly') {
      var hasAnyTrades = entries.some(function(e) { return e.trades > 0; });
      if (hasAnyTrades) {
        var active = entries.filter(function(e) { return e.trades > 0 || e.pnl !== 0; });
        if (active.length > 0) displayEntries = active;
      }
      // else: RLS is hiding other users' trades — show everyone with a portfolio
    }

    if (!displayEntries.length) {
      podium.innerHTML = '';
      body.innerHTML = '<div class="empty-state" style="padding:var(--sp-10) var(--sp-5)">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>' +
        '<h3>No traders yet</h3>' +
        '<p>Start Paper Trading to appear on the leaderboard</p>' +
        '<button class="empty-cta" onclick="closeLeaderPage();mobileNavTo(\'trade\')">Start Trading</button>' +
        '</div>';
      _lpFirstRender = false;
      return;
    }

    // Save current ranks for next comparison
    _saveCurRanks(displayEntries);

    // ── Build podium (top 3) with live diffing ──
    _renderPodium(displayEntries.slice(0, 3));

    // ── My rank strip ──
    _renderMyRank(displayEntries);

    // ── List (rank 4+) with smart DOM diffing ──
    var listEntries = displayEntries.slice(3);
    if (!listEntries.length) {
      body.innerHTML = '';
      _lpFirstRender = false;
      _savePrevData(displayEntries);
      return;
    }

    if (_lpFirstRender) {
      // First render — full innerHTML
      body.innerHTML = _buildListHTML(listEntries);
    } else {
      // Subsequent renders — smart diff
      _diffUpdateList(body, listEntries);
    }

    _lpFirstRender = false;
    _savePrevData(displayEntries);

  } catch (err) {
    if (_lpFirstRender) {
      body.innerHTML = '<div class="empty-state" style="padding:var(--sp-10) var(--sp-5)">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
        '<h3>Failed to load</h3><p>Check your connection and try again</p>' +
        '</div>';
    }
  }
}

// ─── Save previous data for value change detection ───
function _savePrevData(entries) {
  var pd = {};
  entries.forEach(function(e, i) {
    pd[e.userId] = { pctReturn: e.pctReturn, total: e.total, rank: i + 1 };
  });
  _lpPrevData = pd;
}

// ─── Build full list HTML ───
function _buildListHTML(listEntries) {
  return listEntries.map(function(e, idx) {
    var rank = idx + 4;
    var isMe = ME && e.userId === ME.id;
    var pnlUp = e.pctReturn >= 0;

    var prevRank = _lpPrevRanks[e.userId];
    var changeHtml = '';
    if (prevRank && prevRank !== rank) {
      var diff = prevRank - rank;
      if (diff > 0) changeHtml = '<span class="lp-rank-chg up">\u25B2+' + diff + '</span>';
      else changeHtml = '<span class="lp-rank-chg down">\u25BC' + diff + '</span>';
    }

    return '<div class="lp-item' + (isMe ? ' me' : '') + '" data-uid="' + e.userId + '" style="animation-delay:' + (idx * 30) + 'ms">' +
      '<div class="lp-rank">' + rank + changeHtml + '</div>' +
      '<div class="lp-av">' + (e.prof.photo ? '<img src="' + escH(e.prof.photo) + '">' : escH(e.prof.avatar || '?')) + '</div>' +
      '<div class="lp-uinfo">' +
        '<div class="lp-uname nf-' + (e.prof.name_font || 'default') + '"' + (e.prof.name_color ? ' style="color:' + e.prof.name_color + '"' : '') + '>' + escH(e.prof.username) + (isMe ? ' <span class="lp-you">(you)</span>' : '') + '</div>' +
        '<div class="lp-utype">' + (_lpPeriod === 'weekly' ? e.trades + ' trades this week' : 'Paper Portfolio') + '</div>' +
      '</div>' +
      '<div class="lp-val">' +
        '<div class="lp-pct ' + (pnlUp ? 'up' : 'down') + '" data-pct>' + (pnlUp ? '+' : '') + e.pctReturn.toFixed(2) + '%</div>' +
        '<div class="lp-total" data-total>\u20B9' + stk_fmtIN(e.total) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ─── Smart DOM diff for list items ───
function _diffUpdateList(body, listEntries) {
  var existingItems = body.querySelectorAll('.lp-item[data-uid]');
  var existingMap = {};
  existingItems.forEach(function(el) { existingMap[el.dataset.uid] = el; });

  // Build new order of user IDs
  var newIds = listEntries.map(function(e) { return e.userId; });
  var existingIds = Array.from(existingItems).map(function(el) { return el.dataset.uid; });

  // Check if the set of users changed (someone entered/left rank 4+)
  var setChanged = newIds.length !== existingIds.length || newIds.some(function(id) { return !existingMap[id]; });

  if (setChanged) {
    // Set changed — full rebuild with entrance animation
    body.innerHTML = _buildListHTML(listEntries);
    return;
  }

  // ── Same users, possibly reordered — animate position changes ──
  // First, compute position offsets for FLIP animation
  var oldPositions = {};
  existingItems.forEach(function(el) {
    oldPositions[el.dataset.uid] = el.getBoundingClientRect().top;
  });

  // Reorder DOM nodes to match new order
  var reordered = false;
  for (var i = 0; i < newIds.length; i++) {
    var expectedEl = existingMap[newIds[i]];
    var currentChild = body.children[i];
    if (expectedEl !== currentChild) {
      body.insertBefore(expectedEl, currentChild);
      reordered = true;
    }
  }

  // Now update each item's content and trigger animations
  listEntries.forEach(function(e, idx) {
    var rank = idx + 4;
    var el = existingMap[e.userId];
    if (!el) return;

    var pnlUp = e.pctReturn >= 0;
    var prev = _lpPrevData[e.userId];

    // Update rank number
    var rankEl = el.querySelector('.lp-rank');
    if (rankEl) {
      var prevRank = _lpPrevRanks[e.userId];
      var changeHtml = '';
      if (prevRank && prevRank !== rank) {
        var diff = prevRank - rank;
        if (diff > 0) changeHtml = '<span class="lp-rank-chg up">\u25B2+' + diff + '</span>';
        else changeHtml = '<span class="lp-rank-chg down">\u25BC' + diff + '</span>';
      }
      rankEl.innerHTML = rank + changeHtml;
    }

    // Update percentage — flash on change
    var pctEl = el.querySelector('[data-pct]');
    if (pctEl) {
      var newPctText = (pnlUp ? '+' : '') + e.pctReturn.toFixed(2) + '%';
      if (pctEl.textContent !== newPctText) {
        var valueWentUp = prev ? e.pctReturn > prev.pctReturn : pnlUp;
        pctEl.textContent = newPctText;
        pctEl.className = 'lp-pct ' + (pnlUp ? 'up' : 'down');
        // Flash animation
        _lpFlash(pctEl, valueWentUp);
        // Count-up animation on the number
        _lpCountAnimate(pctEl, prev ? prev.pctReturn : e.pctReturn, e.pctReturn, true);
      }
    }

    // Update total
    var totalEl = el.querySelector('[data-total]');
    if (totalEl) {
      var newTotalText = '\u20B9' + stk_fmtIN(e.total);
      if (totalEl.textContent !== newTotalText) {
        totalEl.textContent = newTotalText;
      }
    }
  });

  // FLIP animation: move reordered rows smoothly
  if (reordered) {
    listEntries.forEach(function(e) {
      var el = existingMap[e.userId];
      if (!el) return;
      var oldTop = oldPositions[e.userId];
      if (oldTop === undefined) return;
      var newTop = el.getBoundingClientRect().top;
      var deltaY = oldTop - newTop;
      if (Math.abs(deltaY) < 2) return; // ignore sub-pixel jitter
      // FLIP: set old position, then animate to new
      el.style.transform = 'translateY(' + deltaY + 'px)';
      el.style.transition = 'none';
      el.classList.add('lp-rank-moving');
      // Add direction class for the flash background
      if (deltaY > 0) el.classList.add('lp-moved-up');
      else el.classList.add('lp-moved-down');
      // Force reflow
      void el.offsetWidth;
      el.style.transition = 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = '';
      // Cleanup
      setTimeout(function() {
        el.style.transition = '';
        el.classList.remove('lp-rank-moving', 'lp-moved-up', 'lp-moved-down');
      }, 650);
    });
  }
}

// ─── Flash element on value change ───
function _lpFlash(el, isUp) {
  el.classList.remove('lp-val-flash-up', 'lp-val-flash-down');
  void el.offsetWidth;
  el.classList.add(isUp ? 'lp-val-flash-up' : 'lp-val-flash-down');
  setTimeout(function() { el.classList.remove('lp-val-flash-up', 'lp-val-flash-down'); }, 800);
}

// ─── Smooth count-up number animation ───
function _lpCountAnimate(el, fromVal, toVal, isPct) {
  var duration = 500;
  var start = performance.now();
  var diff = toVal - fromVal;
  if (Math.abs(diff) < 0.005) return; // skip tiny changes

  function frame(now) {
    var elapsed = now - start;
    var t = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    t = 1 - Math.pow(1 - t, 3);
    var current = fromVal + diff * t;
    var up = current >= 0;
    el.textContent = (up ? '+' : '') + current.toFixed(2) + (isPct ? '%' : '');
    if (elapsed < duration) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ─── Podium: Top 3 ───
function _renderPodium(top3) {
  var podium = document.getElementById('lpPodium');
  if (!top3.length) { podium.innerHTML = ''; return; }

  // Podium order: 2nd | 1st | 3rd (visual layout)
  var order = [];
  if (top3.length >= 2) order.push({ e: top3[1], rank: 2, pos: 'silver' });
  if (top3.length >= 1) order.push({ e: top3[0], rank: 1, pos: 'gold' });
  if (top3.length >= 3) order.push({ e: top3[2], rank: 3, pos: 'bronze' });

  var medals = { 1: '\uD83E\uDD47', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };

  // Check if we can do a smart diff on existing podium cards
  var existingPods = podium.querySelectorAll('.lp-pod[data-uid]');
  var canDiff = !_lpFirstRender && existingPods.length === order.length;

  if (canDiff) {
    // Smart diff: update values in place, flash on change
    var existingPodMap = {};
    existingPods.forEach(function(el) { existingPodMap[el.dataset.uid] = el; });

    order.forEach(function(o) {
      var el = existingPodMap[o.e.userId];
      if (!el) { canDiff = false; return; }
      var e = o.e;
      var pnlUp = e.pctReturn >= 0;
      var prev = _lpPrevData[e.userId];

      // Update % value with flash
      var pctEl = el.querySelector('[data-pct]');
      if (pctEl) {
        var newPctText = (pnlUp ? '+' : '') + e.pctReturn.toFixed(2) + '%';
        if (pctEl.textContent !== newPctText) {
          var valueWentUp = prev ? e.pctReturn > prev.pctReturn : pnlUp;
          _lpFlash(pctEl, valueWentUp);
          _lpCountAnimate(pctEl, prev ? prev.pctReturn : e.pctReturn, e.pctReturn, true);
          pctEl.className = 'lp-pod-pct ' + (pnlUp ? 'up' : 'down');
        }
      }

      // Update total
      var valEl = el.querySelector('[data-total]');
      if (valEl) {
        valEl.textContent = '\u20B9' + stk_fmtIN(e.total);
      }

      // Update rank change badge
      var prevRank = _lpPrevRanks[e.userId];
      var chgEl = el.querySelector('.lp-pod-chg');
      if (prevRank && prevRank !== o.rank) {
        var diff = prevRank - o.rank;
        var chgHtml = diff > 0 ? '\u25B2+' + diff : '\u25BC' + diff;
        var chgCls = diff > 0 ? 'up' : 'down';
        if (chgEl) { chgEl.className = 'lp-pod-chg ' + chgCls; chgEl.textContent = chgHtml; }
        else {
          var newChg = document.createElement('div');
          newChg.className = 'lp-pod-chg ' + chgCls;
          newChg.textContent = chgHtml;
          el.appendChild(newChg);
        }
      } else if (chgEl) {
        chgEl.remove();
      }
    });

    if (canDiff) return; // successful diff, no need for full rebuild
  }

  // Full rebuild (first load or structure changed)
  podium.innerHTML = '<div class="lp-podium-row">' + order.map(function(o) {
    var e = o.e;
    var isMe = ME && e.userId === ME.id;
    var pnlUp = e.pctReturn >= 0;

    // Rank change
    var prevRank = _lpPrevRanks[e.userId];
    var changeHtml = '';
    if (prevRank && prevRank !== o.rank) {
      var diff = prevRank - o.rank;
      if (diff > 0) changeHtml = '<div class="lp-pod-chg up">\u25B2+' + diff + '</div>';
      else changeHtml = '<div class="lp-pod-chg down">\u25BC' + diff + '</div>';
    }

    return '<div class="lp-pod ' + o.pos + (isMe ? ' me' : '') + ' lp-pod-glow" data-uid="' + e.userId + '">' +
      '<div class="lp-pod-medal">' + medals[o.rank] + '</div>' +
      '<div class="lp-pod-av">' + (e.prof.photo ? '<img src="' + escH(e.prof.photo) + '">' : '<span>' + escH(e.prof.avatar || '?') + '</span>') + '</div>' +
      '<div class="lp-pod-name nf-' + (e.prof.name_font || 'default') + '"' + (e.prof.name_color ? ' style="color:' + e.prof.name_color + '"' : '') + '>' + escH(e.prof.username) + '</div>' +
      '<div class="lp-pod-pct ' + (pnlUp ? 'up' : 'down') + '" data-pct>' + (pnlUp ? '+' : '') + e.pctReturn.toFixed(2) + '%</div>' +
      '<div class="lp-pod-val" data-total>\u20B9' + stk_fmtIN(e.total) + '</div>' +
      changeHtml +
    '</div>';
  }).join('') + '</div>';
}

// ─── My Rank Strip ───
function _renderMyRank(entries) {
  var strip = document.getElementById('lpMyRank');
  if (!ME) { strip.style.display = 'none'; return; }

  var myIdx = -1;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].userId === ME.id) { myIdx = i; break; }
  }
  if (myIdx === -1) { strip.style.display = 'none'; return; }

  var myEntry = entries[myIdx];
  var rank = myIdx + 1;
  var pnlUp = myEntry.pctReturn >= 0;
  var totalPlayers = entries.length;
  var prev = _lpPrevData[ME.id];

  // Rank change
  var prevRank = _lpPrevRanks[ME.id];
  var changeHtml = '';
  if (prevRank && prevRank !== rank) {
    var diff = prevRank - rank;
    if (diff > 0) changeHtml = '<span class="lp-myrank-chg up">\u25B2 +' + diff + ' today</span>';
    else changeHtml = '<span class="lp-myrank-chg down">\u25BC ' + Math.abs(diff) + ' today</span>';
  }

  // Smart diff: try updating in place if strip already has content
  var existingPctEl = strip.querySelector('[data-mypct]');
  if (!_lpFirstRender && existingPctEl) {
    // Update rank
    var posEl = strip.querySelector('.lp-myrank-pos');
    if (posEl) posEl.innerHTML = '#' + rank + ' <span class="lp-myrank-of">of ' + totalPlayers + '</span>';

    // Update rank change
    var chgEl = strip.querySelector('.lp-myrank-chg');
    var leftEl = strip.querySelector('.lp-myrank-left');
    if (changeHtml && leftEl) {
      if (chgEl) chgEl.outerHTML = changeHtml;
      else leftEl.insertAdjacentHTML('beforeend', changeHtml);
    } else if (chgEl) { chgEl.remove(); }

    // Update % with flash
    var newPctText = (pnlUp ? '+' : '') + myEntry.pctReturn.toFixed(2) + '%';
    if (existingPctEl.textContent !== newPctText) {
      var valueWentUp = prev ? myEntry.pctReturn > prev.pctReturn : pnlUp;
      _lpFlash(existingPctEl, valueWentUp);
      _lpCountAnimate(existingPctEl, prev ? prev.pctReturn : myEntry.pctReturn, myEntry.pctReturn, true);
      existingPctEl.className = 'lp-myrank-pct ' + (pnlUp ? 'up' : 'down');
    }

    // Update total
    var valEl = strip.querySelector('.lp-myrank-val');
    if (valEl) valEl.textContent = '\u20B9' + stk_fmtIN(myEntry.total);
    return;
  }

  strip.style.display = '';
  strip.innerHTML =
    '<div class="lp-myrank-left">' +
      '<div class="lp-myrank-pos">#' + rank + ' <span class="lp-myrank-of">of ' + totalPlayers + '</span></div>' +
      changeHtml +
    '</div>' +
    '<div class="lp-myrank-right">' +
      '<div class="lp-myrank-pct ' + (pnlUp ? 'up' : 'down') + '" data-mypct>' + (pnlUp ? '+' : '') + myEntry.pctReturn.toFixed(2) + '%</div>' +
      '<div class="lp-myrank-val">\u20B9' + stk_fmtIN(myEntry.total) + '</div>' +
    '</div>';
}
