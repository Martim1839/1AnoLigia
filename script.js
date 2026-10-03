// Domingo, 4 de outubro de 2026, às 00:00 em Portugal continental (WEST, UTC+1)
// Fixo em qualquer fuso horário: o contador termina no mesmo instante em todos os dispositivos
const FINAL_TARGET = new Date('2026-10-04T00:00:00+01:00').getTime();
let target = FINAL_TARGET > Date.now() ? FINAL_TARGET : Date.now() + 2000;   // se a data já passou, mostra 2 s de contador e arranca a experiência
let tickTimer = null, endTimer = null, transitioning = false;

const app = document.getElementById('app');
const canvas = document.getElementById('rain');
const ctx = canvas.getContext('2d');
const els = {
  d: document.getElementById('d'),
  h: document.getElementById('h'),
  m: document.getElementById('m'),
  s: document.getElementById('s')
};
const pad = n => String(n).padStart(2, '0');

/* ---------- Transição binária ---------- */
const RAIN_COLOR = '244,241,236'; // RGB da chuva (ex.: '0,255,140' para verde)
const RAIN_MS = 4500;             // duração da chuva antes de passar ao ecrã seguinte
let rafId = null, rainStart = 0, lastStep = 0, size = 16, cols = 0, heads = [], threshold = [];

function setupRain() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  size = Math.max(14, Math.round(Math.min(innerWidth, innerHeight) / 30));
  cols = Math.ceil(innerWidth / size);
  heads = Array.from({ length: cols }, () => -Math.random() * 20);
  threshold = Array.from({ length: cols }, () => Math.random());
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.font = size + 'px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
}

function frame(now) {
  rafId = requestAnimationFrame(frame);
  if (now - lastStep < 45) return;
  lastStep = now;
  const t = Math.min(1, (now - rainStart) / 2500);      // a chuva vai ficando mais densa
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.fillStyle = 'rgba(' + RAIN_COLOR + ',0.9)';
  for (let i = 0; i < cols; i++) {
    if (threshold[i] > 0.15 + t * 0.85) continue;       // coluna ainda inativa
    const y = heads[i] * size;
    ctx.fillText(Math.random() < 0.5 ? '0' : '1', i * size + size / 2, y);
    heads[i] += 1;
    if (y > innerHeight && Math.random() > 0.96) heads[i] = 0;
  }
}

function stopRain() { cancelAnimationFrame(rafId); rafId = null; }

function startTransition() {
  if (transitioning) return;
  transitioning = true;
  app.classList.add('leaving');                          // o contador desvanece
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    endTimer = setTimeout(finish, 800);
    return;
  }
  setupRain();
  rainStart = performance.now();
  canvas.classList.add('on');
  rafId = requestAnimationFrame(frame);
  endTimer = setTimeout(finish, RAIN_MS);
}

// Depois da chuva: ecrã preto e só então começa a história (no fim dela entra o mini-jogo)
function finish() {
  app.classList.add('finished');
  canvas.classList.remove('on');                         // a chuva dissolve-se
  endTimer = setTimeout(stopRain, RAIN_FADE_MS + 200);
  bipTimer = setTimeout(startStory, RAIN_FADE_MS + BLACK_MS);
}

/* ---------- Bip, a mascote ---------- */
const RAIN_FADE_MS = 800;   // tempo que a chuva demora a desaparecer
const BLACK_MS = 1000;      // tempo com o ecrã todo preto antes de o Bip entrar
const FLIGHT_MS = 6000;     // duração do voo até parar no meio
const bipEl = document.getElementById('bip');
const dot = document.getElementById('dot');
let bipTimer = null, flightRaf = null;
const smooth = x => x * x * (3 - 2 * x);

