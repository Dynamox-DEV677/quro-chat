// ═══ Auth Screen — Starfield + Shooting Stars ═══

var _starRAF = null;
var _stars = [];

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
    if (_stars.length === 0) spawnStars();
  }
  resize();
  window.addEventListener('resize', resize);

  function spawnStars() {
    _stars = [];
    var count = Math.min(Math.floor(w * h / 4000), 200);
    count = Math.max(count, 60);
    for (var i = 0; i < count; i++) {
      _stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.3 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.025,
        baseAlpha: 0.15 + Math.random() * 0.65,
        color: Math.random() < 0.7 ? 255 : (Math.random() < 0.5 ? 200 : 180),
        g: Math.random() < 0.3 ? 220 : 255,
        b: Math.random() < 0.2 ? 180 : 255,
      });
    }
  }

  // Shooting star state
  var shootingStar = null;
  var shootTimer = 0;

  function spawnShootingStar() {
    shootingStar = {
      x: Math.random() * w * 0.6 + w * 0.2,
      y: Math.random() * h * 0.3,
      vx: 3 + Math.random() * 4,
      vy: 1.5 + Math.random() * 2,
      life: 1,
      len: 30 + Math.random() * 50,
    };
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    // ─── Draw stars ───
    for (var i = 0; i < _stars.length; i++) {
      var s = _stars[i];
      s.phase += s.speed;
      var alpha = s.baseAlpha * (0.4 + 0.6 * Math.abs(Math.sin(s.phase)));

      // Cross-shaped rays for larger stars
      if (s.r > 1.2) {
        ctx.strokeStyle = 'rgba(' + s.color + ',' + s.g + ',' + s.b + ',' + (alpha * 0.3) + ')';
        ctx.lineWidth = 0.5;
        var rayLen = s.r * 2;
        ctx.beginPath();
        ctx.moveTo(s.x - rayLen, s.y);
        ctx.lineTo(s.x + rayLen, s.y);
        ctx.moveTo(s.x, s.y - rayLen);
        ctx.lineTo(s.x, s.y + rayLen);
        ctx.stroke();
      }

      // Star dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.color + ',' + s.g + ',' + s.b + ',' + alpha + ')';
      ctx.fill();

      // Glow
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

    // ─���─ Shooting star ───
    shootTimer++;
    if (!shootingStar && shootTimer > 300 && Math.random() < 0.005) {
      spawnShootingStar();
      shootTimer = 0;
    }
    if (shootingStar) {
      var ss = shootingStar;
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= 0.012;
      if (ss.life <= 0) {
        shootingStar = null;
      } else {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var ssGrad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * ss.len * 0.3, ss.y - ss.vy * ss.len * 0.3);
        ssGrad.addColorStop(0, 'rgba(255,255,255,' + (ss.life * 0.8) + ')');
        ssGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = ssGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * ss.len * 0.3, ss.y - ss.vy * ss.len * 0.3);
        ctx.stroke();
        // Head glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (ss.life * 0.6) + ')';
        ctx.fill();
        ctx.restore();
      }
    }

    _starRAF = requestAnimationFrame(tick);
  }

  tick();
}

export function stopAuthBubbles() {
  if (_starRAF) { cancelAnimationFrame(_starRAF); _starRAF = null; }
  _stars = [];
}
