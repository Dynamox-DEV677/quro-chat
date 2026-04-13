// ═══════════════════════════════════════
// Cinematic Splash Intro v2 — 3.5s
// Particles → Neon reveal → Glitch → Beat drop → Morph out
// ═══════════════════════════════════════

let _done = false;

// ── Particle system on <canvas> ──
function initParticles(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = Math.min(90, Math.round(W * H / 12000));
  const particles = [];

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.5,
      r: 1 + Math.random() * 2,
      a: 0,                              // start invisible
      aTarget: 0.08 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    });
  }

  let t = 0;
  let burst = false;
  let burstT = 0;

  function frame() {
    if (_done) return;
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    // Fade particles in over first 0.8s
    const fadeIn = Math.min(t / 0.8, 1);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.02 * p.speed;

      // Wrap
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;

      // Opacity: fade in + pulse
      p.a = p.aTarget * fadeIn * (0.6 + 0.4 * Math.sin(p.phase));

      // On burst: push outward from center
      if (burst) {
        const dx = p.x - W / 2;
        const dy = p.y - H / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.max(0, 1 - burstT / 0.6) * 3;
        p.vx += (dx / dist) * force * 0.3;
        p.vy += (dy / dist) * force * 0.3;
      }

      // Dampen velocity
      p.vx *= 0.995;
      p.vy *= 0.997;

      // Draw
      const glow = p.r * 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56,161,105,${p.a})`;
      ctx.fill();

      // Soft glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56,161,105,${p.a * 0.15})`;
      ctx.fill();
    }

    // Connection lines between close particles
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 8000) {
          const alpha = (1 - d2 / 8000) * 0.08 * fadeIn;
          ctx.strokeStyle = `rgba(56,161,105,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    if (burst) burstT += 0.016;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    burst() { burst = true; burstT = 0; },
    destroy() { _done = true; }
  };
}

// ── Timeline orchestrator ──
function runTimeline(engine) {
  const center = document.querySelector('.sp-center');
  const glow = document.querySelector('.sp-glow');
  const flash = document.querySelector('.sp-flash');
  const ripple = document.querySelector('.sp-ripple');
  const scanlines = document.querySelector('.sp-scanlines');
  const splash = document.getElementById('splashScreen');

  if (!center || !splash) return;

  // T+0ms: Particles already running, black screen with faint dust
  // T+400ms: Logo + title fade in with blur-to-sharp
  setTimeout(() => {
    center.classList.add('in');
    if (scanlines) scanlines.classList.add('in');
  }, 400);

  // T+1000ms: Tagline slides in
  setTimeout(() => {
    const tag = document.querySelector('.sp-tagline');
    if (tag) tag.classList.add('in');
  }, 1000);

  // T+1500ms: Glow pulse synced with imagined bass
  setTimeout(() => {
    if (glow) glow.classList.add('pulse');
  }, 1500);

  // T+2000ms: Quick glitch distortion
  setTimeout(() => {
    center.classList.add('glitch');
    setTimeout(() => center.classList.remove('glitch'), 400);
  }, 2000);

  // T+2600ms: BEAT DROP — flash + shake + ripple + particle burst
  setTimeout(() => {
    // Flash
    if (flash) { flash.classList.add('fire'); }
    // Shake
    center.classList.add('shake');
    // Ripple
    if (ripple) { ripple.classList.add('fire'); }
    // Particle burst
    engine.burst();

    setTimeout(() => center.classList.remove('shake'), 400);
  }, 2600);

  // T+3200ms: Start zoom-morph exit
  setTimeout(() => {
    exitSplash(splash, engine);
  }, 3200);
}

function exitSplash(splash, engine) {
  if (_done) return;
  _done = true;

  splash.classList.add('exit', 'done');

  setTimeout(() => {
    splash.classList.add('hidden');
    splash.style.display = 'none';
    engine.destroy();

    // Reveal auth screen
    const auth = document.getElementById('authScreen');
    if (auth) {
      auth.style.opacity = '0';
      auth.style.display = 'flex';
      requestAnimationFrame(() => {
        auth.style.transition = 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)';
        auth.style.opacity = '1';
      });
    }
  }, 850);
}

// ── Public API ──
export function initSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  const auth = document.getElementById('authScreen');
  if (auth) auth.style.display = 'none';

  const canvas = document.getElementById('splashCanvas');
  if (!canvas) return;

  const engine = initParticles(canvas);
  runTimeline(engine);

  // Click/tap to skip
  splash.addEventListener('click', () => {
    if (!_done) exitSplash(splash, engine);
  });
}