// Posição e tamanho do Bip no instante u (0 = início do voo, 1 = parado no centro)
function place(u) {
  const w = innerWidth, h = innerHeight;
  const path = Math.pow(1 - u, 1.6);                 // o percurso vai-se fechando até ao centro
  const depth = 1 - u;                               // a profundidade também acalma
  const a = 2 * Math.PI * 1.1 * u + 0.9;
  const entry = 1 - smooth(Math.min(1, u / 0.3));    // entra vindo de fora do ecrã
  const x = w * 0.30 * path * Math.sin(a) + w * 0.65 * entry;
  const y = h * 0.22 * path * Math.sin(2 * a) - h * 0.60 * entry;
  // longe (pequeno) -> perto (grande) -> longe ... e assenta em tamanho normal
  const d = -Math.cos(2 * Math.PI * 1.25 * u);
  const scale = Math.exp(Math.log(7) * depth * d);
  bipEl.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
}

function startFlight() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  place(1);
  if (reduced) { app.classList.add('flying'); bipTimer = setTimeout(speak, 600); return; }
  place(0);
  app.classList.add('flying');
  const t0 = performance.now();
  (function step(now) {
    const u = Math.min(1, (now - t0) / FLIGHT_MS);
    place(u);
    if (u < 1) flightRaf = requestAnimationFrame(step);
    else { bipEl.style.transform = ''; bipTimer = setTimeout(speak, 600); }   // pára no meio e fala
  })(t0);
}

/* ---- Fala, explosão e flor ---- */
const SPEECH = 'De vez em quando o mundo para, e eu pergunto-me se ainda tens um cantinho na memória para mim.';
const bubble = document.getElementById('bubble');
const bfull = document.getElementById('bfull');
const blive = document.getElementById('blive');
const fx = document.getElementById('fx');
const fctx = fx.getContext('2d');
const flower = document.getElementById('flower');
let fxRaf = null;

function speak() {
  bfull.textContent = SPEECH; blive.textContent = '';
  // texto escrito + resto invisível: o texto está centrado e cada letra aparece já no sítio onde vai ficar
  const bTyped = document.createTextNode(''), bRest = document.createElement('span');
  bRest.style.visibility = 'hidden'; bRest.textContent = SPEECH; blive.append(bTyped, bRest);
  bubble.classList.add('show');
  let n = 0;
  (function type() {
    ++n; bTyped.data = SPEECH.slice(0, n); bRest.textContent = SPEECH.slice(n);
    if (n < SPEECH.length) {
      const c = SPEECH[n - 1];
      bipTimer = setTimeout(type, c === ',' ? 260 : c === '.' ? 400 : 55);
      return;
    }
    bipTimer = setTimeout(() => {                    // tempo para ler, depois o balão desaparece
      bubble.classList.remove('show');
      bipTimer = setTimeout(explode, 700);
    }, 2800);
  })();
}

function explode() {
  const r = dot.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fx.width = Math.floor(innerWidth * dpr); fx.height = Math.floor(innerHeight * dpr);
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = Math.max(0.6, innerHeight / 900), g = 1500 * k;
  const px = Math.max(3, Math.round(rad / 5));
  const parts = [];
  for (let gx = -rad; gx < rad; gx += px) {
    for (let gy = -rad; gy < rad; gy += px) {
      const mx = gx + px / 2, my = gy + px / 2;
      if (mx * mx + my * my > rad * rad) continue;   // só píxeis dentro do círculo
      const ang = Math.atan2(my, mx) + (Math.random() - 0.5) * 0.6;
      const sp = (120 + Math.random() * 380) * k;
      parts.push({ x: cx + gx, y: cy + gy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 200 * k });
    }
  }
  dot.style.visibility = 'hidden';                   // o ponto passa a ser feito de píxeis
  let last = performance.now();
  (function step(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    fctx.fillStyle = '#fff';
    let alive = 0;
    for (const p of parts) {
      if (p.y > innerHeight + px) continue;          // já saiu do ecrã
      p.vy += g * dt; p.vx *= 1 - 0.6 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      fctx.fillRect(p.x, p.y, px, px); alive++;
    }
    if (alive) fxRaf = requestAnimationFrame(step);
    else bipTimer = setTimeout(growFlower, FLOWER_DELAY_MS);
  })(last);
}

