// ═══ TRADING LEADERBOARD — Competitive Ranking ═══
import { sb } from './config.js';
import { ME, appMode } from './state.js';
import { escH, stk_fmtIN } from './utils.js';

var _lpPeriod = 'weekly'; // 'weekly' | 'alltime'
var _lpPrevRanks = {}; // userId -> previous rank (for rank change indicators)
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

export function openLeaderPage() {
  document.getElementById('leaderPage').classList.add('open');
  var srvBtn = document.getElementById('srvLeaderBtn');
  if (srvBtn) srvBtn.classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navBtn = document.getElementById('navLeader');
  if (navBtn) navBtn.classList.add('active');
  _startLpStars();
  loadLeaderboard();
}

export function closeLeaderPage() {
  document.getElementById('leaderPage').classList.remove('open');
  _stopLpStars();
  var srvBtn = document.getElementById('srvLeaderBtn');
  if (srvBtn) srvBtn.classList.remove('active');
  if (appMode === 'home') {
    document.querySelectorAll('.sb-nav-item').forEach(function(n) { n.classList.remove('active'); });
    var navHome = document.getElementById('navHome');
    if (navHome) navHome.classList.add('active');
  }
}

export function lpSwitchPeriod(period) {
  _lpPeriod = period;
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
  body.innerHTML = '<div class="lp-loading"><div class="lp-loading-dot"></div><div class="lp-loading-dot"></div><div class="lp-loading-dot"></div></div>';
  podium.innerHTML = '';
  myRank.style.display = 'none';
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

    // For weekly: filter out users with 0 trades this week (they didn't participate)
    var displayEntries = entries;
    if (_lpPeriod === 'weekly') {
      var active = entries.filter(function(e) { return e.trades > 0 || e.pnl !== 0; });
      if (active.length > 0) displayEntries = active;
    }

    if (!displayEntries.length) {
      podium.innerHTML = '';
      body.innerHTML = '<div class="lp-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;opacity:.15"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg><div>No traders yet</div><div style="font-size:11px;margin-top:4px;opacity:.5">Start Paper Trading to appear here!</div></div>';
      return;
    }

    // Save current ranks for next comparison
    _saveCurRanks(displayEntries);

    // ── Build podium (top 3) ──
    _renderPodium(displayEntries.slice(0, 3));

    // ── My rank strip ──
    _renderMyRank(displayEntries);

    // ── List (rank 4+) ──
    var listEntries = displayEntries.slice(3);
    if (!listEntries.length) {
      body.innerHTML = '';
      return;
    }

    body.innerHTML = listEntries.map(function(e, idx) {
      var rank = idx + 4;
      var isMe = ME && e.userId === ME.id;
      var pnlUp = e.pctReturn >= 0;

      // Rank change
      var prevRank = _lpPrevRanks[e.userId];
      var changeHtml = '';
      if (prevRank && prevRank !== rank) {
        var diff = prevRank - rank;
        if (diff > 0) changeHtml = '<span class="lp-rank-chg up">\u25B2+' + diff + '</span>';
        else changeHtml = '<span class="lp-rank-chg down">\u25BC' + diff + '</span>';
      }

      return '<div class="lp-item' + (isMe ? ' me' : '') + '" style="animation-delay:' + (idx * 30) + 'ms">' +
        '<div class="lp-rank">' + rank + changeHtml + '</div>' +
        '<div class="lp-av">' + (e.prof.photo ? '<img src="' + escH(e.prof.photo) + '">' : escH(e.prof.avatar || '?')) + '</div>' +
        '<div class="lp-uinfo">' +
          '<div class="lp-uname nf-' + (e.prof.name_font || 'default') + '"' + (e.prof.name_color ? ' style="color:' + e.prof.name_color + '"' : '') + '>' + escH(e.prof.username) + (isMe ? ' <span class="lp-you">(you)</span>' : '') + '</div>' +
          '<div class="lp-utype">' + (_lpPeriod === 'weekly' ? e.trades + ' trades this week' : 'Paper Portfolio') + '</div>' +
        '</div>' +
        '<div class="lp-val">' +
          '<div class="lp-pct ' + (pnlUp ? 'up' : 'down') + '">' + (pnlUp ? '+' : '') + e.pctReturn.toFixed(2) + '%</div>' +
          '<div class="lp-total">\u20B9' + stk_fmtIN(e.total) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

  } catch (err) {
    body.innerHTML = '<div class="lp-empty">Failed to load.<br>' + escH(err.message) + '</div>';
  }
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

    return '<div class="lp-pod ' + o.pos + (isMe ? ' me' : '') + '">' +
      '<div class="lp-pod-medal">' + medals[o.rank] + '</div>' +
      '<div class="lp-pod-av">' + (e.prof.photo ? '<img src="' + escH(e.prof.photo) + '">' : '<span>' + escH(e.prof.avatar || '?') + '</span>') + '</div>' +
      '<div class="lp-pod-name nf-' + (e.prof.name_font || 'default') + '"' + (e.prof.name_color ? ' style="color:' + e.prof.name_color + '"' : '') + '>' + escH(e.prof.username) + '</div>' +
      '<div class="lp-pod-pct ' + (pnlUp ? 'up' : 'down') + '">' + (pnlUp ? '+' : '') + e.pctReturn.toFixed(2) + '%</div>' +
      '<div class="lp-pod-val">\u20B9' + stk_fmtIN(e.total) + '</div>' +
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

  // Rank change
  var prevRank = _lpPrevRanks[ME.id];
  var changeHtml = '';
  if (prevRank && prevRank !== rank) {
    var diff = prevRank - rank;
    if (diff > 0) changeHtml = '<span class="lp-myrank-chg up">\u25B2 +' + diff + ' today</span>';
    else changeHtml = '<span class="lp-myrank-chg down">\u25BC ' + Math.abs(diff) + ' today</span>';
  }

  strip.style.display = '';
  strip.innerHTML =
    '<div class="lp-myrank-left">' +
      '<div class="lp-myrank-pos">#' + rank + ' <span class="lp-myrank-of">of ' + totalPlayers + '</span></div>' +
      changeHtml +
    '</div>' +
    '<div class="lp-myrank-right">' +
      '<div class="lp-myrank-pct ' + (pnlUp ? 'up' : 'down') + '">' + (pnlUp ? '+' : '') + myEntry.pctReturn.toFixed(2) + '%</div>' +
      '<div class="lp-myrank-val">\u20B9' + stk_fmtIN(myEntry.total) + '</div>' +
    '</div>';
}
