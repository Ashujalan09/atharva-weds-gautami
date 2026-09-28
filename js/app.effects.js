/* ============================================================
   Effects: petals, custom cursor
   Extracted from the original single-file invitation.
   Depends on: none
   ============================================================ */

/* ============================================================
   PETALS
   ============================================================ */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const container = document.getElementById('petals');
  if (!container) return;
  const count = window.innerWidth < 768 ? 14 : 22;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.style.left = Math.random() * 100 + '%';
    const dur = 14 + Math.random() * 12;
    p.style.animationDuration = dur + 's';
    p.style.animationDelay = (-Math.random() * dur) + 's';
    p.style.transform = `scale(${0.6 + Math.random() * 0.9})`;
    p.style.opacity = 0.3 + Math.random() * 0.4;
    container.appendChild(p);
  }
})();

/* ============================================================
   CURSOR
   ============================================================ */
(function() {
  const isTouch = window.matchMedia('(hover: none)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || reduceMotion) return;

  const ring = document.getElementById('cursorRing');
  const dot  = document.getElementById('cursorDot');
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;
  let lastSpark = 0, sparkCount = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    const now = performance.now();
    if (now - lastSpark > 45 && sparkCount < 60) {
      lastSpark = now; sparkCount++;
      spawnSpark(mx, my);
    }
  });

  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  function spawnSpark(x, y) {
    const s = document.createElement('span');
    s.className = 'trail-spark';
    const r = Math.random();
    if (r < 0.4) s.classList.add('marigold');
    else if (r < 0.65) s.classList.add('crimson');
    s.style.left = (x + (Math.random() - 0.5) * 12) + 'px';
    s.style.top  = (y + (Math.random() - 0.5) * 12) + 'px';
    const size = 2 + Math.random() * 3;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    document.body.appendChild(s);
    setTimeout(() => { s.remove(); sparkCount = Math.max(0, sparkCount - 1); }, 800);
  }

  const interactive = 'a, button, [role="button"], input, select, textarea, label';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) document.body.classList.remove('cursor-hover');
  });

  const sections = document.querySelectorAll('[data-cursor-theme]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const theme = e.target.dataset.cursorTheme;
        document.body.classList.toggle('cursor-dark', theme === 'dark');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => io.observe(s));
})();