/* ---- Flor ---- */
const FLOWER_DELAY_MS = 2500;   // pausa em preto entre o Bip explodir e a flor começar a crescer
function growFlower() { flower.classList.add('grow'); bipTimer = setTimeout(askTouch, FLOWER_READY_MS); }

/* ---- Cor: o utilizador clica na flor e ela espalha energia que dá cor a tudo ---- */
const FLOWER_READY_MS = 6200;   // tempo até a flor acabar de abrir e aparecer o pedido para clicar
const BLOOM_S = 3.4;            // duração da onda de cor a cobrir o ecrã
const TAU = Math.PI * 2;
const hintEl = document.getElementById('hint');
const colorCv = document.getElementById('color');
const cctx = colorCv.getContext('2d');
const crnd = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const BL_FLW = ['#ff7eb6', '#ffd166', '#ffffff', '#ff9f68', '#b28dff'];
let bloomRaf = null, bloomStart = 0, blW = 0, blH = 0, blX = 0, blY = 0, blMax = 0, blK = 1;

function askTouch() {
  flower.classList.add('ready');
  flower.setAttribute('tabindex', '0'); flower.setAttribute('role', 'button'); flower.setAttribute('aria-label', 'Flor');
  hintEl.classList.add('show');
}

function setupBloom() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  blW = innerWidth; blH = innerHeight; blK = Math.max(0.6, blH / 900);
  colorCv.width = Math.floor(blW * dpr); colorCv.height = Math.floor(blH * dpr);
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = flower.getBoundingClientRect();
  blX = r.left + r.width / 2; blY = r.top + r.height * 0.3;                  // o centro da flor
  blMax = Math.hypot(Math.max(blX, blW - blX), Math.max(blY, blH - blY)) * 1.02;
}

// O mundo, já com cor: céu, raios de luz, colinas, prado com flores e pétalas a voar
function drawColorWorld(c, t) {
  const sky = c.createLinearGradient(0, 0, 0, blH);
  sky.addColorStop(0, '#4ea3e8'); sky.addColorStop(0.65, '#bfe3ff'); sky.addColorStop(1, '#fff1c9');
  c.fillStyle = sky; c.fillRect(0, 0, blW, blH);
  const sg = c.createRadialGradient(blX, blY, 2, blX, blY, blH * 0.8);
  sg.addColorStop(0, 'rgba(255,246,210,0.7)'); sg.addColorStop(1, 'rgba(255,246,210,0)'); c.fillStyle = sg; c.fillRect(0, 0, blW, blH);
  c.fillStyle = 'rgba(255,246,210,0.1)';
  for (let i = 0; i < 10; i++) {
    const a = i * TAU / 10 + t * 0.12, L = blH * 1.6;
    c.beginPath(); c.moveTo(blX, blY); c.lineTo(blX + Math.cos(a - 0.06) * L, blY + Math.sin(a - 0.06) * L); c.lineTo(blX + Math.cos(a + 0.06) * L, blY + Math.sin(a + 0.06) * L); c.fill();
  }
  [[0.66, 0.16, '#9bd3a8', 1], [0.74, 0.13, '#5fbf7e', 7], [0.82, 0.1, '#3fae62', 13]].forEach(([base, amp, col, seed]) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, blH);
    for (let x = 0; x <= blW + 12; x += 12) c.lineTo(x, blH * base - blH * amp * (0.5 + 0.5 * (0.65 * Math.sin(x * 0.006 + seed) + 0.35 * Math.sin(x * 0.017 + seed * 2.3))));
    c.lineTo(blW + 12, blH); c.fill();
  });
  const y0 = blH * 0.86; c.fillStyle = '#2f8f4e'; c.fillRect(0, y0, blW, blH - y0);
  const n = Math.round(blW / 14);
  for (let i = 0; i < n; i++) {                                              // flores no prado
    const x = i * (blW / n) + crnd(i) * 8, y = y0 + 6 + crnd(i + 9) * (blH - y0 - 8), r = (3 + crnd(i + 3) * 3) * blK;
    const sw = Math.sin(t * 2 + i) * 1.3 * blK;
    c.fillStyle = '#2f8f4e'; c.fillRect(x, y - r * 2, 1.5, r * 2);
    c.fillStyle = BL_FLW[i % 5];
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5; c.beginPath(); c.arc(x + sw + Math.cos(a) * r * 0.7, y - r * 2 + Math.sin(a) * r * 0.7, r * 0.55, 0, TAU); c.fill(); }
    c.fillStyle = '#ffe066'; c.beginPath(); c.arc(x + sw, y - r * 2, r * 0.4, 0, TAU); c.fill();
  }
  c.fillStyle = 'rgba(255,190,220,0.85)';
  for (let i = 0; i < 22; i++) {                                             // pétalas a flutuar
    const x = (crnd(i) * blW + t * 22 * (1 + crnd(i + 5))) % blW, y = (crnd(i + 30) * blH + t * 34) % blH;
    c.beginPath(); c.ellipse(x, y, 5 * blK, 2.4 * blK, t + i, 0, TAU); c.fill();
  }
}

