/* ---------- Final da história (depois de clicares na flor) ----------
   A Flor-Mãe volta a crescer, os Reis de Petalândia saem do castelo, o Rei corta a flor e dá-a à Rainha.
   No fim, o Rei deixa uma carta para quem salvou o reino (animação da carta + texto lá dentro).
   Também tira o retângulo branco (anel de foco) que aparecia à volta da flor ao clicar. */
(function () {
  const W = 320, H = 180, TAU = Math.PI * 2;
  const AFTER_BLOOM_MS = 3500;       // tempo a admirar o mundo a cores antes de começar o final
  const BLOOM_MS = (typeof BLOOM_S === 'number' ? BLOOM_S : 3.4) * 1000;
  const flowerEl = document.getElementById('flower');

  // ===== O TEXTO DA CARTA =====
  // Escreve aqui o que quiseres, tão grande quanto quiseres: as linhas quebram sozinhas e o utilizador arrasta (ou roda o rato / setas) para ler tudo.
  // Uma linha em branco separa parágrafos.
  const LETTER_SECONDS = 15;          // tempo (em segundos) que a carta demora a ser escrita, seja qual for o tamanho do texto (menos = mais rápido)
  const LETTER_TEXT = `Para ti,
que trouxeste a cor de volta à minha vida.

Não sei bem como começar esta carta. Já a escrevi tantas vezes na minha cabeça e nenhuma palavra me parece grande o suficiente. Mas vou tentar, porque mereces ouvir tudo aquilo que sinto, mesmo que seja super díficil de dizer.
Faz hoje um ano. Um ano desde que a minha vida ganhou outra cor. Lembro-me de desde o nosso primeiro encontro, e de como, sem perceber, o meu coração já sabia aquilo que a minha cabeça ainda demorou a perceber: que eras tu.
Tu és a pessoa que me faz rir quando o dia correu mal. És a pessoa que me abraça e, de repente, o mundo fica pequeno e seguro. És a primeira em quem penso quando acordo e a última com quem quero falar antes de adormecer. Com o teu jeito de me olhar, fazes-me sentir que sou mais do que acho que sou.
Neste ano aprendi tanto contigo. Aprendi que amar não é só os dias perfeitos, é também estar presente nos dias difíceis, ficar quando era mais fácil ir embora, e escolher-nos todos os dias. E eu escolho-te. Escolhi-te ontem, escolho-te hoje e vou escolher-te amanhã.
Obrigado por teres paciência comigo quando não a mereço. Obrigado por acreditares em mim mesmo quando eu duvido. Obrigado por cada gargalhada, cada silêncio partilhado. São as pequenas coisas contigo que se tornam as maiores da minha vida.
Tu és o meu lugar favorito no mundo. Não importa onde estejamos, num sofá a ver uma série, num passeio a ir para o meu carro ou para a praia, ou num dia cinzento em que não fazemos nada, contigo sinto-me em casa. Nunca pensei que uma pessoa pudesse ser um lar, mas tu és o meu.
Prometo continuar a cuidar de ti, a ouvir-te, a apoiar os teus sonhos como se fossem meus. Prometo ser o teu abrigo nos dias de tempestade e o teu cúmplice nos dias de sol. Prometo que, enquanto me deixares, vou amar-te um pouco mais a cada dia.
Este é só o primeiro ano de muitos que quero viver ao teu lado. Tenho tanto para te dar, tanto para viver contigo, tanto para te dizer ainda.
Por agora, deixo-te a verdade mais simples e mais profunda que conheço:
Amo-te. Amo-te muito. E sou infinitamente feliz por te ter na minha vida.
Feliz primeiro aniversário, meu amor.

Teu para sempre,
- Martim Soares Andrade`;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rnd = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, u) => a + (b - a) * u;

  // ===== sem retângulo branco à volta da flor =====
  const css = document.createElement('style');
  css.textContent = '.flower, .flower * { outline: none !important; -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; }' +
                    '.flower:focus, .flower:focus-visible { outline: none !important; }';
  document.head.appendChild(css);
  flowerEl.addEventListener('mousedown', e => e.preventDefault());           // clicar não dá foco à flor

  // ===== ecrã do final =====
  const wrap = document.createElement('div');
  wrap.id = 'endstory'; wrap.className = 'story'; wrap.style.opacity = '0'; wrap.style.transition = 'opacity 1s ease';
  wrap.setAttribute('aria-label', 'Final da história');
  wrap.innerHTML = '<div class="scwrap"><canvas width="320" height="180"></canvas></div>' +
    '<button class="sskip" type="button">Saltar</button>' +
    '<p class="stext" style="white-space:pre-line"><span class="t-full" aria-hidden="true"></span><span class="s-live"></span></p>';
  document.body.appendChild(wrap);
  const cv = wrap.querySelector('canvas'), stext = wrap.querySelector('.stext');
  let g = cv.getContext('2d');                                        // let: a história inicial (story.js) também desenha o Rei e a Rainha, noutro canvas
  const sfull = wrap.querySelector('.t-full'), slive = wrap.querySelector('.s-live'), skipBtn = wrap.querySelector('.sskip');

  // ===== ferramentas de desenho =====
  const grad = (c0, c1) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const oval = (x, y, rx, ry, fill, rot = 0) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  const ridge = (base, amp, seed, color, off) => {
    g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) { const k = Math.floor((x + off) / 8); g.lineTo(x, base - amp * (0.35 * (Math.sin(k * 0.21 + seed) * 0.5 + 0.5) + 0.65 * rnd(seed * 31 + k))); }
    g.lineTo(W, H); g.fill();
  };
  const FLW = ['#ff7eb6', '#ffd166', '#ffffff', '#ff9f68', '#b28dff'];
  const flw = (x, y, r, col, t, sd) => {
    const sw = Math.sin(t * 2 + sd) * 1.3;
    g.fillStyle = '#2f8f4e'; g.fillRect(x, y - r * 2, 1, r * 2);
    g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; g.beginPath(); g.arc(x + sw + Math.cos(a) * r * 0.7, y - r * 2 + Math.sin(a) * r * 0.7, r * 0.55, 0, TAU); g.fill(); }
    g.fillStyle = '#ffe066'; g.beginPath(); g.arc(x + sw, y - r * 2, r * 0.4, 0, TAU); g.fill();
  };
  const meadow = (t, y0, n) => {
    g.fillStyle = '#3fae62'; g.fillRect(0, y0, W, H - y0);
    for (let i = 0; i < n; i++) flw(i * (W / n) + rnd(i) * 5, y0 + 4 + rnd(i + 9) * (H - y0 - 6), 2 + rnd(i + 3) * 1.5, FLW[i % 5], t, i);
  };
  const petalsFly = (t, n) => { for (let i = 0; i < n; i++) oval((i * 41 + t * 9) % W, (i * 27 + t * 22) % H, 2.5, 1.2, 'rgba(255,190,220,0.85)', t + i); };
  const rays = (hx, hy, t, a) => {
    g.fillStyle = 'rgba(255,246,210,' + a + ')';
    for (let i = 0; i < 10; i++) { const an = i * TAU / 10 + t * 0.12; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(an - 0.06) * 200, hy + Math.sin(an - 0.06) * 200); g.lineTo(hx + Math.cos(an + 0.06) * 200, hy + Math.sin(an + 0.06) * 200); g.fill(); }
  };
  const folk = (x, y, t, sd, col) => {
    const j = -Math.abs(Math.sin(t * 4 + sd)) * 5;
    oval(x, y + j - 4, 3.6, 4.2, col); oval(x, y + j - 9, 2.4, 2.4, col);
    g.fillStyle = '#1a1a1a'; g.fillRect(x - 2, y + j - 10, 1, 1); g.fillRect(x + 1, y + j - 10, 1, 1);
    g.fillStyle = '#fff'; g.fillRect(x - 1, y + j - 13, 3, 2);
  };
  const head = (hx, hy, L, rot) => {                                    // cabeça da flor (pétalas cor-de-rosa)
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + rot; oval(hx + Math.cos(a) * L * 0.62, hy + Math.sin(a) * L * 0.62, L * 0.5, Math.max(1, L * 0.25), '#ff9ecb', a); }
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.2 + rot; oval(hx + Math.cos(a) * L * 0.32, hy + Math.sin(a) * L * 0.32, L * 0.29, Math.max(0.8, L * 0.16), '#fff3b0', a); }
    oval(hx, hy, Math.max(1.5, L * 0.21), Math.max(1.5, L * 0.21), '#ffd45c');
  };
  const bloom = (x, y, h, L, rot) => {                                  // flor pequena: caule + cabeça
    const tx = x + Math.sin(rot) * h, ty = y - Math.cos(rot) * h;
    g.strokeStyle = '#2f8f4e'; g.lineWidth = Math.max(1.2, L * 0.16); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(tx, ty); g.stroke();
    oval((x + tx) / 2 - 3, (y + ty) / 2, L * 0.34, L * 0.14, '#3fae62', -0.5);
    head(tx, ty, L, rot);
  };
  const mother = (x, y, t, k) => {                                      // a Flor-Mãe a crescer (k de 0 a 1)
    if (k <= 0.02) return;
    const sw = Math.sin(t * 1.2) * 2 * k, hx = x + sw, hy = y - 78 * k;
    const r = 80 * k, gr = g.createRadialGradient(hx, hy, 2, hx, hy, r);
    gr.addColorStop(0, 'rgba(255,244,200,' + 0.6 * k + ')'); gr.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = gr; g.fillRect(hx - r, hy - r, r * 2, r * 2);
    g.strokeStyle = '#2f8f4e'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw * 0.3, y - 42 * k, hx, hy); g.stroke();
    oval(x - 11 * k, y - 28 * k, 11 * k, 3.6 * k, '#3fae62', -0.5); oval(x + 11 * k, y - 48 * k, 11 * k, 3.6 * k, '#3fae62', 0.5);
    head(hx, hy, 28 * k, t * 0.1);
  };
  const heart = (x, y, sz, a) => {
    g.globalAlpha = a; g.fillStyle = '#ff5c8a';
    g.beginPath(); g.arc(x - sz * 0.5, y, sz * 0.55, 0, TAU); g.arc(x + sz * 0.5, y, sz * 0.55, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - sz * 1.02, y + sz * 0.25); g.lineTo(x + sz * 1.02, y + sz * 0.25); g.lineTo(x, y + sz * 1.45); g.closePath(); g.fill();
    g.globalAlpha = 1;
  };
  const flag = (fx, fy, t) => {
    g.fillStyle = '#6b4fa0'; g.fillRect(fx, fy - 9, 1, 9);
    g.fillStyle = '#ff7eb6'; g.beginPath(); g.moveTo(fx + 1, fy - 9); g.lineTo(fx + 8 + Math.sin(t * 4) * 1.5, fy - 7 + Math.sin(t * 5)); g.lineTo(fx + 1, fy - 5); g.closePath(); g.fill();
  };
  const castleFront = (x, y, sc, t, open) => {                          // o castelo, visto de frente
    g.save(); g.translate(x, y); g.scale(sc, sc);
    const stone = '#cfc9e0', stoneL = '#e8e3f4', stoneD = '#a59dc6', roofC = '#7a5cc0', roofL = '#9b7fe0', roofD = '#5a3f9c', win = '#ffd166', gold = '#ffd23f';
    const bricks = (bx, by, bw, bh) => { g.fillStyle = 'rgba(90,76,140,0.2)'; for (let r = 0; r < bh; r += 6) { g.fillRect(bx, by + r, bw, 1); for (let c = (r / 6 % 2) * 5; c < bw; c += 10) g.fillRect(bx + c, by + r, 1, Math.min(6, bh - r)); } };
    const arch = (cx, cy, aw, ah) => { g.beginPath(); g.moveTo(cx - aw / 2, cy + ah); g.lineTo(cx - aw / 2, cy); g.arc(cx, cy, aw / 2, Math.PI, 0); g.lineTo(cx + aw / 2, cy + ah); g.closePath(); g.fill(); };   // janela com topo redondo
    const conic = (cx, base, hw, h) => {                                // telhado cónico com luz/sombra, tiras e remate dourado
      g.fillStyle = roofC; g.beginPath(); g.moveTo(cx - hw, base); g.lineTo(cx, base - h); g.lineTo(cx + hw, base); g.closePath(); g.fill();
      g.fillStyle = roofL; g.beginPath(); g.moveTo(cx - hw, base); g.lineTo(cx, base - h); g.lineTo(cx - hw * 0.15, base); g.closePath(); g.fill();
      g.fillStyle = roofD; g.beginPath(); g.moveTo(cx + hw, base); g.lineTo(cx, base - h); g.lineTo(cx + hw * 0.35, base); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.8;
      for (let k = 1; k < 4; k++) { const yy = base - h * k / 4, hw2 = hw * (1 - k / 4); g.beginPath(); g.moveTo(cx - hw2, yy); g.lineTo(cx + hw2, yy); g.stroke(); }
      oval(cx, base - h - 1.2, 1.6, 1.6, gold); flag(cx, base - h - 2, t);
    };
    oval(0, 1, 84, 4, 'rgba(0,0,0,0.18)');                              // sombra no chão
    g.fillStyle = stone; g.fillRect(-48, -38, 96, 38); bricks(-48, -38, 96, 38);                       // muralha
    g.fillStyle = stoneD; g.fillRect(-48, -38, 96, 2);
    for (let mx = -48; mx < 48; mx += 10) { g.fillStyle = stone; g.fillRect(mx, -43, 6, 5); g.fillStyle = stoneL; g.fillRect(mx, -43, 6, 1); }
    g.fillStyle = win; [-36, 36].forEach(d => arch(d, -26, 3.4, 7));                                    // seteiras iluminadas
    [-60, 60].forEach(tx => {                                                                           // torres laterais (cilindros)
      g.fillStyle = stone; g.fillRect(tx - 12, -56, 24, 56);
      g.fillStyle = stoneL; g.fillRect(tx - 12, -56, 4, 56);
      g.fillStyle = stoneD; g.fillRect(tx + 4, -56, 8, 56);
      bricks(tx - 12, -56, 24, 56);
      g.fillStyle = stoneD; g.fillRect(tx - 14, -59, 28, 4); g.fillStyle = stoneL; g.fillRect(tx - 14, -59, 28, 1);
      g.fillStyle = win; arch(tx, -42, 4.4, 7); arch(tx, -24, 4.4, 7);
      conic(tx, -59, 17, 24);
    });
    g.fillStyle = '#d9d3e9'; g.fillRect(-22, -66, 44, 66);                                              // torre de menagem
    g.fillStyle = stoneL; g.fillRect(-22, -66, 4, 66); g.fillStyle = stoneD; g.fillRect(12, -66, 10, 66);
    bricks(-22, -66, 44, 66);
    g.fillStyle = stoneD; g.fillRect(-25, -69, 50, 4); g.fillStyle = stoneL; g.fillRect(-25, -69, 50, 1);
    g.fillStyle = win; [-13, 0, 13].forEach(d => arch(d, -58, 4.4, 7)); arch(-8, -42, 4.4, 7); arch(8, -42, 4.4, 7);
    head(0, -39.5, 3.6, 0);                                                                             // emblema: uma florzinha entre as janelas
    conic(0, -69, 28, 30);
    g.fillStyle = '#2a1f3d'; g.fillRect(-9, -24, 18, 24); g.beginPath(); g.arc(0, -24, 9, Math.PI, 0); g.fill();   // porta
    g.strokeStyle = stoneD; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-10.5, 0); g.lineTo(-10.5, -24); g.arc(0, -24, 10.5, Math.PI, 0); g.lineTo(10.5, 0); g.stroke();
    if (open > 0) {
      const gr = g.createRadialGradient(0, -14, 1, 0, -14, 20); gr.addColorStop(0, 'rgba(255,240,190,' + open + ')'); gr.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = gr; g.fillRect(-12, -36, 24, 36);
    }
    const w = 9 * (1 - open * 0.85);
    g.fillStyle = '#8a5a2b'; g.fillRect(-9, -24, w, 24); g.fillRect(9 - w, -24, w, 24);
    g.fillStyle = '#5b3a1c'; [-18, -8].forEach(ry => { g.fillRect(-9, ry, w, 1.2); g.fillRect(9 - w, ry, w, 1.2); });
    g.fillStyle = '#bdb6d6'; g.fillRect(-14, 0, 28, 2); g.fillStyle = '#a8a1c4'; g.fillRect(-17, 2, 34, 2);   // degraus
    [-34, 34].forEach((bx, i) => {                                                                      // moitas com florzinhas
      oval(bx, -2, 8, 4, '#3fae62'); oval(bx - 2, -4, 5, 3, '#4cc274');
      oval(bx - 3, -5, 1.4, 1.4, FLW[i]); oval(bx + 2, -4, 1.4, 1.4, FLW[i + 2]); oval(bx + 5, -2, 1.4, 1.4, FLW[i + 3]);
    });
    g.restore();
  };

  // ===== o Rei e a Rainha (y = pés; hand = posição da mão, virada para a direita) =====
  const handAt = (x, y, s, flip, a) => [x + a[0] * s * (flip ? -1 : 1), y + a[1] * s];
  const king = (x, y, s, t, o) => {
    o = o || {}; const b = o.walk ? Math.abs(Math.sin(t * 9)) * 1.6 : 0, a = o.hand || [5, -10];
    g.save(); if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
    oval(0, 0, 8, 2.4, 'rgba(0,0,0,0.25)');
    g.fillStyle = '#3a2a1a'; g.fillRect(-3, -3, 2.4, 3); g.fillRect(0.6, -3, 2.4, 3);
    g.fillStyle = '#b3202a'; g.beginPath(); g.moveTo(-6.5, -2 - b); g.lineTo(6.5, -2 - b); g.lineTo(3.8, -19 - b); g.lineTo(-3.8, -19 - b); g.closePath(); g.fill();
    g.fillStyle = '#f4ead0'; g.fillRect(-6.5, -4 - b, 13, 2);
    g.strokeStyle = '#b3202a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(2, -17 - b); g.lineTo(a[0], a[1]); g.stroke();
    oval(a[0], a[1], 1.8, 1.8, '#f1c9a0');
    oval(0, -19 - b, 5, 2, '#ffffff');
    oval(0, -23.5 - b, 3.7, 3.9, '#f1c9a0');
    g.fillStyle = '#ecece6'; g.beginPath(); g.moveTo(-3.4, -23 - b); g.lineTo(0, -15.5 - b); g.lineTo(3.4, -23 - b); g.closePath(); g.fill();
    g.fillStyle = '#1a1a1a'; g.fillRect(1, -25.5 - b, 1, 1.2); g.fillRect(-2.2, -25.5 - b, 1, 1.2);
    g.fillStyle = '#ffd23f'; g.fillRect(-3.6, -29 - b, 7.2, 2);
    for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-3.6 + k * 3.6, -29 - b); g.lineTo(-2.4 + k * 3.6, -32.5 - b); g.lineTo(-1.2 + k * 3.6, -29 - b); g.fill(); }
    g.restore();
  };
  const queen = (x, y, s, t, o) => {
    o = o || {}; const b = o.walk ? Math.abs(Math.sin(t * 9)) * 1.6 : 0, a = o.hand || [5, -10], sw = Math.sin(t * 2) * 0.6;
    const HAIR = '#f4cf57', HAIR_L = '#fff0a8', HAIR_D = '#d9a93a', SKIN = '#f8d9bd', GOWN = '#e58ae0', GOLD = '#ffd23f';
    g.save(); if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
    oval(0, 0, 10, 2.6, 'rgba(0,0,0,0.25)');
    g.fillStyle = HAIR; g.beginPath(); g.moveTo(1.5, -28.5 - b);                                          // cabelo comprido, por trás
    g.quadraticCurveTo(-6.8, -27 - b, -6.2, -19 - b); g.quadraticCurveTo(-8.6 + sw, -13 - b, -5.8 + sw * 1.5, -7.5 - b);
    g.quadraticCurveTo(-4.4, -9 - b, -3.2, -14 - b); g.lineTo(-1, -20 - b); g.closePath(); g.fill();
    g.strokeStyle = HAIR_L; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-4.4, -25 - b); g.quadraticCurveTo(-6.6, -18 - b, -6 + sw, -10 - b); g.stroke();
    g.strokeStyle = HAIR_D; g.beginPath(); g.moveTo(-3.2, -22 - b); g.quadraticCurveTo(-5, -16 - b, -4.4 + sw, -10 - b); g.stroke();
    const dg = g.createLinearGradient(0, -14 - b, 0, -b); dg.addColorStop(0, '#b565e6'); dg.addColorStop(1, '#7a30b8');   // saia de baile
    g.fillStyle = dg; g.beginPath(); g.moveTo(-9.8, -1 - b); g.quadraticCurveTo(-8, -9 - b, -3.4, -14 - b); g.lineTo(3.4, -14 - b);
    g.quadraticCurveTo(8, -9 - b, 9.8, -1 - b); g.quadraticCurveTo(0, 1.2 - b, -9.8, -1 - b); g.closePath(); g.fill();
    g.lineWidth = 0.6; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(-1, -13 - b); g.lineTo(-4.8, -1.4 - b); g.moveTo(2.4, -13 - b); g.lineTo(5.8, -1.4 - b); g.stroke();
    g.strokeStyle = 'rgba(50,10,90,0.28)'; g.beginPath(); g.moveTo(0.6, -13 - b); g.lineTo(0.4, -0.6 - b); g.moveTo(-2.6, -12.6 - b); g.lineTo(-6.8, -1.6 - b); g.stroke();
    g.strokeStyle = GOLD; g.lineWidth = 1; g.beginPath(); g.moveTo(-9.6, -1.5 - b); g.quadraticCurveTo(0, 1.6 - b, 9.6, -1.5 - b); g.stroke();   // bainha dourada
    g.fillStyle = '#fff'; [-6, -2, 2, 6].forEach(px => g.fillRect(px - 0.4, -0.2 - b + (Math.abs(px) < 3 ? 0.5 : 0), 0.9, 0.9));
    g.fillStyle = GOWN; g.beginPath(); g.moveTo(-3.4, -14 - b); g.lineTo(3.4, -14 - b); g.lineTo(3, -18.8 - b); g.lineTo(-3, -18.8 - b); g.closePath(); g.fill();   // corpete
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(-3, -18.6 - b, 1, 4.4);
    g.fillStyle = GOLD; g.fillRect(-3.5, -15 - b, 7, 1.3); oval(0, -14.35 - b, 0.9, 0.9, '#ff5c8a');   // cinto com jóia
    oval(0, -18.8 - b, 3.9, 1.1, SKIN); g.fillStyle = SKIN; g.fillRect(-1, -20.6 - b, 2.2, 2.4);       // ombros e pescoço
    oval(0, -18.2 - b, 0.5, 0.5, GOLD);                                                                  // colar
    const mx = lerp(2.4, a[0], 0.5), my = lerp(-17.5 - b, a[1], 0.5);                                    // braço: manga + pele + mão
    g.lineCap = 'round'; g.strokeStyle = GOWN; g.lineWidth = 2.8; g.beginPath(); g.moveTo(2.4, -17.5 - b); g.lineTo(mx, my); g.stroke();
    g.strokeStyle = SKIN; g.lineWidth = 1.7; g.beginPath(); g.moveTo(mx, my); g.lineTo(a[0], a[1]); g.stroke();
    oval(a[0], a[1], 1.7, 1.7, SKIN);
    oval(0.2, -24 - b, 3.6, 3.9, SKIN);                                                                  // rosto
    g.fillStyle = HAIR; g.beginPath(); g.moveTo(-3.9, -22.4 - b); g.quadraticCurveTo(-4.6, -29.6 - b, 0.4, -29.6 - b);   // cabelo da frente, com franja de lado
    g.quadraticCurveTo(4.6, -29.4 - b, 3.9, -25.4 - b); g.quadraticCurveTo(2.4, -27.8 - b, -0.2, -26.6 - b); g.quadraticCurveTo(-2.6, -25.4 - b, -3.2, -22.2 - b); g.closePath(); g.fill();
    g.strokeStyle = HAIR_L; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-2.6, -27.6 - b); g.quadraticCurveTo(0, -29.4 - b, 2.4, -27.8 - b); g.stroke();
    g.fillStyle = '#fff'; g.fillRect(1.1, -24.9 - b, 1.9, 1.4);                                          // olho azul com pestanas
    g.fillStyle = '#3d7fd6'; g.fillRect(1.9, -24.8 - b, 1.1, 1.2);
    g.fillStyle = '#1a1a1a'; g.fillRect(2.3, -24.6 - b, 0.6, 0.7);
    g.fillStyle = '#4a2c12'; g.fillRect(0.9, -25.4 - b, 2.4, 0.55); g.fillRect(3.1, -25.7 - b, 0.5, 0.5);
    oval(2.5, -22.5 - b, 1.1, 0.7, 'rgba(255,110,150,0.5)');                                             // bochecha
    g.strokeStyle = '#d6405a'; g.lineWidth = 0.8; g.beginPath(); g.arc(1.7, -22.2 - b, 0.95, 0.2, Math.PI - 0.2); g.stroke();   // sorriso
    oval(-2.4, -22.4 - b, 0.55, 0.9, GOLD);                                                              // brinco
    g.fillStyle = GOLD; g.fillRect(-3.2, -29 - b, 6.6, 1.2);                                             // tiara
    g.beginPath(); g.moveTo(-3.2, -29 - b); g.lineTo(-2.2, -31.4 - b); g.lineTo(-1.2, -29 - b); g.moveTo(-0.9, -29 - b); g.lineTo(0.2, -32.8 - b); g.lineTo(1.3, -29 - b); g.moveTo(1.6, -29 - b); g.lineTo(2.6, -31.4 - b); g.lineTo(3.6, -29 - b); g.fill();
    oval(0.2, -30.1 - b, 0.7, 0.7, '#ff5c8a');
    oval(-3.4, -27.4 - b, 1.1, 1.1, '#ff9ecb'); oval(-3.4, -27.4 - b, 0.4, 0.4, '#fff3b0');              // florzinha no cabelo
    g.restore();
  };
  // o Rei e a Rainha também aparecem na história inicial (story.js): desenham-se num canvas emprestado
  window.royalsDraw = (ctx, t, kx, qx, y, s) => {
    const old = g; g = ctx;
    try { king(kx, y, s, t, { hand: [8, -12] }); queen(qx, y, s, t, { flip: true, hand: [11, -15] }); } finally { g = old; }
  };

  // ===== a carta do Rei =====
  // envelope: o = abertura da aba (0 fechada, 1 aberta); seal = selo de cera; behind = desenha a carta dentro do envelope
  const envelope = (cx, cy, w, h, o, seal, behind, al) => {
    const l = cx - w / 2, r = cx + w / 2, tp = cy - h / 2, bt = cy + h / 2, hf = h * 0.58, tipY = tp + hf * Math.cos(Math.PI * o), vy = cy + h * 0.08;
    g.save(); g.globalAlpha = al === undefined ? 1 : al;
    g.fillStyle = '#d9c692'; g.fillRect(l, tp, w, h);                                       // costas do envelope
    const flap = col => { g.fillStyle = col; g.strokeStyle = '#bfa86f'; g.lineWidth = 1; g.beginPath(); g.moveTo(l, tp); g.lineTo(r, tp); g.lineTo(cx, tipY); g.closePath(); g.fill(); g.stroke(); };
    if (o >= 0.5) flap('#cdb980');                                                          // aba aberta: fica por trás da carta
    if (behind) behind();
    g.fillStyle = '#f4ead0'; g.strokeStyle = '#bfa86f'; g.lineWidth = 1;                    // frente do envelope (três triângulos)
    [[[l, tp], [l, bt], [cx, vy]], [[r, tp], [r, bt], [cx, vy]], [[l, bt], [r, bt], [cx, vy]]].forEach(p => {
      g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.lineTo(p[2][0], p[2][1]); g.closePath(); g.fill(); g.stroke();
    });
    if (o < 0.5) flap('#ecdcb0');                                                           // aba fechada: por cima de tudo
    if (seal && o < 0.15) {                                                                 // selo de cera com um coração
      const sy = tp + hf * 0.92, sr = Math.max(2.5, h * 0.09);
      oval(cx, sy, sr, sr, '#b3202a'); oval(cx - sr * 0.3, sy - sr * 0.3, sr * 0.3, sr * 0.3, 'rgba(255,255,255,0.35)');
      heart(cx, sy - sr * 0.4, sr * 0.38, 0.9);
    }
    g.restore();
  };
  const paper = (cx, cy, pw, ph) => {                                                       // folha de papel
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx - pw / 2 + 2, cy - ph / 2 + 3, pw, ph);
    g.fillStyle = '#fbf3dc'; g.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
    g.strokeStyle = '#d9c692'; g.lineWidth = 1; g.strokeRect(cx - pw / 2 + 0.5, cy - ph / 2 + 0.5, pw - 1, ph - 1);
  };
  const sparkle = (x, y, s, a) => {
    g.fillStyle = 'rgba(255,248,210,' + a + ')'; g.fillRect(x - s, y, s * 2 + 1, 1); g.fillRect(x, y - s, 1, s * 2 + 1);
  };

  // ===== as cenas =====
  const sky = () => grad('#4ea3e8', '#fff1c9');

  const sceneA = t => {                                                // a Flor-Mãe volta a crescer
    sky(); ridge(110, 40, 3, '#8fb4e8', t * 2); ridge(128, 30, 9, '#6fc28a', t * 3); meadow(t, 138, 60);
    const k = ease(t / 4.5);
    rays(160, 152 - 78 * k, t, 0.1 * k);
    mother(160, 152, t, k);
    if (k > 0.85) for (let i = 0; i < 9; i++) folk(30 + i * 32 + Math.sin(t + i) * 4, 166 + (i % 3) * 4, t, i * 1.7, ['#ffb3c6', '#ffe08a', '#b8e0ff'][i % 3]);
    petalsFly(t, 18);
  };
  const sceneB = t => {                                                // os Reis saem do castelo
    sky(); ridge(104, 38, 5, '#8fb4e8', t * 2); ridge(124, 28, 12, '#6fc28a', t * 3); meadow(t, 148, 50);
    const open = ease(t / 1.2); castleFront(160, 150, 1, t, open);
    const p = ease((t - 1.2) / 3.2), s = lerp(0.5, 1.15, p), y = lerp(150, 170, p), walking = p > 0 && p < 1, al = clamp((t - 1.2) / 0.5);
    if (t > 1.2) { king(160 - 6 - p * 36, y, s, t, { walk: walking, alpha: al }); queen(160 + 6 + p * 36, y, s, t, { walk: walking, alpha: al }); }
    petalsFly(t, 12);
  };
  const sceneC = t => {                                                // o Rei corta a flor
    sky(); ridge(112, 36, 7, '#8fb4e8', t * 2); meadow(t, 142, 50);
    const gy = 168, fx = 240, cutY = 140, topY = 106, sw = Math.sin(t * 1.2) * 1.2;
    const kx = lerp(140, 212, ease(t / 1.6)), walking = t < 1.6;
    let a = [4, -10];
    if (t >= 1.6 && t < 2.5) a = [lerp(4, 16, ease((t - 1.6) / 0.4)), lerp(-10, -18, ease((t - 1.6) / 0.4))];
    else if (t >= 2.5) a = [lerp(16, 9, ease((t - 2.5) / 0.7)), lerp(-18, -15, ease((t - 2.5) / 0.7))];
    const hw = handAt(kx, gy, 1.5, false, a), cut = t >= 2.5;
    if (!cut) bloom(fx, gy, gy - topY, 20, sw * 0.02);
    else {
      g.strokeStyle = '#2f8f4e'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx, gy); g.lineTo(fx, cutY); g.stroke();
      oval(fx - 8, gy - 12, 8, 3, '#3fae62', -0.5);
    }
    king(kx, gy, 1.5, t, { walk: walking, hand: a });
    if (t >= 1.9 && t < 2.6) {                                          // a tesoura a cortar
      const op = 1 + 2.4 * (Math.sin(t * 28) * 0.5 + 0.5), cx = hw[0] + 1, cy = hw[1];
      g.strokeStyle = '#e8e8f2'; g.lineWidth = 1.5; g.lineCap = 'round';
      [-1, 1].forEach(sg => { g.beginPath(); g.moveTo(cx - 6, cy - sg * 2.5); g.lineTo(cx, cy); g.lineTo(cx + 7, cy + sg * op); g.stroke(); });
    }
    if (cut) {
      const p = ease((t - 2.5) / 1.1), bx = lerp(fx, hw[0], p), by = lerp(cutY, hw[1], p);
      bloom(bx, by, cutY - topY, 20, lerp(0, -0.2, p));
      if (t < 3) for (let i = 0; i < 6; i++) { const u = (t - 2.5) / 0.5, an = i * TAU / 6; g.globalAlpha = 1 - u; g.fillStyle = '#fff'; g.fillRect(fx + Math.cos(an) * u * 12, cutY + Math.sin(an) * u * 12, 2, 2); g.globalAlpha = 1; }
    }
    petalsFly(t, 10);
  };
  const sceneD = t => {                                                // o Rei dá a flor à Rainha
    sky(); ridge(112, 36, 4, '#8fb4e8', t * 2); meadow(t, 142, 50);
    const gy = 168, a = [14, -18];
    king(128, gy, 1.6, t, { hand: a }); queen(192, gy, 1.6, t, { flip: true, hand: a });
    const kh = handAt(128, gy, 1.6, false, a), qh = handAt(192, gy, 1.6, true, a), u = ease((t - 1) / 2);
    bloom(lerp(kh[0], qh[0], u), lerp(kh[1], qh[1], u), 22, 9, 0.08 * Math.sin(t * 2));
    if (t > 3) for (let i = 0; i < 5; i++) { const v = ((t - 3) * 0.35 + i / 5) % 1; heart(192 + Math.sin(v * 7 + i * 2) * 14 - 8, gy - 52 - v * 55, 3 + (i % 2), 1 - v); }
    petalsFly(t, 10);
  };
  const sunset = (t, withMother) => {                                  // pôr do sol em Petalândia (fundo das cenas E e F)
    grad('#ff9a62', '#ffe3b3'); oval(235, 100, 28, 28, 'rgba(255,245,210,0.9)');
    ridge(110, 40, 21, '#b184c9', t * 2); ridge(130, 30, 8, '#7a5cc0', t * 3);
    meadow(t, 144, 55); castleFront(78, 146, 0.55, t, 1);
    if (withMother) mother(262, 168, t, 1);
  };
  const sceneE = t => {                                                // fim: pôr do sol em Petalândia
    sunset(t, true);
    king(150, 170, 1.3, t, { hand: [8, -12] }); queen(176, 170, 1.3, t, { flip: true, hand: [14, -18] });
    const qh = handAt(176, 170, 1.3, true, [14, -18]); bloom(qh[0], qh[1], 18, 8, 0.05 * Math.sin(t * 2));
    for (let i = 0; i < 6; i++) { const v = (t * 0.25 + i / 6) % 1; heart(163 + Math.sin(v * 6 + i) * 12, 118 - v * 50, 3, (1 - v) * 0.9); }
    petalsFly(t, 14);
  };
  const sceneF = t => {                                                // uma carta desce devagar e pousa na relva
    sunset(t, true);
    const u = ease(t / 2.6), x0 = 160, ly = 164;
    const x = x0 + Math.sin(t * 2.4) * (1 - u) * 16, y = lerp(-16, ly, u), rot = Math.sin(t * 2.4 + 1) * (1 - u) * 0.35;
    const gl = g.createRadialGradient(x0, ly, 1, x0, ly, 40 * u);                                          // brilho quando pousa
    gl.addColorStop(0, 'rgba(255,244,200,' + (0.55 * u).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = gl; g.fillRect(x0 - 42, ly - 42, 84, 84);
    oval(x0, ly + 12, 20 * u, 3 * u, 'rgba(0,0,0,0.25)');
    g.save(); g.translate(x, y); g.rotate(rot); envelope(0, 0, 44, 28, 0, true); g.restore();
    if (t > 2.6) for (let i = 0; i < 6; i++) { const a = 0.4 + 0.6 * Math.sin(t * 3 + i * 1.7); if (a > 0.3) sparkle(x0 + Math.cos(i * 1.05) * 30, ly - 6 + Math.sin(i * 1.05) * 18, 2 + (i % 2), a.toFixed(2)); }
    petalsFly(t, 10);
  };
  // ----- layout do texto da carta (quebra automática + scroll) -----
  const LETTER_COLS = 22, LINE_H = 12, VIEW_T = 28, VIEW_H = 112, TEXT_X = 72;      // 22 letras por linha; zona visível da folha: y de 28 a 140
  const wrapText = (txt, cols) => {
    const out = [];
    txt.split('\n').forEach(par => {
      if (!par.trim()) { out.push(''); return; }
      let line = '';
      par.split(/\s+/).filter(Boolean).forEach(word => {
        while (word.length > cols) { if (line) { out.push(line); line = ''; } out.push(word.slice(0, cols)); word = word.slice(cols); }
        if (!line) line = word; else if ((line + ' ' + word).length <= cols) line += ' ' + word; else { out.push(line); line = word; }
      });
      if (line) out.push(line);
    });
    return out;
  };
  const LINES = wrapText(LETTER_TEXT, LETTER_COLS), LEN = LINES.reduce((a, l) => a + l.length, 0);
  const T_LETTER = 5.6, CH_S = clamp(LETTER_SECONDS / LEN, 0.004, 0.03), TOTAL_H = LINES.length * LINE_H + 12;          // T_LETTER = quando o texto começa; CH_S = segundos por letra
  const FIM_DELAY = Math.round((T_LETTER + LEN * CH_S + 1.5) * 1000);               // o "FIM" aparece depois de a carta ser escrita
  let scroll = 0, scrollVel = 0, dragging = false, userScrolled = false, letterSkip = false;
  const maxScroll = () => Math.max(0, TOTAL_H - VIEW_H);

  function letterText(t) {                                             // escreve o texto dentro da folha e trata do scroll
    const n = letterSkip ? LEN : Math.min(LEN, Math.floor((t - T_LETTER) / CH_S)), ms = maxScroll();
    if (!dragging && Math.abs(scrollVel) > 0.05) { scroll += scrollVel; scrollVel *= 0.92; } else if (!dragging) scrollVel = 0;
    if (!userScrolled && n < LEN) {                                    // enquanto escreve, a folha acompanha o texto
      let rem = n, li = 0; while (li < LINES.length - 1 && rem > LINES[li].length) { rem -= LINES[li].length; li++; }
      scroll += (Math.max(0, 6 + (li + 1) * LINE_H - VIEW_H + 6) - scroll) * 0.15;
    }
    scroll = clamp(scroll, 0, ms);
    g.save(); g.beginPath(); g.rect(60, VIEW_T, 200, VIEW_H); g.clip();
    g.font = '8px "Press Start 2P", "Courier New", monospace'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillStyle = '#4a3326';
    let left = n;
    for (let i = 0; i < LINES.length && left > 0; i++) {
      const y = VIEW_T + 6 + i * LINE_H - scroll;
      if (y > VIEW_T - LINE_H && y < VIEW_T + VIEW_H) g.fillText(LINES[i].slice(0, left), TEXT_X, y);
      left -= LINES[i].length;
    }
    if (ms > 0) {                                                      // esbatidos no topo/fundo, seta a piscar e barra de scroll
      if (scroll > 2) { const gr = g.createLinearGradient(0, VIEW_T, 0, VIEW_T + 12); gr.addColorStop(0, 'rgba(251,243,220,1)'); gr.addColorStop(1, 'rgba(251,243,220,0)'); g.fillStyle = gr; g.fillRect(60, VIEW_T, 200, 12); }
      if (scroll < ms - 2) {
        const gr = g.createLinearGradient(0, VIEW_T + VIEW_H - 16, 0, VIEW_T + VIEW_H); gr.addColorStop(0, 'rgba(251,243,220,0)'); gr.addColorStop(1, 'rgba(251,243,220,1)'); g.fillStyle = gr; g.fillRect(60, VIEW_T + VIEW_H - 16, 200, 16);
        if (Math.sin(t * 5) > 0) { g.fillStyle = '#9a7a55'; g.beginPath(); g.moveTo(156, VIEW_T + VIEW_H - 7); g.lineTo(164, VIEW_T + VIEW_H - 7); g.lineTo(160, VIEW_T + VIEW_H - 3); g.fill(); }
      }
      const th = Math.max(12, VIEW_H * VIEW_H / TOTAL_H), ty = VIEW_T + (VIEW_H - th) * (scroll / ms);
      g.fillStyle = 'rgba(154,122,85,0.25)'; g.fillRect(254, VIEW_T, 2, VIEW_H); g.fillStyle = '#9a7a55'; g.fillRect(254, ty, 2, th);
    }
    g.restore();
    cv.style.cursor = ms > 0 ? (dragging ? 'grabbing' : 'grab') : '';
  }

  const sceneG = t => {                                                // a carta abre-se e lê-se
    grad('#2a1740', '#6b3b7a');
    for (let i = 0; i < 26; i++) { const a = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.8 + i)); g.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; g.fillRect(rnd(i) * W | 0, rnd(i + 40) * 120 | 0, 1, 1); }
    const gl = g.createRadialGradient(160, 96, 6, 160, 96, 150); gl.addColorStop(0, 'rgba(255,230,180,0.35)'); gl.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    petalsFly(t, 8);                                                   // as pétalas ficam por trás da carta
    const ecx = 160, ecy = 128, ew = 120, eh = 74;
    const appear = ease(t / 1), o = ease((t - 1.4) / 1), rise = ease((t - 2.6) / 1.2), zoom = ease((t - 4) / 1.4);
    const ey = ecy + zoom * 90 + (1 - appear) * 30 + Math.sin(t * 2) * (1 - rise) * 1.5, al = appear * (1 - zoom);
    const pw0 = ew - 16, ph0 = 64, pcy0 = ey - 4 - rise * 68;
    if (zoom <= 0) envelope(ecx, ey, ew, eh, o, true, () => paper(ecx, pcy0, pw0, ph0), al);
    else { envelope(ecx, ey, ew, eh, o, false, null, al); paper(ecx, lerp(ecy - 4 - 68, 84, zoom), lerp(pw0, 200, zoom), lerp(ph0, 128, zoom)); }
    if (t > T_LETTER) letterText(t);
  };

  // ----- arrastar / roda do rato / setas para ler a carta toda; um toque (sem arrastar) completa a escrita -----
  const letterReady = () => active && idx === SCENES.length - 1 && (performance.now() - sStart) / 1000 > T_LETTER - 0.5;
  function skipLetter() {                                              // completa a escrita de uma vez
    if (!letterReady() || letterSkip) return;
    if ((performance.now() - sStart) / 1000 - T_LETTER >= LEN * CH_S) return;
    letterSkip = true; scroll = 0; scrollVel = 0; userScrolled = true;
    tStart = Math.min(tStart, performance.now() + 700);                // o "FIM" aparece logo a seguir
  }
  let dragY = 0, dragS = 0, lastY = 0, moved = 0;
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => {
    if (!letterReady()) return;
    dragging = true; dragY = lastY = e.clientY; dragS = scroll; moved = 0; scrollVel = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => {
    if (!dragging) return;
    const k = W / cv.getBoundingClientRect().width;
    moved = Math.max(moved, Math.abs(e.clientY - dragY)); if (moved > 3) userScrolled = true;
    scroll = clamp(dragS - (e.clientY - dragY) * k, 0, maxScroll());
    scrollVel = -(e.clientY - lastY) * k; lastY = e.clientY;
  });
  const endDrag = () => { if (!dragging) return; dragging = false; if (moved < 4) skipLetter(); };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('wheel', e => { if (!letterReady() || !maxScroll()) return; e.preventDefault(); userScrolled = true; scroll = clamp(scroll + e.deltaY * 0.4, 0, maxScroll()); }, { passive: false });

  const SCENES = [
    { hold: 3200, draw: sceneA, text: 'A maldição de Blurp quebrou-se: a Flor-Mãe voltou a crescer e, com ela, regressaram as cores e a luz a Petalândia.' },
    { hold: 3000, draw: sceneB, text: 'Então, as portas do castelo abriram-se e surgiram os Reis de Petalândia.' },
    { hold: 3000, draw: sceneC, text: 'O Rei aproximou-se da flor e, com todo o cuidado, cortou-a.' },
    { hold: 3200, draw: sceneD, text: 'E deu-a à sua mulher, a Rainha, que sorriu, feliz.' },
    { hold: 3000, draw: sceneE, text: 'E assim, Petalândia voltou a florescer, para sempre.' },
    { hold: 3200, draw: sceneF, text: 'Mas, antes de partir, o Rei deixou uma carta para quem salvou o seu reino.' },
    { hold: Infinity, draw: sceneG, delay: FIM_DELAY, text: 'FIM' }          // delay = o "FIM" só aparece depois de a carta ser lida
  ];

  // ===== controlo (igual ao da primeira história) =====
  const CHAR_MS = 38, TEXT_DELAY = 900, FADE_IN = 0.9, FADE_OUT = 600;
  let active = false, raf = null, idx = 0, sStart = 0, tStart = 0, times = [], outAt = 0, endTimer = null;

  function fit() {
    const s = Math.min(innerWidth * 0.94 / W, innerHeight * 0.6 / H);
    cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; stext.style.width = W * s + 'px'; wrap.style.setProperty('--gs', s);
  }
  addEventListener('resize', () => { if (active) fit(); });

  function begin(i) {
    idx = i; const s = SCENES[i]; sStart = performance.now(); tStart = sStart + (s.delay !== undefined ? s.delay : TEXT_DELAY); outAt = 0;
    let acc = 0; times = [];
    for (const ch of s.text) { times.push(acc); acc += CHAR_MS + (ch === ',' ? 220 : ch === '.' ? 300 : 0); }
    scroll = 0; scrollVel = 0; dragging = false; userScrolled = false; letterSkip = false; cv.style.cursor = '';
    sfull.textContent = s.text; slive.textContent = ''; stext.style.opacity = 1;
    skipBtn.style.display = i === SCENES.length - 1 ? 'none' : '';
  }
  function advance() {
    if (!active || outAt || idx === SCENES.length - 1) return;
    const now = performance.now(), lastT = times[times.length - 1];
    if (now - tStart < lastT) tStart = now - lastT - 1; else outAt = now;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const s = SCENES[idx], t = (now - sStart) / 1000;
    g.clearRect(0, 0, W, H); s.draw(t);
    let a = 1 - clamp(t / FADE_IN);
    if (outAt) a = Math.max(a, clamp((now - outAt) / FADE_OUT));
    if (a > 0) { g.fillStyle = 'rgba(0,0,0,' + a + ')'; g.fillRect(0, 0, W, H); }
    const el = now - tStart; let n = 0; while (n < times.length && times[n] <= el) n++;
    slive.textContent = s.text.slice(0, n);
    if (outAt) stext.style.opacity = 1 - clamp((now - outAt) / (FADE_OUT * 0.8));
    else if (n === s.text.length && el > times[times.length - 1] + s.hold) outAt = now;
    if (outAt && now - outAt >= FADE_OUT && idx + 1 < SCENES.length) begin(idx + 1);
  }

  function startEnding() {
    if (active) return;
    active = true; fit(); g.imageSmoothingEnabled = false;
    flowerEl.style.visibility = 'hidden';
    wrap.style.display = 'flex'; requestAnimationFrame(() => { wrap.style.opacity = '1'; });
    begin(0); raf = requestAnimationFrame(loop);
  }
  function stopEnding() {
    clearTimeout(endTimer); endTimer = null; active = false; cancelAnimationFrame(raf); raf = null;
    wrap.style.display = 'none'; wrap.style.opacity = '0'; flowerEl.style.visibility = '';
  }

  // o final começa depois de clicares na flor e as cores se espalharem
  const arm = () => { clearTimeout(endTimer); endTimer = setTimeout(startEnding, BLOOM_MS + AFTER_BLOOM_MS); };
  flowerEl.addEventListener('click', () => { if (flowerEl.classList.contains('ready')) arm(); if (flowerEl.blur) flowerEl.blur(); }, true);
  addEventListener('keydown', e => {
    if (flowerEl.classList.contains('ready') && (e.code === 'Enter' || e.code === 'Space')) arm();
    if (!active) return;
    if (e.code === 'Escape') { if (idx < SCENES.length - 1) begin(SCENES.length - 1); }
    else if (['KeyZ', 'Enter', 'Space'].includes(e.code)) { e.preventDefault(); if (!e.repeat) { advance(); skipLetter(); } }
    else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(e.code) && letterReady() && maxScroll()) { e.preventDefault(); userScrolled = true; scroll = clamp(scroll + (e.code.endsWith('Down') ? 1 : -1) * (e.code.startsWith('Page') ? 80 : 24), 0, maxScroll()); }
  }, true);
  wrap.addEventListener('click', advance);
  skipBtn.addEventListener('click', e => { e.stopPropagation(); if (active) begin(SCENES.length - 1); });
  document.getElementById('test').addEventListener('click', stopEnding);   // o botão de teste reinicia tudo

  window.startEnding = startEnding; window.stopEnding = stopEnding;
  // atalho para testar só o final: abre o site com #final no fim do endereço
  if (location.hash === '#final') { app.classList.add('finished'); startEnding(); }
})();