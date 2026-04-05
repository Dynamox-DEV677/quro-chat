// ═══════════════════════════════════════
// Splash Intro Animation — ~8s total
// ═══════════════════════════════════════

const WORDS = ['Chat', 'Community', 'Stocks'];

let _splashDone = false;

function spawnParticles() {
  const container = document.getElementById('splashParticles');
  if (!container) return;

  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'splash-particle';
    const size = 2 + Math.random() * 4;
    p.style.setProperty('--size', size + 'px');
    p.style.setProperty('--dur', (5 + Math.random() * 6) + 's');
    p.style.setProperty('--delay', (Math.random() * 4) + 's');
    p.style.setProperty('--dist', -(80 + Math.random() * 200) + 'px');
    p.style.setProperty('--opa', (0.15 + Math.random() * 0.3).toFixed(2));
    p.style.left = (5 + Math.random() * 90) + '%';
    p.style.top = (50 + Math.random() * 45) + '%';
    container.appendChild(p);
  }

  for (let i = 0; i < 10; i++) {
    const b = document.createElement('div');
    b.className = 'splash-bubble';
    const size = 12 + Math.random() * 40;
    b.style.setProperty('--size', size + 'px');
    b.style.setProperty('--dur', (7 + Math.random() * 6) + 's');
    b.style.setProperty('--delay', (Math.random() * 5) + 's');
    b.style.setProperty('--dist', -(60 + Math.random() * 150) + 'px');
    b.style.left = (10 + Math.random() * 80) + '%';
    b.style.top = (55 + Math.random() * 40) + '%';
    container.appendChild(b);
  }
}

// Type one character at a time — 180ms per char
function typeWord(el, word) {
  return new Promise(resolve => {
    let i = 0;
    function next() {
      if (i >= word.length) { resolve(); return; }
      el.textContent += word[i];
      i++;
      setTimeout(next, 180);
    }
    next();
  });
}

// Delete one character at a time — 100ms per char
function deleteWord(el) {
  return new Promise(resolve => {
    function next() {
      const t = el.textContent;
      if (t.length <= 0) { resolve(); return; }
      el.textContent = t.slice(0, -1);
      setTimeout(next, 100);
    }
    next();
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTypewriter() {
  const el = document.getElementById('splashTyper');
  if (!el) return;

  // 2s — let logo + QURO text animate in and settle
  await wait(2000);

  // ── Word 1: "Chat" ──
  // type: 4 × 180ms = 720ms
  await typeWord(el, 'Chat');
  // hold on screen 1.5s so user reads it
  await wait(1500);
  // delete: 4 × 100ms = 400ms
  await deleteWord(el);
  // pause before next word
  await wait(600);

  // ── Word 2: "Community" ──
  // type: 9 × 180ms = 1620ms
  await typeWord(el, 'Community');
  // hold on screen 1.5s
  await wait(1500);
  // delete: 9 × 100ms = 900ms
  await deleteWord(el);
  // pause before next word
  await wait(600);

  // ── Word 3: "Stocks" ──
  // type: 6 × 180ms = 1080ms
  await typeWord(el, 'Stocks');
  // hold final word 2s
  await wait(2000);

  // ── Total: 2000 + 720+1500+400+600 + 1620+1500+900+600 + 1080+2000 = ~12.9s
  // Then zoom transition ~1.2s

  zoomToSite();
}

function zoomToSite() {
  if (_splashDone) return;
  _splashDone = true;

  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  splash.classList.add('zoom-out');

  setTimeout(() => {
    splash.classList.add('hidden');
    const auth = document.getElementById('authScreen');
    if (auth) {
      auth.style.opacity = '0';
      auth.style.display = 'flex';
      requestAnimationFrame(() => {
        auth.style.transition = 'opacity .8s cubic-bezier(.4,0,.2,1)';
        auth.style.opacity = '1';
      });
    }
  }, 1200);
}

export function initSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  const auth = document.getElementById('authScreen');
  if (auth) auth.style.display = 'none';

  spawnParticles();
  runTypewriter();

  // Click/tap to skip
  splash.addEventListener('click', () => {
    if (!_splashDone) zoomToSite();
  });
}