function bloomFrame(now) {
  bloomRaf = requestAnimationFrame(bloomFrame);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = reduced ? BLOOM_S : (now - bloomStart) / 1000, u = Math.min(1, el / BLOOM_S), R = blMax * (1 - Math.pow(1 - u, 2.2));
  cctx.clearRect(0, 0, blW, blH);
  cctx.save(); cctx.beginPath(); cctx.arc(blX, blY, R, 0, TAU); cctx.clip();     // a cor só existe dentro da onda
  drawColorWorld(cctx, reduced ? 0 : el);
  cctx.restore();
  if (u < 1) {                                                                  // a frente da onda brilha
    cctx.save(); cctx.strokeStyle = 'rgba(255,240,210,0.9)'; cctx.lineWidth = 3 + (1 - u) * 10;
    cctx.shadowColor = '#fff'; cctx.shadowBlur = 24; cctx.beginPath(); cctx.arc(blX, blY, R, 0, TAU); cctx.stroke(); cctx.restore();
  }
  if (reduced) return;
  for (let i = 0; i < 4; i++) {                                                 // anéis de energia a sair da flor
    const age = el - i * 0.4;
    if (age <= 0 || age >= 1.6) continue;
    cctx.strokeStyle = 'rgba(255,214,235,' + ((1 - age / 1.6) * 0.7).toFixed(2) + ')'; cctx.lineWidth = 3;
    cctx.beginPath(); cctx.arc(blX, blY, age / 1.6 * Math.min(blW, blH) * 0.6, 0, TAU); cctx.stroke();
  }
  const cols = ['#ffffff', '#ffd1e6', '#fff1a8', '#bfe3ff'];
  for (let k = 0; k < 56; k++) {                                                // faíscas
    const age = el - crnd(k + 7) * 0.5, life = 1.8 + crnd(k + 99) * 1.2;
    if (age <= 0 || age >= life) continue;
    const a = crnd(k) * TAU, d = (120 + crnd(k + 50) * 320) * blK * age;
    cctx.globalAlpha = 1 - age / life; cctx.fillStyle = cols[k % 4];
    cctx.fillRect(blX + Math.cos(a) * d, blY + Math.sin(a) * d, 3 * blK, 3 * blK);
  }
  cctx.globalAlpha = 1;
}

function startBloom() {
  if (!flower.classList.contains('ready')) return;
  flower.classList.remove('ready'); flower.removeAttribute('tabindex'); flower.removeAttribute('role');
  hintEl.classList.remove('show');
  flower.classList.add('color');                                                // a flor também ganha cor
  setupBloom(); colorCv.classList.add('on');
  bloomStart = performance.now(); bloomRaf = requestAnimationFrame(bloomFrame);
}
flower.addEventListener('click', startBloom);
addEventListener('keydown', e => { if (flower.classList.contains('ready') && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); startBloom(); } });

