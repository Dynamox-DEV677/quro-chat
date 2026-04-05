// ═══ Auth Screen — Floating Bubbles Animation ═══
// Renders soft, glowing bubbles that float, wobble, and pop on the login screen

var _bubbleRAF = null;
var _bubbles = [];
var _popParticles = [];

export function startAuthBubbles() {
  var cv = document.getElementById('authBubbles');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w, h;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Bubble colors — very subtle, white/green tints
  var colors = [
    { r: 255, g: 255, b: 255 },  // white
    { r: 61, g: 168, b: 122 },   // brand green
    { r: 120, g: 200, b: 160 },  // light green
    { r: 200, g: 220, b: 210 },  // pale mint
  ];

  // Spawn initial bubbles
  var count = Math.min(Math.floor(w * h / 25000), 30);
  count = Math.max(count, 12);
  for (var i = 0; i < count; i++) {
    _bubbles.push(makeBubble(true));
  }

  function makeBubble(initial) {
    var r = 4 + Math.random() * 28;
    var col = colors[Math.floor(Math.random() * colors.length)];
    return {
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + r + Math.random() * 60,
      r: r,
      baseR: r,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.15 + Math.random() * 0.5),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.008 + Math.random() * 0.015,
      wobbleAmp: 0.5 + Math.random() * 1.5,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
      opacity: 0.03 + Math.random() * 0.08,
      maxOpacity: 0.03 + Math.random() * 0.08,
      col: col,
      life: 1,
      fadeIn: initial ? 1 : 0,
    };
  }

  function spawnPop(x, y, r, col) {
    var n = 4 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 / n) * i + Math.random() * 0.5;
      var speed = 0.5 + Math.random() * 1.5;
      _popParticles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random() * 2.5,
        opacity: 0.15 + Math.random() * 0.1,
        col: col,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    // Update and draw bubbles
    for (var i = _bubbles.length - 1; i >= 0; i--) {
      var b = _bubbles[i];

      // Fade in
      if (b.fadeIn < 1) b.fadeIn = Math.min(1, b.fadeIn + 0.008);

      // Wobble
      b.wobblePhase += b.wobbleSpeed;
      b.x += b.vx + Math.sin(b.wobblePhase) * b.wobbleAmp * 0.15;
      b.y += b.vy;

      // Pulse radius
      b.pulsePhase += b.pulseSpeed;
      b.r = b.baseR + Math.sin(b.pulsePhase) * b.baseR * 0.08;

      var alpha = b.opacity * b.fadeIn;

      // Draw bubble
      // Outer glow
      var grd = ctx.createRadialGradient(b.x, b.y, b.r * 0.2, b.x, b.y, b.r);
      grd.addColorStop(0, 'rgba(' + b.col.r + ',' + b.col.g + ',' + b.col.b + ',' + (alpha * 0.6) + ')');
      grd.addColorStop(0.5, 'rgba(' + b.col.r + ',' + b.col.g + ',' + b.col.b + ',' + (alpha * 0.3) + ')');
      grd.addColorStop(1, 'rgba(' + b.col.r + ',' + b.col.g + ',' + b.col.b + ',0)');
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Subtle ring/edge
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + b.col.r + ',' + b.col.g + ',' + b.col.b + ',' + (alpha * 0.5) + ')';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Highlight (top-left shine)
      var hx = b.x - b.r * 0.3;
      var hy = b.y - b.r * 0.3;
      var hGrd = ctx.createRadialGradient(hx, hy, 0, hx, hy, b.r * 0.5);
      hGrd.addColorStop(0, 'rgba(255,255,255,' + (alpha * 0.4) + ')');
      hGrd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(hx, hy, b.r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = hGrd;
      ctx.fill();

      // Remove if off-screen (top)
      if (b.y < -b.r * 2) {
        // Pop effect when bubble disappears at top
        if (b.baseR > 8) spawnPop(b.x, 0, b.r, b.col);
        _bubbles.splice(i, 1);
      }
    }

    // Draw pop particles
    for (var i = _popParticles.length - 1; i >= 0; i--) {
      var p = _popParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravity
      p.life -= p.decay;
      if (p.life <= 0) { _popParticles.splice(i, 1); continue; }

      var a = p.opacity * p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.col.r + ',' + p.col.g + ',' + p.col.b + ',' + a + ')';
      ctx.fill();
    }

    // Spawn new bubbles to maintain count
    var target = Math.min(Math.floor(w * h / 25000), 30);
    target = Math.max(target, 12);
    while (_bubbles.length < target) {
      _bubbles.push(makeBubble(false));
    }

    // Randomly pop a bubble (1% chance per frame)
    if (_bubbles.length > 5 && Math.random() < 0.006) {
      var idx = Math.floor(Math.random() * _bubbles.length);
      var b = _bubbles[idx];
      if (b.fadeIn >= 1 && b.baseR > 6) {
        spawnPop(b.x, b.y, b.r, b.col);
        _bubbles.splice(idx, 1);
      }
    }

    _bubbleRAF = requestAnimationFrame(tick);
  }

  tick();
}

export function stopAuthBubbles() {
  if (_bubbleRAF) { cancelAnimationFrame(_bubbleRAF); _bubbleRAF = null; }
  _bubbles = [];
  _popParticles = [];
}
