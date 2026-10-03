/* ---------- História ilustrada (entre a chuva binária e o jogo) ---------- */
(function () {
  const W = 320, H = 180, TAU = Math.PI * 2;
  const SHOW_BLURP = false;   // false = sem desenhos do Blurp (só o texto fala dele) · true = mostra o monstro nas cenas
  const BLURP_IMG = true;     // true = a foto do Blurp (blurp.png) aparece quando falam dele · false = não aparece
  const STORY_COLOR = true;   // true = começa a cores e as cores desaparecem com a maldição · false = tudo a preto e branco
  const wrap = document.getElementById('story'), scv = document.getElementById('scv'), g = scv.getContext('2d');
  const blurpEl = document.getElementById('blurp'), stext = document.getElementById('stext'), sfull = document.getElementById('sfull'), slive = document.getElementById('slive');

  const rnd = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // ===== pequenas ferramentas de desenho =====
  const grad = (c0, c1) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const oval = (x, y, rx, ry, fill, rot = 0) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  const ridge = (base, amp, seed, color, off) => {                     // montanhas em silhueta
    g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) { const k = Math.floor((x + off) / 8); g.lineTo(x, base - amp * (0.35 * (Math.sin(k * 0.21 + seed) * 0.5 + 0.5) + 0.65 * rnd(seed * 31 + k))); }
    g.lineTo(W, H); g.fill();
  };
  const mist = (t, a, y, k = 1, col = '255,255,255') => {              // névoa a deslizar
    g.fillStyle = 'rgba(' + col + ',' + a + ')';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(((i * 95 + t * 5 * (1 + i * 0.25) * k) % (W + 180)) - 90, y + i * 7, 75, 9, 0, 0, TAU); g.fill(); }
  };
  const FLW = ['#ff7eb6', '#ffd166', '#ffffff', '#ff9f68', '#b28dff'];
  const flw = (x, y, r, col, t, sd) => {                               // florzinha
    const sw = Math.sin(t * 2 + sd) * 1.3;
    g.fillStyle = '#2f8f4e'; g.fillRect(x, y - r * 2, 1, r * 2);
    g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; g.beginPath(); g.arc(x + sw + Math.cos(a) * r * 0.7, y - r * 2 + Math.sin(a) * r * 0.7, r * 0.55, 0, TAU); g.fill(); }
    g.fillStyle = '#ffe066'; g.beginPath(); g.arc(x + sw, y - r * 2, r * 0.4, 0, TAU); g.fill();
  };
  const meadow = (t, y0, n) => {
    g.fillStyle = '#2f8f4e'; g.fillRect(0, y0, W, H - y0);
    for (let i = 0; i < n; i++) flw(i * (W / n) + rnd(i) * 5, y0 + 4 + rnd(i + 9) * (H - y0 - 6), 2 + rnd(i + 3) * 1.5, FLW[i % 5], t, i);
  };
  const folk = (x, y, t, sd, col, jump) => {                           // habitante de Petalândia
    const j = jump ? -Math.abs(Math.sin(t * 4 + sd)) * 5 : 0;
    oval(x, y + j - 4, 3.6, 4.2, col); oval(x, y + j - 9, 2.4, 2.4, col);
    g.fillStyle = '#1a1a1a'; g.fillRect(x - 2, y + j - 10, 1, 1); g.fillRect(x + 1, y + j - 10, 1, 1);
    g.fillStyle = '#fff'; g.fillRect(x - 1, y + j - 13, 3, 2);
  };
  const castle = (x, y, col, lit) => {
    g.fillStyle = col; g.fillRect(x - 15, y - 24, 9, 24); g.fillRect(x + 6, y - 24, 9, 24); g.fillRect(x - 8, y - 15, 16, 15);
    [-15, 6].forEach(dx => { g.beginPath(); g.moveTo(x + dx - 1, y - 24); g.lineTo(x + dx + 4.5, y - 34); g.lineTo(x + dx + 10, y - 24); g.fill(); });
    g.fillStyle = lit; g.fillRect(x - 12, y - 18, 2, 3); g.fillRect(x + 10, y - 18, 2, 3); g.fillRect(x - 2, y - 8, 4, 8);
  };
  const mother = (x, y, t, wilt) => {                                  // a Flor-Mãe (wilt 0 = radiante, 1 = murcha)
    const hx = x + wilt * 22, hy = y - 78 + wilt * 26, life = 1 - wilt;
    g.strokeStyle = '#2f8f4e'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + wilt * 4, y - 42, hx, hy); g.stroke();
    if (life > 0.02) {
      const r = 80 * life, gr = g.createRadialGradient(hx, hy, 2, hx, hy, r);
      gr.addColorStop(0, 'rgba(255,244,200,' + 0.6 * life + ')'); gr.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = gr; g.fillRect(hx - r, hy - r, r * 2, r * 2);
      g.fillStyle = 'rgba(255,246,210,' + 0.1 * life + ')';
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + t * 0.12; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a - 0.06) * 170, hy + Math.sin(a - 0.06) * 170); g.lineTo(hx + Math.cos(a + 0.06) * 170, hy + Math.sin(a + 0.06) * 170); g.fill(); }
    }
    const L = 28 - wilt * 8, dy = wilt * 8;
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; oval(hx + Math.cos(a) * L * 0.62, hy + Math.sin(a) * L * 0.62 + dy, L * 0.5, 7, '#ff9ecb', a); }
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.2; oval(hx + Math.cos(a) * 9, hy + Math.sin(a) * 9 + dy, 8, 4.5, '#fff', a); }
    oval(hx, hy + dy, 6, 6, '#ffd45c');
  };
  const blurp = (x, y, s, t, mad) => {                                 // o monstro: uma silhueta alta e curvada, olhos em fenda
    g.save(); g.translate(x, y); g.scale(s, s);
    for (let k = 0; k < 6; k++) oval(Math.sin(t * 0.7 + k * 1.9) * 20, -30 - ((t * 9 + k * 13) % 34), 9 - k, 5, 'rgba(0,0,0,0.32)');   // fumo negro
    g.lineCap = 'round';
    [-1, 1].forEach(sg => {                                            // braços longos com garras
      const sw = Math.sin(t * 1.3 + sg) * 3;
      g.beginPath(); g.moveTo(sg * 18, -16); g.quadraticCurveTo(sg * 46, -6 + sw, sg * 40, 26 + sw);
      g.strokeStyle = '#3b3b4d'; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#000'; g.lineWidth = 3.4; g.stroke();
      g.strokeStyle = '#6a6a80'; g.lineWidth = 1.1;
      for (let c = -1; c <= 1; c++) { g.beginPath(); g.moveTo(sg * 40, 26 + sw); g.lineTo(sg * 40 + c * 4 + sg * 2, 38 + sw - Math.abs(c) * 2); g.stroke(); }
    });
    const R = [[0, -42], [8, -39], [12, -30], [19, -18], [23, -3], [27, 14], [31, 30], [27, 37], [22, 32], [17, 39], [11, 33], [5, 40], [0, 34]];
    g.beginPath();                                                     // corpo irregular, com a bainha rasgada
    R.forEach(([px, py], i) => { const w = Math.sin(t * 1.7 + i) * 1.1; if (i) g.lineTo(px + w, py); else g.moveTo(px, py); });
    for (let i = R.length - 2; i >= 0; i--) g.lineTo(-R[i][0] - Math.sin(t * 1.7 + i + 2) * 1.1, R[i][1]);
    g.closePath(); g.fillStyle = '#000'; g.strokeStyle = '#3b3b4d'; g.lineWidth = 1.3; g.fill(); g.stroke();
    g.strokeStyle = '#000'; g.lineWidth = 1;                           // lama a escorrer em fios finos
    [-14, -5, 9, 20].forEach((dx, k) => { const len = 6 + (Math.sin(t * 1.6 + k * 2.3) + 1) * 6; g.beginPath(); g.moveTo(dx, 36); g.lineTo(dx, 36 + len); g.stroke(); oval(dx, 37 + len, 1.4, 1.8, '#000'); });
    const tilt = 2 + mad * 3;                                          // olhos estreitos e inclinados
    g.shadowColor = '#fff'; g.shadowBlur = 9; g.fillStyle = '#fff';
    [-1, 1].forEach(sg => { g.beginPath(); g.moveTo(sg * 10, -24 - tilt); g.lineTo(sg * 3, -20); g.lineTo(sg * 9, -19); g.closePath(); g.fill(); });
    g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillRect(-1, -34, 1.5, 1.5); g.fillRect(-7, -29, 1.3, 1.3); g.fillRect(6, -29, 1.3, 1.3);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-9, -8); g.lineTo(9, -8); g.stroke();   // boca-fenda com dentes
    g.beginPath(); for (let i = -8; i <= 8; i += 3) { g.moveTo(i, -8); g.lineTo(i + 0.8, -5.5); } g.stroke();
    g.restore();
  };
  const thorns = (x, y, n, h) => {                                     // espinhos negros
    g.fillStyle = '#000'; g.strokeStyle = '#2f2f3b'; g.lineWidth = 0.8;
    for (let k = 0; k < n; k++) {
      const bx = x + k * 5, hh = h * (0.6 + rnd(k + x) * 0.6), tip = bx + (rnd(k * 3 + x) - 0.5) * 6;
      g.beginPath(); g.moveTo(bx - 3, y); g.lineTo(tip, y - hh); g.lineTo(bx + 3, y); g.closePath(); g.fill(); g.stroke();
    }
  };
  const sludge = (t, y0) => {                                          // lama tóxica com bolhas
    g.fillStyle = '#0b0b0e'; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) g.lineTo(x, y0 + Math.sin(x * 0.05 + t) * 2 + Math.sin(x * 0.13 - t * 1.5));
    g.lineTo(W, H); g.fill();
    g.strokeStyle = 'rgba(190,255,150,0.5)'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc((i * 37 + 12) % W, y0 + 30 - ((t * 7 + i * 11) % 30), 1.5 + (i % 3), 0, TAU); g.stroke(); }
  };

  // ===== as cenas =====
  const sceneA = t => {                                                // montanhas, névoa e o reino
    grad('#26408b', '#ffd9a8'); oval(235, 96, 62, 62, 'rgba(255,240,200,0.35)');
    ridge(95, 55, 1, '#7484c9', t * 1.5); mist(t, 0.14, 62);
    ridge(118, 48, 7, '#4a5aa3', t * 3); mist(t, 0.16, 96, 1.4);
    ridge(142, 40, 13, '#33437f', t * 5);
    meadow(t, 150, 44); castle(160, 154, '#2a2a5c', '#ffd166');
  };
  const sceneB = t => {                                                // a Flor-Mãe e a festa
    grad('#4ea3e8', '#fff1c9'); ridge(110, 40, 3, '#8fb4e8', t * 2); meadow(t, 138, 60); mother(160, 152, t, 0);
    for (let i = 0; i < 9; i++) folk(30 + i * 32 + Math.sin(t + i) * 4, 166 + (i % 3) * 4, t, i * 1.7, ['#ffb3c6', '#ffe08a', '#b8e0ff'][i % 3], true);
    if (window.royalsDraw) window.royalsDraw(g, t, 112, 208, 172, 1.15);   // o Rei e a Rainha ao lado da Flor-Mãe (função definida no final.js)
    for (let i = 0; i < 18; i++) oval((i * 41 + t * 9) % W, (i * 27 + t * 22) % H, 2.5, 1.2, 'rgba(255,190,220,0.85)', t + i);
  };
  const sceneC = t => {                                                // noite sem estrelas, criatura aos portões
    grad('#04050a', '#191b26');
    for (let i = 0; i < 28; i++) { const a = 0.9 - (t - i * 0.09) * 0.8; if (a > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(0.9, a) + ')'; g.fillRect(rnd(i) * W | 0, rnd(i + 40) * 95 | 0, 1, 1); } }
    ridge(120, 45, 5, '#0a0b12', t * 2);
    if (SHOW_BLURP) { const p = clamp((t - 1.2) / 3.5); g.globalAlpha = p; blurp(230, 175 - p * 60, 1.25, t, 0); g.globalAlpha = 1; }
    mist(t, 0.09 + clamp((t - 1) / 4) * 0.1, 108, 1.6);                // a névoa vai engrossando
    g.fillStyle = '#15161d'; g.fillRect(132, 118, 7, 42); g.fillRect(161, 118, 7, 42); g.fillRect(132, 118, 36, 4);   // os portões
    g.beginPath(); g.arc(150, 126, 16, Math.PI, 0); g.fill(); g.fillRect(138, 126, 24, 34);
    const L = (t < 2 ? 1 : Math.max(0, 1 - (t - 2) * 0.4)) * (t < 1.5 ? 1 : 0.8 + 0.2 * Math.sin(t * 17));   // as lanternas tremem e apagam-se
    [136, 164].forEach(x => { const gr = g.createRadialGradient(x, 132, 0, x, 132, 14); gr.addColorStop(0, 'rgba(255,159,67,' + 0.55 * L + ')'); gr.addColorStop(1, 'rgba(255,159,67,0)'); g.fillStyle = gr; g.fillRect(x - 14, 118, 28, 28); oval(x, 132, 1.8, 1.8, 'rgba(255,179,92,' + L + ')'); });
    castle(96, 160, '#181923', '#ff9f43'); castle(206, 160, '#181923', '#ff9f43');
    mist(t, 0.07, 138, 1);
  };
  const sceneD = t => {                                                // Blurp
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const sh = t < 0.7 ? (0.7 - t) * 6 : 0;
    g.save(); g.translate((rnd(t * 60) - 0.5) * sh * 2, (rnd(t * 70) - 0.5) * sh * 2);
    const gr = g.createRadialGradient(160, 96, 10, 160, 96, 150); gr.addColorStop(0, 'rgba(80,80,100,' + (0.25 + 0.15 * Math.sin(t * 2)) + ')'); gr.addColorStop(1, 'rgba(80,80,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (SHOW_BLURP) blurp(160, 92, 1.7 + Math.sin(t * 2) * 0.05, t, 1);
    else for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, (t * 40 + i * 47) % H, W, 1 + (i % 2)); }   // estática a tremer no escuro
    g.restore(); mist(t, 0.06, 130, 1, '200,200,220');
  };
  const sceneE = t => {                                                // o ataque: só se vê a Flor-Mãe a murchar
    grad('#07070d', '#1c1930'); g.fillStyle = '#0c0c14'; g.fillRect(0, 172, W, 8);
    const wilt = clamp((t - 0.8) / 4.2);
    g.save(); g.translate(160, 172); g.scale(1.3, 1.3); mother(0, 0, t, wilt); g.restore();
    for (let i = 0; i < 8; i++) {                                      // as pétalas vão caindo
      const u = (t - 1.6 - i * 0.4) * 22; if (u <= 0) continue;
      oval(160 + Math.cos(i * 2.4) * 30 + Math.sin(u * 0.15 + i) * 6, Math.min(168, 78 + i * 3 + u), 3.5, 1.8, 'rgba(255,158,203,0.9)', t + i);
    }
    const d = clamp((t - 1) / 4.5);                                    // a luz vai-se apagando
    if (d > 0) { const ri = Math.max(2, 170 * (1 - d)), gr = g.createRadialGradient(170, 96, ri, 170, 96, ri + 70); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.9)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  };
  const sceneF = t => {                                                // o reino sem cor
    grad('#0e0e13', '#23232b'); ridge(105, 45, 11, '#15151c', t); mist(t, 0.08, 88, 1, '170,170,190'); ridge(128, 35, 17, '#0c0c11', t * 2);
    g.save(); g.translate(244, 66); g.scale(0.6, 0.6); mother(0, 100, t, 1); g.restore();
    sludge(t, 142);
    [30, 122, 208].forEach((x, i) => { folk(x + 17, 166, t, i, '#c9c9d4', false); thorns(x, 174, 7, 30); });   // habitantes presos
    if (SHOW_BLURP) for (let i = 0; i < 2; i++) blurp(((t * 22 + i * 150) % (W + 80)) - 40, 118 + i * 10, 0.34, t + i, 0);   // monstros de Blurp
    mist(t, 0.1, 160, 1.2, '150,150,170');
  };
  const sceneG = t => {                                                // uma pequena luz que floresce
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const rise = clamp(t / 6), cy = 98 - rise * 10, bloom = clamp((t - 5) / 2.5);
    const gl = 14 + rise * 60 + bloom * 26, gr = g.createRadialGradient(160, cy, 1, 160, cy, gl);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#fff'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const r = (t * 16 + i * 30) % 90; g.globalAlpha = (1 - r / 90) * 0.35; g.beginPath(); g.arc(160, cy, r, 0, TAU); g.stroke(); }
    g.globalAlpha = 1;
    const full = H - cy - 4, p = clamp((t - 2) / 3), len = full * p;   // um fio de luz cresce do chão até ao ponto
    g.fillStyle = '#fff'; g.fillRect(160, H - len, 1, len);
    [[0.35, -1], [0.6, 1]].forEach(([h, sg]) => {                        // e ganha duas folhinhas
      const k = clamp((p - h) / 0.25); if (k > 0) oval(160 + sg * 4 * k, H - full * h - 2, 4 * k, 1.6 * k, '#fff', sg * -0.5);
    });
    if (bloom > 0) for (let i = 0; i < 8; i++) { const a = i * TAU / 8; oval(160 + Math.cos(a) * 7 * bloom, cy + Math.sin(a) * 7 * bloom, 5.5 * bloom, 2.4 * bloom, 'rgba(255,255,255,0.55)', a); }   // o pontinho abre em pétalas
    const r = 3.5 + Math.sin(t * 3) * 0.5; oval(160, cy, r, r, '#fff');
  };

  // ===== a história (texto exatamente como o escreveste) =====
  const SCENES = [
    { hold: 2800, draw: sceneA, text: 'Há muito, muito tempo, escondido entre montanhas cobertas de névoa, existia um lugar maravilhoso chamado Reino das Flores que vivia em perfeita harmonia.' },
    { hold: 2800, draw: sceneB, text: 'Sob a luz e proteção da lendária Flor-Mãe, os prados brilham com cores vibrantes e os habitantes festejam a paz em Petalândia, um reino liderado com amor pelo Rei e pela Rainha.' },
    { hold: 2600, draw: sceneC, text: 'Mas tudo mudou há exatamente um ano, quando, numa noite sem estrelas, uma criatura terrível apareceu diante dos portões do reino.' },
    { hold: 3200, draw: sceneD, text: 'Blurp era o seu nome.' },
    { hold: 2800, draw: sceneE, gray: 1.8, text: 'Incapaz de suportar a luz, Blurp lançou um ataque à Flor-Mãe numa maldição de névoa e escuridão.' },
    { hold: 3200, draw: sceneF, text: 'A partir daí, as cores da Petalândia desapareceram, a lama tóxica tomou conta dos rios e os habitantes continuam aprisionados em espinhos negros sob o domínio dos monstros de Blurp.' },
    { hold: 6500, fadeOut: 1400, draw: sceneG, text: 'No entanto eu sinto que hoje é o dia da mudança...' }
  ];

  // ===== a foto do Blurp: só aparece nas cenas em que falam dele =====
  const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
  function blurpState(i, t) {                                          // como mostrar a foto em cada cena (null = escondida); x, b, h em % do ecrã
    if (i === 3) {                                                     // "Blurp era o seu nome.": a foto só aparece quando o nome começa a ser escrito
      const u = t - TEXT_DELAY / 1000;                                 // u = tempo desde que o texto começou a aparecer
      if (u < 0) return null;
      const sh = u < 0.9 ? (0.9 - u) * 7 : 0, fl = Math.sin(u * 23) > 0.93 ? 0.5 : 0;   // tremor inicial e clarões ocasionais
      return { o: clamp(u / 0.25), x: 50, b: 3, h: 38 + 46 * easeOut(u / 0.6) + Math.min(u, 6) * 0.8, br: 0.75 + fl + Math.sin(u * 2) * 0.05,
               rot: Math.sin(u * 9) * (u < 0.9 ? 3 : 0.6), sx: (rnd(u * 50) - 0.5) * sh, sy: (rnd(u * 61) - 0.5) * sh };
    }
    return null;
  }
  function showBlurp(i, t, fadeOut) {
    const b = BLURP_IMG ? blurpState(i, t) : null, st = blurpEl.style;
    if (!b) { st.display = 'none'; return; }
    st.display = 'block'; st.opacity = (b.o * (1 - fadeOut)).toFixed(3);
    st.left = b.x + '%'; st.bottom = b.b + '%'; st.height = b.h + '%';
    st.transform = 'translateX(-50%) translate(' + b.sx.toFixed(1) + 'px,' + b.sy.toFixed(1) + 'px) rotate(' + b.rot.toFixed(2) + 'deg)';
    st.filter = 'brightness(' + b.br.toFixed(2) + ') contrast(1.05) drop-shadow(0 0 16px rgba(255,255,255,0.22))';
  }

  // ===== controlo =====
  const CHAR_MS = 38, TEXT_DELAY = 900, FADE_IN = 0.9, FADE_OUT = 600;
  let active = false, raf = null, idx = 0, sStart = 0, tStart = 0, times = [], outAt = 0;

  function fit() {
    const s = Math.min(innerWidth * 0.94 / W, innerHeight * 0.6 / H);
    scv.style.width = W * s + 'px'; scv.style.height = H * s + 'px'; stext.style.width = W * s + 'px'; wrap.style.setProperty('--gs', s);
  }
  window.addEventListener('resize', () => { if (active) fit(); });

  function begin(i) {
    idx = i; const s = SCENES[i]; sStart = performance.now(); tStart = sStart + TEXT_DELAY; outAt = 0;
    let acc = 0; times = [];
    for (const ch of s.text) { times.push(acc); acc += CHAR_MS + (ch === ',' ? 220 : ch === '.' ? 300 : 0); }
    sfull.textContent = s.text; slive.textContent = ''; stext.style.opacity = 1;
  }
  function leave(now) { if (!outAt) outAt = now; }
  function advance() {                                         // toque/Z/Enter: completa o texto; se já está completo, passa à cena seguinte
    if (!active || outAt) return;
    const now = performance.now(), last = times[times.length - 1];
    if (now - tStart < last) tStart = now - last - 1; else leave(now);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const s = SCENES[idx], t = (now - sStart) / 1000, fo = s.fadeOut || FADE_OUT;
    g.clearRect(0, 0, W, H); s.draw(t);
    let a = 1 - clamp(t / FADE_IN);
    if (outAt) a = Math.max(a, clamp((now - outAt) / fo));
    if (a > 0) { g.fillStyle = 'rgba(0,0,0,' + a + ')'; g.fillRect(0, 0, W, H); }
    showBlurp(idx, t, outAt ? clamp((now - outAt) / fo) : 0);
    if (s.gray !== undefined && t >= s.gray) wrap.classList.add('gray');   // as cores vão-se embora
    const el = now - tStart; let n = 0; while (n < times.length && times[n] <= el) n++;
    slive.textContent = s.text.slice(0, n);
    if (outAt) stext.style.opacity = 1 - clamp((now - outAt) / (fo * 0.8));
    else if (n === s.text.length && el > times[times.length - 1] + s.hold) leave(now);   // avança sozinha
    if (outAt && now - outAt >= fo) { if (idx + 1 < SCENES.length) begin(idx + 1); else { storyStop(); startGame(); } }
  }

  function startStory() {
    active = true; fit(); g.imageSmoothingEnabled = false;
    wrap.style.display = 'flex'; wrap.classList.toggle('gray', !STORY_COLOR);
    begin(0); raf = requestAnimationFrame(loop);
  }
  function storyStop() {
    active = false; cancelAnimationFrame(raf); raf = null;
    wrap.style.display = 'none'; wrap.classList.remove('gray'); blurpEl.style.display = 'none';
  }
  wrap.addEventListener('click', advance);
  const skip = () => { if (active) { storyStop(); startGame(); } };                     // saltar a cutscene: vai direto para o jogo
  document.getElementById('sskip').addEventListener('click', e => { e.stopPropagation(); skip(); });
  addEventListener('keydown', e => {
    if (!active) return;
    if (e.code === 'Escape') skip();
    else if (['KeyZ', 'Enter', 'Space'].includes(e.code)) { e.preventDefault(); if (!e.repeat) advance(); }
  });
  window.startStory = startStory; window.storyStop = storyStop;

  // atalho para testar só a história: abre o site com #historia no fim do endereço
  if (location.hash === '#historia') { app.classList.add('finished'); startStory(); }
})();