// Flor branca: caule que se desenha, folhas e três camadas de pétalas que abrem
(function buildFlower() {
  const petal = 'M0 0 C -22 -18 -30 -62 0 -96 C 30 -62 22 -18 0 0Z';
  let o = '<path class="stem" pathLength="1" d="M200 600 C 196 510 212 420 200 250"/>';
  o += '<g class="leaf" style="transform-origin:201px 517px;--d:1.3s"><path d="M201 517 C 160 509 120 478 104 432 C 148 434 190 468 201 517Z"/><path class="vein" d="M201 517 C 168 492 138 460 112 428"/></g>';
  o += '<g class="leaf" style="transform-origin:204px 438px;--d:1.8s"><path d="M204 438 C 244 430 282 400 298 354 C 256 356 216 390 204 438Z"/><path class="vein" d="M204 438 C 236 414 268 384 292 358"/></g>';
  o += '<g transform="translate(200 250)">';
  [[8, 0, 1.25, 0], [8, 22.5, 0.98, 0.5], [6, 0, 0.62, 1]].forEach(([n, off, sc, dl], li) => {
    for (let i = 0; i < n; i++) {
      o += '<g transform="rotate(' + (off + i * 360 / n) + ') scale(' + sc + ')"><path class="petal p' + li + '" style="--d:' + (2.6 + dl + i * 0.1).toFixed(2) + 's" d="' + petal + '"/></g>';
    }
  });
  o += '<g class="petal" style="--d:4s"><circle class="core" r="13" fill="#000" stroke="#fff" stroke-width="2"/>';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    o += '<circle class="seed" cx="' + (6.5 * Math.cos(a)).toFixed(1) + '" cy="' + (6.5 * Math.sin(a)).toFixed(1) + '" r="1.7" fill="#fff" stroke="none"/>';
  }
  flower.innerHTML = o + '</g></g>';
})();

function bipStop() {
  clearTimeout(bipTimer); cancelAnimationFrame(flightRaf); cancelAnimationFrame(fxRaf);
  flightRaf = fxRaf = null;
  bipEl.style.transform = '';
  dot.style.visibility = '';
  dot.classList.remove('hop');
  bubble.classList.remove('show'); bfull.textContent = ''; blive.textContent = '';
  fctx.clearRect(0, 0, fx.width, fx.height);
  flower.classList.remove('grow', 'ready', 'color'); flower.removeAttribute('tabindex'); flower.removeAttribute('role');
  hintEl.classList.remove('show'); cancelAnimationFrame(bloomRaf); bloomRaf = null; colorCv.classList.remove('on');
  app.classList.remove('flying');
}

// Clicar no Bip faz-lhe um saltinho
bipEl.addEventListener('click', () => {
  dot.classList.remove('hop'); void dot.offsetWidth; dot.classList.add('hop');
});
dot.addEventListener('animationend', e => { if (e.animationName === 'hop') dot.classList.remove('hop'); });

/* ---------- Contador ---------- */
function tick() {
  const diff = Math.max(0, target - Date.now());
  const secs = Math.ceil(diff / 1000);
  els.d.textContent = pad(Math.floor(secs / 86400));
  els.h.textContent = pad(Math.floor(secs % 86400 / 3600));
  els.m.textContent = pad(Math.floor(secs % 3600 / 60));
  els.s.textContent = pad(secs % 60);

  if (diff === 0) { startTransition(); return; }
  // próximo tick exatamente quando o segundo seguinte muda
  tickTimer = setTimeout(tick, (diff % 1000 || 1000) + 5);
}

window.addEventListener('resize', () => { if (rafId) setupRain(); if (bloomRaf) setupBloom(); });

tick();