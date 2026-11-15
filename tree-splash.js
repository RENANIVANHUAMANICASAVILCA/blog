(() => {
  const DURATION = 20000;
  const root = document.createElement('div');
  root.id = 'tree-splash';
  root.innerHTML = '<canvas aria-label="Árbol navideño de partículas"></canvas><audio preload="auto" autoplay loop src="tree-audio.m4a"></audio>';
  const style = document.createElement('style');
  style.textContent = '#tree-splash{position:fixed;inset:0;z-index:2147483647;background:#000;opacity:1;transition:opacity 1.2s ease;overflow:hidden}#tree-splash.is-done{opacity:0;pointer-events:none}#tree-splash canvas{display:block;width:100%;height:100%}';
  document.head.appendChild(style);
  document.body.appendChild(root);
  const canvas = root.querySelector('canvas');
  const audio = root.querySelector('audio');
  const ctx = canvas.getContext('2d', { alpha: false });
  const colors = ['#2f9a62', '#65ca8b', '#b8e8bd', '#f2c94c', '#fff0a6', '#dc393e', '#326bd0'];
  let width = 0, height = 0, ratio = 1, started = performance.now(), rotation = 0, last = started;
  const points = [], stars = [];
  let seed = 3481;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  function resize() { width = innerWidth; height = innerHeight; ratio = Math.min(devicePixelRatio || 1, 1.5); canvas.width = width * ratio; canvas.height = height * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); }
  function add(x, y, z, color, size, phase) { points.push({ x, y, z, color, size, phase }); }
  for (let i = 0; i < 4200; i++) { const t = random(), y = .18 + t * 2.9, r = (1 - t) * (.82 + random() * .14) * Math.sqrt(random()), a = random() * Math.PI * 2; add(Math.cos(a) * r, y, Math.sin(a) * r, colors[random() < .12 ? 2 : random() < .18 ? 1 : 0], .6 + random() * .8, random() * 6.28); }
  for (let i = 0; i < 650; i++) { const t = random(), a = t * Math.PI * 2 * 5.2, r = (1 - t) * .94 + .04; add(Math.cos(a) * r, .25 + t * 2.72, Math.sin(a) * r, i % 12 ? colors[3] : colors[4], i % 12 ? .7 : 1.7, random() * 6.28); }
  for (let i = 0; i < 28; i++) { const t = .1 + i / 34 * .82, a = i * 2.399, r = (1 - t) * .9; add(Math.cos(a) * r, .3 + t * 2.7, Math.sin(a) * r, i % 3 ? colors[5] : colors[6], 2.2, random() * 6.28); }
  for (let i = 0; i < 240; i++) stars.push({ x: random(), y: random(), r: .3 + random() * 1.2, p: random() * 6.28 });
  resize(); addEventListener('resize', resize, { passive: true });
  function frame(now) {
    const elapsed = now - started, dt = Math.min(.04, (now - last) / 1000); last = now; rotation += dt * .56;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
    for (const star of stars) { ctx.globalAlpha = .2 + .55 * (.5 + .5 * Math.sin(elapsed * .001 + star.p)); ctx.fillStyle = '#d9e6f0'; ctx.fillRect(star.x * width, star.y * height, star.r, star.r); }
    const scale = Math.min(width * .43, height * .24), base = height * .82, top = base - scale * 3.25, progress = Math.min(1, elapsed / 7500);
    const visible = Math.floor(points.length * Math.min(1, progress * 1.12));
    ctx.globalAlpha = 1;
    for (let i = 0; i < visible; i++) { const p = points[i], ease = Math.min(1, Math.max(0, (progress - p.y / 3.55) * 2.1)), drift = 1 - ease, orbit = p.phase + drift * 6.28, x = p.x + Math.cos(orbit) * drift * .48, z = p.z + Math.sin(orbit) * drift * .48, cs = Math.cos(rotation), sn = Math.sin(rotation), xx = x * cs + z * sn, zz = z * cs - x * sn, f = 4.7 / (4.7 + zz * .4), px = width * .5 + xx * scale * f, py = base - (p.y - drift * .28) * scale * f; ctx.globalAlpha = .38 + ease * .62; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py, Math.max(.7, p.size * f), 0, Math.PI * 2); ctx.fill(); }
    if (progress > .7) { const a = (progress - .7) / .3, sx = width * .5, sy = top - 12; ctx.globalAlpha = a; ctx.fillStyle = '#ffe58b'; ctx.shadowColor = '#ffe58b'; ctx.shadowBlur = 20; ctx.beginPath(); for (let i = 0; i < 10; i++) { const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? 7 : 17; ctx.lineTo(sx + Math.cos(angle) * radius, sy + Math.sin(angle) * radius); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; }
    if (elapsed < DURATION) requestAnimationFrame(frame); else { root.classList.add('is-done'); setTimeout(() => root.remove(), 1300); }
  }
  audio.volume = .82; audio.play().catch(() => { const unlock = () => { audio.play().catch(() => {}); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); }; addEventListener('pointerdown', unlock, { once: true, passive: true }); addEventListener('keydown', unlock, { once: true }); });
  requestAnimationFrame(frame);
})();
