/* ---------- Mini-jogo (estilo Undertale, vista de cima, vibe Limbo) ---------- */
(function () {
  const TILE = 16, COLS = 20, ROWS = 11, GW = COLS * TILE, GH = ROWS * TILE;   // ecrã lógico 320x176

  // ===== PUZZLE DA SECRETÁRIA (A Casa) =====
  const SHAPES = ['circle', 'square', 'triangle', 'diamond'];   // símbolo de cada um dos 4 botões da Casa (índices 0 a 3)
  const CODE = [2, 0, 3, 1];                                      // sequência certa: triângulo, círculo, losango, quadrado (o papel na Floresta mostra esta ordem)

  // ===== SALAS (edita aqui os nomes, mapas e textos) =====
  // '#' parede/árvore · '.' chão · 'w' água · 'p' cais · 'g' muro do portão · 'c' castelo (sólido) · letras maiúsculas (A, B, C, D) = corredores de saída (definidos em exits)
  const ROOMS = [
    { name: 'O Jardim', tree: true,   // sala principal
      map: ['##########C#########','#..................#','#..#..........#....#','#..................#','#..................#',
            'A..................B','#..................#','#...#..........#...#','#..................#','#..................#','##########F#########'],
      exits: { F: { to: 4, x: 10, y: 1 }, A: { to: 2, x: 17, y: 5 }, B: { to: 1, x: 2, y: 5 }, C: { to: 3, x: 10, y: 9 } },
            objs: [] },
    { name: 'A Floresta', tree: true,
      map: ['####################','#..#....#......#...#','#......#....#......#','#..#..........#..#.#','#.....#....#.......#',
            'A..................#','#..#....#......#...#','#.......#..#.......#','#.#..#........#..#.#','#..................#','####################'],
      exits: { A: { to: 0, x: 17, y: 5 } },
      objs: [{ kind: 'trunk', x: 10, y: 5, r: 26, quiz: true, text: [
        '* Um tronco partido ao meio, caído no meio da floresta.', '* Há frases riscadas na madeira. Parecem-te familiares.', '* Tentas lembrar-te de quem as disse.'] },
             { kind: 'note', x: 16, y: 7, solid: false, r: 22, text: [        // papel com a sequência dos botões da Casa
               '* Um papel dobrado, preso entre as raízes de uma árvore.', '* Há símbolos desenhados, por ordem.'] }] },                // tronco partido: abre o jogo "quem disse esta frase?" (quiz.js)
    { name: 'A Casa', tree: false,
      map: ['####################','#..................#','#.####.........###.#','#.#..#.........#...#','#.####.........###.#',
            '#..................B','#..................#','#....##......##....#','#....##......##....#','#..................#','####################'],
      exits: { B: { to: 0, x: 2, y: 5 } },
      blocks: [{ x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 9, y: 5 }, { x: 11, y: 5 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }],   // blocos à volta da secretária (saem com a sequência certa)
      lamps: { x: 160, y: 24 },                                                                                                                          // luzes que mostram o progresso na sequência
      objs: [{ kind: 'desk', x: 10, y: 5, r: 38, pref: true, text: [      // secretária com um caderno: abre o jogo "o que é que o teu namorado prefere?" (prefquiz.js)
               '* Uma secretária velha, com um caderno aberto em cima.', '* Há perguntas escritas à mão, uma por página.', '* Sobre ele. Será que o conheces assim tão bem?'] },
             { kind: 'button', idx: 0, x: 6, y: 5, solid: false, r: 20 }, { kind: 'button', idx: 1, x: 10, y: 2, solid: false, r: 20 },     // os 4 botões do chão (idx = índice em SHAPES)
             { kind: 'button', idx: 2, x: 14, y: 5, solid: false, r: 20 }, { kind: 'button', idx: 3, x: 10, y: 8, solid: false, r: 20 }] },
    { name: 'O Lago', tree: true,                       // fica por cima do Jardim (corredor C)
      map: ['####################','#wwwwwwwwwwwwwwwwww#','#wwwwwwwwwpwwwwwwww#','#wwwwwwwwwpwwwwwwww#','#wwwwwwwwwpwwwwwwww#',
            '#.wwwwwwwwpwwwwwww.#','#..wwwwwwwpwwwwww..#','#..#...............#','#.....#.......#....#','#..................#','##########D#########'],
      exits: { D: { to: 0, x: 10, y: 1 } },
      objs: [{ kind: 'polaroid', x: 10, y: 2, solid: false, r: 22, photo: true, text: [      // foto no chão, na ponta do cais: abre o jogo das fotos (photoquiz.js)
        '* Uma fotografia polaroid, esquecida no chão, mesmo na ponta do cais.', '* Por baixo dela há mais fotografias. Será que te lembras de quando foram tiradas?'] }] },
    { name: 'O Portão', tree: true,                      // entra-se por cima (vindo do Jardim); o castelo ('c') desce atrás do portão
      map: ['##########G#########','#..................#','#..#..........#....#','#..................#','#...#..........#...#',
            '#.....cc' + 'ggggg' + 'cc....#','#.....cc' + 'HHHHH' + 'cc....#','#.....ccccccccc....#','#.....ccccccccc....#','#.....ccccccccc....#','####################'],
      exits: { G: { to: 0, x: 10, y: 9 }, H: { to: 5, x: 10, y: 1 } },   // H = o que está atrás do portão (só se chega lá com ele aberto)
      objs: [{ kind: 'gate', x: 10, y: 5, r: 46, text: ['* O portão de um castelo, preso com três correntes.', '* Não cede. Por agora, não há nada que o abra.'] }] },
    { name: 'A Clareira', tree: false, beam: { x: 10, y: 5 },   // beam = feixe de luz do céu até à flor; entra-se por cima
                        // atrás do portão: só a flor, no centro
      map: ['##########I#########','#..................#','#..................#','#..................#','#..................#',
            '#..................#','#..................#','#..................#','#..................#','#..................#','####################'],
      exits: { I: { to: 4, x: 10, y: 4 } },
      objs: [{ kind: 'firefly', x: 10, y: 5, r: 28, solid: false, blockRx: 22, blockRy: 9,   // blockRx/Ry = elipse dos espinhos, por onde não se passa
         text: [
        '* Um pirilampo, preso debaixo de uma tijela de vidro.', '* À volta dela, um círculo de espinhos negros.', '* Pousas a mão no vidro.'], after: 'bip' }] }
  ];

  // ===== elementos e estado =====
  const wrap = document.getElementById('gwrap'), gcv = document.getElementById('game'), gctx = gcv.getContext('2d');
  const cap = document.getElementById('gcap'), dbox = document.getElementById('dbox'), dtext = document.getElementById('dtext'), dfull = document.getElementById('dfull');
  const dnext = dbox.querySelector('.dnext'), ctl = document.getElementById('gctl');
  const keys = {};
  let active = false, raf = null, last = 0, room = 0, px = 0, py = 0, dir = 'd', walk = 0;
  let fade = 1, fadeTo = 0, fadeDur = 1.4, fadeCb = null, dlg = null, typing = null, capTimer = null;
  let gateOpen = false, gateOpening = false, gateT = 0, sleeping = false, sleepT = 0, gt = 0;
  let blocksOpen = false, blocksOpening = false, blocksT = 0, seqPos = 0, lampFlash = 0, paperView = false;   // puzzle da secretária
  const btnT = [0, 0, 0, 0];                                              // tempo que cada botão fica "carregado"
  const vis = o => !o.show || o.show();                                   // objetos com show() só existem quando isso é verdade
  const solidObj = o => o.solid !== false && vis(o) && !(o.kind === 'gate' && gateOpen);
  const usable = o => vis(o) && !(o.kind === 'gate' && (gateOpen || gateOpening)) && !(o.kind === 'button' && seqPos >= CODE.length);
  const allWon = () => window.quizWon && window.photoWon && window.prefWon;   // os três minijogos ganhos

  // textura do chão e grão (pré-renderizados)
  function noise(w, h, n, light) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    for (let i = 0; i < n; i++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (light * Math.random()).toFixed(2) + ')'; x.fillRect(Math.random() * w | 0, Math.random() * h | 0, 1, 1); }
    return c;
  }
  const floor = (() => { const c = noise(GW, GH, 2600, 0.14), x = c.getContext('2d'); x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#474747'; x.fillRect(0, 0, GW, GH); return c; })();
  const grain = [noise(GW, GH, 1800, 0.10), noise(GW, GH, 1800, 0.10), noise(GW, GH, 1800, 0.10)];

  function fit() {
    const s0 = Math.min(innerWidth / GW, (innerHeight * 0.94) / GH), s = s0 >= 1 ? Math.floor(s0) : s0;
    wrap.style.width = GW * s + 'px'; wrap.style.height = GH * s + 'px'; wrap.style.setProperty('--gs', s);
  }
  window.addEventListener('resize', () => { if (active) fit(); });

  // ===== colisões =====
  const solidAt = (r, x, y) => {
    const c = Math.floor(x / TILE), w = Math.floor(y / TILE), ch = (r.map[w] || '')[c];
    return ch === undefined || ch === '#' || ch === 'c' || ch === 'w' || (ch === 'g' && !gateOpen) || (!blocksOpen && r.blocks && r.blocks.some(b => b.x === c && b.y === w)) || r.objs.some(o => solidObj(o) && o.x === c && o.y === w);
  };
  const blocked = (r, x, y) => r.objs.some(o => o.blockRx && vis(o) && Math.pow((x - (o.x * TILE + 8)) / o.blockRx, 2) + Math.pow((y - (o.y * TILE + 13)) / o.blockRy, 2) < 1);
  const canMove = (x, y) => { const r = ROOMS[room]; return ![[x - 4, y - 5], [x + 3, y - 5], [x - 4, y], [x + 3, y]].some(([a, b]) => solidAt(r, a, b) || blocked(r, a, b)); };

  function setRoom(i, tx, ty) {
    room = i; px = tx * TILE + 8; py = ty * TILE + 14; walk = 0;
    cap.textContent = '— ' + ROOMS[i].name + ' —'; cap.classList.add('show');
    clearTimeout(capTimer); capTimer = setTimeout(() => cap.classList.remove('show'), 2400);
  }

  // ===== diálogo (efeito de máquina de escrever) =====
  function say(pages, done) { dlg = { pages, i: 0, done }; dbox.style.display = 'block'; typeLine(); }
  function typeLine() {
    const s = dlg.pages[dlg.i]; let n = 0; dlg.full = s; dfull.textContent = s; dtext.textContent = ''; dnext.style.visibility = 'hidden';
    clearInterval(typing);
    typing = setInterval(() => { dtext.textContent = s.slice(0, ++n); if (n >= s.length) { clearInterval(typing); typing = null; dnext.style.visibility = 'visible'; } }, 34);
  }
  function advance() {
    if (!dlg) return;
    if (typing) { clearInterval(typing); typing = null; dtext.textContent = dlg.full; dnext.style.visibility = 'visible'; return; }
    if (++dlg.i < dlg.pages.length) { typeLine(); return; }
    const d = dlg.done; dlg = null; dbox.style.display = 'none'; if (d) d();
  }
  function pressBtn(k) {                                              // carregar num botão: só avança se for o certo da sequência
    btnT[k] = 0.3;
    if (k === CODE[seqPos]) {
      seqPos++;
      if (seqPos >= CODE.length) say(['* Todas as luzes se acendem.', '* Os blocos à volta da secretária começam a desfazer-se.'], () => { blocksOpening = true; blocksT = 0; });
    } else { seqPos = 0; lampFlash = 0.9; }                          // enganaste-te: as luzes piscam e recomeça tudo
  }
  function use(o) {
    if (o.kind === 'gate') {                                            // três correntes = três missões; o portão abre sozinho quando as três estiverem feitas (ver update)
      const n = (window.quizWon ? 1 : 0) + (window.photoWon ? 1 : 0) + (window.prefWon ? 1 : 0);
      if (n === 1) { say(['* Uma das três correntes soltou-se e caiu no chão.', '* As outras continuam firmes.']); return; }
      if (n === 2) { say(['* Duas das três correntes soltaram-se e caíram no chão.', '* A outra continua firme.']); return; }
    }
    if (o.kind === 'button') { pressBtn(o.idx); return; }
    if (o.kind === 'note') {                                            // papel com a sequência dos botões da Casa
      const go = () => { paperView = true; };
      if (o.seen) go(); else { o.seen = true; say(o.text, go); }
      return;
    }
    if (o.pref && !blocksOpen) {                                        // enquanto os blocos lá estiverem, a secretária não se usa
      say(['* Uma secretária velha, cercada por blocos de pedra.', '* Não se mexem, por mais que empurres.', '* Há quatro botões no chão desta sala.']);
      return;
    }
    if (o.pref) {                                                       // a secretária abre o jogo "o que é que o teu namorado prefere?" (prefquiz.js)
      const go = () => { if (window.startPrefQuiz) window.startPrefQuiz(); };
      if (o.seen) go(); else { o.seen = true; say(o.text, go); }
      return;
    }
    if (o.photo) {                                                      // a polaroid abre o jogo "foto mais recente ou mais antiga?"
      const go = () => { if (window.startPhotoQuiz) window.startPhotoQuiz(); };
      if (o.seen) go(); else { o.seen = true; say(o.text, go); }
      return;
    }
    if (o.quiz) {
      const go = () => { if (window.startQuiz) window.startQuiz(); };
      if (o.seen) go(); else { o.seen = true; say(o.text, go); }      // a primeira vez, o personagem fala antes de o jogo abrir
      return;
    }   // o tronco abre o jogo "quem disse esta frase?" (quiz.js)
    say(o.text, o.after === 'bip' ? releaseBip : null);
  }
  function nearObj() {                                                // o objeto utilizável mais perto (dentro do seu raio)
    let best = null, bd = 1e9;
    ROOMS[room].objs.forEach(o => { if (!usable(o)) return; const d = Math.hypot(o.x * TILE + 8 - px, o.y * TILE + 8 - (py - 6)); if (d < (o.r || 24) && d < bd) { best = o; bd = d; } });
    return best;
  }
  function act() {
    if (!active || sleeping) return;
    if (paperView) { paperView = false; return; }
    if (dlg) { advance(); return; }
    if (fadeTo === 1 || blocksOpening) return;
    const o = nearObj();
    if (o) use(o);
  }

  // A flor dispara a animação que já existia: o Bip entra a voar, fala e morre (startFlight → speak → explode → flor)
  function releaseBip() {
    fadeTo = 1; fadeDur = 0.8;
    fadeCb = () => { gameStop(); bipTimer = setTimeout(startFlight, BLACK_MS); };
  }

  // ===== entrada =====
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  addEventListener('keydown', e => {
    if (!active || window.quizActive || e.ctrlKey || e.metaKey || e.altKey) return;
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
    else if (e.code === 'KeyE' || ((dlg || paperView) && ['Enter', 'Space', 'KeyZ'].includes(e.code)) || (paperView && e.code === 'Escape')) { e.preventDefault(); if (!e.repeat) act(); }   // E interage; com texto aberto, também Enter/Espaço avançam
  });
  addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
  ctl.querySelectorAll('button').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (k === 'act') act(); else keys[k] = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { if (k !== 'act') keys[k] = false; }));
  });
  wrap.addEventListener('click', () => { if (!active) return; if (paperView) paperView = false; else if (dlg) advance(); });   // o rato só avança o texto; os objetos só se usam com o E

  // ===== ciclo =====
  function update(dt) {
    if (fade !== fadeTo) {
      const st = dt / fadeDur;
      fade = Math.abs(fadeTo - fade) <= st ? fadeTo : fade + Math.sign(fadeTo - fade) * st;
      if (fade === fadeTo && fadeCb) { const cb = fadeCb; fadeCb = null; cb(); if (!active) return; }
    }
    if (sleeping) {                                                   // depois da história, o personagem está a dormir e acorda
      sleepT += dt;
      if (sleepT > 3.6 && !dlg) { sleeping = false; say(['* Acordas devagar, sem saber bem onde estás.', '* Tiveste um sonho estranho, com uma flor branca no meio da escuridão.']); }
    }
    if (gateOpening) {                                                // animação do portão (3,2 s)
      gateT = Math.min(1, gateT + dt / 3.2);
      if (gateT >= 1) { gateOpening = false; gateOpen = true; say(['* Do outro lado, um caminho leva até uma luz branca.']); }
    }
    if (!gateOpen && !gateOpening && allWon() && !dlg && !sleeping && fadeTo !== 1 && !window.quizActive) {   // os três jogos ganhos: o portão abre sozinho
      if (room === 4) say(['* As correntes soltam-se e caem no chão, uma a uma.', '* As portas do castelo começam a abrir-se, devagar.'], () => { gateOpening = true; gateT = 0; });
      else say(['* Ao longe, ouve-se um estrondo.', '* O portão do castelo abriu-se sozinho.'], () => { gateOpen = true; });
    }
    for (let k = 0; k < 4; k++) if (btnT[k] > 0) btnT[k] -= dt;
    if (lampFlash > 0) lampFlash = Math.max(0, lampFlash - dt);
    if (blocksOpening) {                                              // os blocos desfazem-se em pó (1,6 s)
      blocksT = Math.min(1, blocksT + dt / 1.6);
      if (blocksT >= 1) { blocksOpening = false; blocksOpen = true; }
    }
    if (dlg || paperView || sleeping || fadeTo === 1 || window.quizActive || gateOpening || blocksOpening) { walk = 0; return; }
    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx || dy) {
      const l = Math.hypot(dx, dy); dx /= l; dy /= l; walk += dt * 8;
      dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
      const sp = 62 * dt;
      if (canMove(px + dx * sp, py)) px += dx * sp;
      if (canMove(px, py + dy * sp)) py += dy * sp;
    } else walk = 0;
    const r = ROOMS[room], ex = r.exits[((r.map[Math.floor((py - 4) / TILE)] || '')[Math.floor(px / TILE)])];
    if (ex) { fadeTo = 1; fadeDur = 0.25; fadeCb = () => { setRoom(ex.to, ex.x, ex.y); fadeTo = 0; }; }
  }

  function drawPlayer(x, y) {                                 // silhueta preta com olhos brancos
    if (sleeping) {                                           // deitado, a respirar, com uns zzz
      const br = Math.sin(gt * 2) > 0 ? 1 : 0;
      gctx.fillStyle = 'rgba(0,0,0,0.35)'; gctx.beginPath(); gctx.ellipse(x, y, 12, 3, 0, 0, 7); gctx.fill();
      gctx.fillStyle = '#000';
      gctx.fillRect(x - 14, y - 5, 5, 4); gctx.fillRect(x - 10, y - 7 - br, 14, 6 + br); gctx.fillRect(x + 3, y - 9, 8, 8);
      gctx.fillStyle = '#fff'; gctx.fillRect(x + 7, y - 5, 3, 1);
      gctx.fillStyle = '#fff'; gctx.textAlign = 'left';
      for (let k = 0; k < 3; k++) {
        const u = (gt * 0.45 + k / 3) % 1;
        gctx.globalAlpha = 1 - u; gctx.font = (5 + k * 2) + 'px "Press Start 2P", monospace';
        gctx.fillText('z', x + 10 + u * 10 + k * 2, y - 12 - u * 20);
      }
      gctx.globalAlpha = 1;
      return;
    }
    const bob = walk ? Math.abs(Math.sin(walk * Math.PI)) : 0, f = walk ? Math.floor(walk) % 2 : 0;
    gctx.fillStyle = 'rgba(0,0,0,0.35)'; gctx.beginPath(); gctx.ellipse(x, y, 6, 2.2, 0, 0, 7); gctx.fill();
    gctx.fillStyle = '#000';
    gctx.fillRect(x - 4, y - 9 - bob, 8, 7);
    gctx.fillRect(x - 4, y - 3, 3, f ? 3 : 2); gctx.fillRect(x + 1, y - 3, 3, f ? 2 : 3);
    gctx.fillRect(x - 5, y - 16 - bob, 10, 8); gctx.fillRect(x - 4, y - 17 - bob, 8, 1);
    if (dir !== 'u') {
      const e = dir === 'd' ? [-3, 1] : dir === 'l' ? [-5, -2] : [0, 3];
      gctx.fillStyle = '#fff'; gctx.fillRect(x + e[0], y - 13 - bob, 2, 2); gctx.fillRect(x + e[1], y - 13 - bob, 2, 2);
    }
  }
  const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  function drawKey(x, y) {                                   // tecla E por cima do objeto (um ponto, em dispositivos tácteis)
    gctx.fillStyle = '#000'; gctx.fillRect(x - 6, y - 6, 12, 12); gctx.fillStyle = '#fff'; gctx.fillRect(x - 5, y - 5, 10, 10); gctx.fillStyle = '#000';
    if (TOUCH) { gctx.beginPath(); gctx.arc(x, y, 2.5, 0, 7); gctx.fill(); }
    else { gctx.fillRect(x - 2, y - 3, 1, 7); gctx.fillRect(x - 1, y - 3, 3, 1); gctx.fillRect(x - 1, y, 2, 1); gctx.fillRect(x - 1, y + 3, 3, 1); }
  }
  function drawObj(o, t) {
    const x = o.x * TILE + 8, y = o.y * TILE + 14;
    if (o.kind === 'flower') {
      const sw = Math.round(Math.sin(t * 1.6)), hx = x + sw, hy = y - 12;
      gctx.fillStyle = '#000'; gctx.fillRect(x - 1, y - 9, 3, 10); gctx.fillRect(hx - 5, hy - 2, 10, 5); gctx.fillRect(hx - 2, hy - 5, 5, 10);
      gctx.fillStyle = '#fff'; gctx.fillRect(x, y - 8, 1, 9); gctx.fillRect(x - 3, y - 4, 3, 1); gctx.fillRect(x + 1, y - 5, 3, 1);
      gctx.fillRect(hx - 4, hy - 1, 8, 3); gctx.fillRect(hx - 1, hy - 4, 3, 8);
      gctx.fillStyle = '#000'; gctx.fillRect(hx - 1, hy - 1, 2, 2);
    } else if (o.kind === 'firefly') {                                 // pirilampo preso numa tijela de vidro, rodeada de espinhos
      const cy = y - 1, RX = 19, RY = 6, N = 14, thorn = (k, front) => {
        const a = k * Math.PI * 2 / N + 0.2, bx = x + Math.cos(a) * RX, by = cy + Math.sin(a) * RY;
        if ((Math.sin(a) > 0) !== front) return;
        const h = 8 + rnd(k * 4.7) * 6, tip = bx + Math.cos(a) * 3 + Math.sin(t * 0.9 + k) * 0.6;
        gctx.fillStyle = '#000'; gctx.strokeStyle = '#3b3b4d'; gctx.lineWidth = 0.8;
        gctx.beginPath(); gctx.moveTo(bx - 2, by); gctx.lineTo(tip, by - h); gctx.lineTo(bx + 2, by); gctx.closePath(); gctx.fill(); gctx.stroke();
      };
      gctx.fillStyle = 'rgba(0,0,0,0.4)'; gctx.beginPath(); gctx.ellipse(x, cy, RX + 3, RY + 2, 0, 0, 7); gctx.fill();
      for (let k = 0; k < N; k++) thorn(k, false);                                                       // espinhos de trás
      gctx.fillStyle = '#16161d'; gctx.beginPath(); gctx.ellipse(x, y - 2, 11, 3.4, 0, 0, 7); gctx.fill();   // base da tijela
      const fx = x + Math.sin(t * 1.3) * 3, fy = y - 7 + Math.sin(t * 2.3) * 1.5, pulse = 0.55 + 0.45 * Math.sin(t * 3.1);
      const gl = gctx.createRadialGradient(fx, fy, 0.5, fx, fy, 15);                                      // brilho do pirilampo
      gl.addColorStop(0, 'rgba(255,255,255,' + (0.35 + 0.5 * pulse).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,255,255,0)'); gctx.fillStyle = gl; gctx.fillRect(fx - 15, fy - 15, 30, 30);
      gctx.save(); gctx.beginPath(); gctx.arc(x, y - 2, 11, Math.PI, 0); gctx.closePath(); gctx.clip();     // o corpo nunca passa do vidro
      gctx.fillStyle = '#000'; gctx.fillRect(fx - 2, fy - 1, 4, 2); gctx.fillRect(fx - 1, fy - 3, 2, 1);
      gctx.fillStyle = '#fff'; gctx.fillRect(fx + (Math.cos(t * 1.3) > 0 ? -3 : 2), fy, 1, 1);
      gctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * pulse).toFixed(2) + ')'; gctx.fillRect(fx - 1, fy + 1, 2, 2);
      gctx.fillStyle = 'rgba(255,255,255,0.5)'; gctx.fillRect(fx - 3, fy - 3 + Math.round(Math.sin(t * 30)), 2, 1); gctx.fillRect(fx + 1, fy - 3 - Math.round(Math.sin(t * 30)), 2, 1);   // asas a vibrar
      gctx.restore();
      gctx.beginPath(); gctx.arc(x, y - 2, 11, Math.PI, 0); gctx.closePath();                              // cúpula de vidro
      gctx.fillStyle = 'rgba(200,225,255,0.13)'; gctx.fill(); gctx.strokeStyle = 'rgba(255,255,255,0.5)'; gctx.lineWidth = 1; gctx.stroke();
      gctx.strokeStyle = 'rgba(255,255,255,0.7)'; gctx.beginPath(); gctx.arc(x, y - 2, 8, Math.PI * 1.15, Math.PI * 1.45); gctx.stroke();   // reflexo
      for (let k = 0; k < N; k++) thorn(k, true);                                                        // espinhos da frente
    } else if (o.kind === 'polaroid') {                                // foto polaroid no chão, com um brilho discreto
      const fy = o.y * TILE + 10, gl = gctx.createRadialGradient(x, fy, 1, x, fy, 13);
      gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); gctx.fillStyle = gl; gctx.fillRect(x - 13, fy - 13, 26, 26);
      gctx.save(); gctx.translate(x, fy); gctx.rotate(-0.3);
      gctx.fillStyle = 'rgba(0,0,0,0.45)'; gctx.fillRect(-4, -5, 9, 11);
      gctx.fillStyle = '#ececec'; gctx.fillRect(-4.5, -5.5, 9, 11);
      gctx.fillStyle = '#1b1b21'; gctx.fillRect(-3.5, -4.5, 7, 7);
      gctx.fillStyle = '#34343f'; gctx.fillRect(-2, -3, 3, 4);
      gctx.restore();
    } else if (o.kind === 'gate') {                                    // portão de castelo: torres, arco de pedra e duas portas que se abrem
      const top = o.y * TILE, bot = top + 2 * TILE, hw = 40, dw = 30, dy = top + 10;
      const sw = gateOpen ? 1 : gateOpening ? Math.min(1, Math.max(0, (gateT - 0.12) / 0.68)) : 0, p = sw * sw * (3 - 2 * sw);   // p: 0 fechado, 1 aberto
      const bricks = (rx, ry, rw, rh) => { for (let by = 0; by < rh; by += 5) { gctx.fillRect(rx, ry + by, rw, 1); for (let bx = (by / 5 % 2) * 5; bx < rw; bx += 10) gctx.fillRect(rx + bx, ry + by, 1, Math.min(5, rh - by)); } };
      if (!castleLayer) buildCastle(x, top, bot);                      // castelo por trás do portão: camada estática pré-desenhada + janelas e bandeiras animadas
      gctx.drawImage(castleLayer, 0, 0); drawCastleLive(t, p);
      if (p > 0) {                                                     // luz a sair pela porta (para o jogador, que vem de cima)
        const lg = gctx.createLinearGradient(0, top, 0, top - 34); lg.addColorStop(0, 'rgba(255,255,255,' + (0.3 * p).toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        gctx.fillStyle = lg; gctx.beginPath(); gctx.moveTo(x - 28, top); gctx.lineTo(x - 48, top - 34); gctx.lineTo(x + 48, top - 34); gctx.lineTo(x + 28, top); gctx.closePath(); gctx.fill();
      }
      gctx.fillStyle = '#15151c'; gctx.fillRect(x - hw, top, hw * 2, bot - top);                                   // muro
      gctx.fillStyle = '#1b1b24'; gctx.fillRect(x - hw - 4, top - 6, 14, bot - top + 6); gctx.fillRect(x + hw - 10, top - 6, 14, bot - top + 6);   // torres
      gctx.fillStyle = 'rgba(0,0,0,0.55)'; bricks(x - hw, top, hw * 2, bot - top); bricks(x - hw - 4, top - 6, 14, bot - top + 6); bricks(x + hw - 10, top - 6, 14, bot - top + 6);
      gctx.fillStyle = 'rgba(255,255,255,0.05)'; gctx.fillRect(x - hw, top, hw * 2, 1);
      gctx.fillStyle = '#1b1b24';
      [x - hw - 4, x + hw - 10].forEach(tx => [0, 5.5, 11].forEach(m => gctx.fillRect(tx + m, top - 9, 3, 3)));   // ameias das torres
      gctx.fillStyle = '#15151c'; for (let mx = x - 26; mx < x + 26; mx += 8) gctx.fillRect(mx, top - 3, 4, 3);   // ameias do muro
      gctx.save(); gctx.beginPath(); gctx.moveTo(x - dw, bot); gctx.lineTo(x - dw, dy); gctx.ellipse(x, dy, dw, 10, 0, Math.PI, 0); gctx.lineTo(x + dw, bot); gctx.closePath(); gctx.clip();   // o vão da porta
      gctx.fillStyle = '#050507'; gctx.fillRect(x - dw, top, dw * 2, bot - top);
      if (p > 0) {
        const a = p * (0.8 + 0.08 * Math.sin(t * 2)), gl = gctx.createRadialGradient(x, dy + 8, 2, x, dy + 8, 40);
        gl.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(2) + ')'); gl.addColorStop(1, 'rgba(210,215,235,' + (a * 0.55).toFixed(2) + ')');
        gctx.fillStyle = gl; gctx.fillRect(x - dw, top, dw * 2, bot - top);
      }
      [-1, 1].forEach(sg => {                                          // as duas portas de madeira, a rodar para dentro (em perspetiva)
        const hx = x + sg * dw, fx = hx - sg * dw * (1 - 0.86 * p), yt0 = top - 2, yb0 = bot, yt1 = yt0 + 9 * p, yb1 = yb0 - 5 * p;
        const lx = u => hx + (fx - hx) * u, yT = u => yt0 + (yt1 - yt0) * u, yB = u => yb0 + (yb1 - yb0) * u, ly = (u, v) => yT(u) + (yB(u) - yT(u)) * v;
        const poly = () => { gctx.beginPath(); gctx.moveTo(hx, yt0); gctx.lineTo(fx, yt1); gctx.lineTo(fx, yb1); gctx.lineTo(hx, yb0); gctx.closePath(); };
        gctx.fillStyle = '#1d1d27'; poly(); gctx.fill();
        gctx.strokeStyle = '#0c0c12'; gctx.lineWidth = 1; gctx.beginPath();
        [0.33, 0.66].forEach(u => { gctx.moveTo(lx(u), yT(u)); gctx.lineTo(lx(u), yB(u)); }); gctx.stroke();                 // tábuas
        gctx.strokeStyle = '#3a3a48'; gctx.lineWidth = 2; gctx.beginPath();
        [0.28, 0.72].forEach(v => { gctx.moveTo(hx, ly(0, v)); gctx.lineTo(fx, ly(1, v)); }); gctx.stroke();                 // faixas de ferro
        gctx.fillStyle = '#9a9aa8';
        [0.28, 0.72].forEach(v => [0.2, 0.5, 0.8].forEach(u => gctx.fillRect(lx(u) - 0.5, ly(u, v) - 0.5, 1.5, 1.5)));       // pregos
        if (p < 0.3) { gctx.strokeStyle = '#c8c8d2'; gctx.lineWidth = 1; gctx.beginPath(); gctx.arc(lx(1) - sg * 3, ly(1, 0.5), 2.2, 0, 7); gctx.stroke(); }   // argola
        if (p > 0) { gctx.fillStyle = 'rgba(0,0,0,' + (0.45 * p).toFixed(2) + ')'; poly(); gctx.fill(); }
      });
      gctx.restore();
      gctx.strokeStyle = '#3a3a48'; gctx.lineWidth = 2; gctx.beginPath();                                          // arco de pedra
      gctx.moveTo(x - dw - 1, bot); gctx.lineTo(x - dw - 1, dy); gctx.ellipse(x, dy, dw + 1, 11, 0, Math.PI, 0); gctx.lineTo(x + dw + 1, bot); gctx.stroke();
      gctx.fillStyle = '#3a3a48'; gctx.fillRect(x - 2, top - 3, 4, 5);                                             // pedra-chave
      [x - 37, x + 37].forEach((tx, i) => {                                                                        // tochas nas torres
        const ty = top + 12, fl = 0.7 + 0.3 * Math.sin(t * 9 + i * 2), gl = gctx.createRadialGradient(tx, ty, 1, tx, ty, 16);
        gl.addColorStop(0, 'rgba(255,255,255,' + (0.3 * fl).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        gctx.fillStyle = gl; gctx.fillRect(tx - 16, ty - 16, 32, 32);
        gctx.fillStyle = '#000'; gctx.fillRect(tx - 1, ty, 2, 5);
        gctx.fillStyle = '#fff'; gctx.fillRect(tx - 1, ty - 2 - Math.round(fl * 2), 2, 2 + Math.round(fl * 2));
      });
      if (!allWon()) {                                                 // correntes (uma por missão) e cadeado
        gctx.strokeStyle = '#9a9aa8'; gctx.lineWidth = 1.6; gctx.setLineDash([2, 1.5]); gctx.beginPath();
        if (!window.quizWon) { gctx.moveTo(x - 34, top + 8); gctx.lineTo(x + 34, bot - 6); }
        if (!window.photoWon) { gctx.moveTo(x + 34, top + 8); gctx.lineTo(x - 34, bot - 6); }
        if (!window.prefWon) { gctx.moveTo(x - 34, top + 20); gctx.lineTo(x + 34, top + 20); }
        gctx.stroke(); gctx.setLineDash([]);
        gctx.fillStyle = '#c8c8d2'; gctx.fillRect(x - 4, top + 16, 8, 7); gctx.strokeStyle = '#c8c8d2'; gctx.lineWidth = 1; gctx.beginPath(); gctx.arc(x, top + 16, 3, Math.PI, 0); gctx.stroke();
      }
      if (gateOpening) {                                               // poeira a cair do arco enquanto abre
        gctx.fillStyle = '#fff';
        for (let i = 0; i < 16; i++) { const u = (t * 0.8 + rnd(i * 3.7)) % 1; gctx.globalAlpha = (1 - u) * 0.6; gctx.fillRect(x - 36 + rnd(i * 5.1) * 72, top - 4 + u * (bot - top), 1, 1 + (i % 2)); }
        gctx.globalAlpha = 1;
      }
    } else if (o.kind === 'button') {                                  // botão de chão com um símbolo
      const cy = o.y * TILE + 8, pr = btnT[o.idx] > 0;
      gctx.fillStyle = 'rgba(0,0,0,0.4)'; gctx.beginPath(); gctx.ellipse(x, cy + 7, 9, 2.6, 0, 0, 7); gctx.fill();
      gctx.fillStyle = '#0a0a0e'; gctx.fillRect(x - 8, cy - 6, 16, 13);
      gctx.fillStyle = pr ? '#d8d8e0' : '#34343f'; gctx.fillRect(x - 7, cy - 5 + (pr ? 2 : 0), 14, pr ? 9 : 11);
      gctx.fillStyle = pr ? '#15151c' : '#e8e8f2'; shape(SHAPES[o.idx], x, cy + (pr ? 1 : -0.5), 3);
    } else if (o.kind === 'note') {                                    // papel dobrado no chão, com um brilho discreto
      const fy = o.y * TILE + 10, gl = gctx.createRadialGradient(x, fy, 1, x, fy, 13);
      gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); gctx.fillStyle = gl; gctx.fillRect(x - 13, fy - 13, 26, 26);
      gctx.save(); gctx.translate(x, fy); gctx.rotate(0.25);
      gctx.fillStyle = 'rgba(0,0,0,0.45)'; gctx.fillRect(-4, -5, 9, 11);
      gctx.fillStyle = '#ececec'; gctx.fillRect(-4.5, -5.5, 9, 11);
      gctx.fillStyle = '#9a9aa8'; gctx.fillRect(-3, -3.5, 6, 1); gctx.fillRect(-3, -1, 6, 1); gctx.fillRect(-3, 1.5, 4, 1);
      gctx.restore();
    } else if (o.kind === 'desk') {                                    // secretária com um caderno aberto em cima
      gctx.fillStyle = 'rgba(0,0,0,0.35)'; gctx.beginPath(); gctx.ellipse(x, y + 1, 11, 3, 0, 0, 7); gctx.fill();
      gctx.fillStyle = '#000'; gctx.fillRect(x - 10, y - 8, 20, 4); gctx.fillRect(x - 9, y - 4, 2, 5); gctx.fillRect(x + 7, y - 4, 2, 5);   // tampo e pernas
      gctx.fillStyle = '#ececec'; gctx.fillRect(x - 6, y - 12, 6, 4); gctx.fillRect(x, y - 12, 6, 4);                                   // caderno aberto
      gctx.fillStyle = '#9a9aa8'; gctx.fillRect(x - 5, y - 11, 4, 1); gctx.fillRect(x - 5, y - 9.5, 3, 1); gctx.fillRect(x + 1, y - 11, 4, 1); gctx.fillRect(x + 1, y - 9.5, 3, 1);   // linhas escritas
      gctx.fillStyle = '#fff'; gctx.fillRect(x + 7, y - 11, 1, 5);                                                                       // caneta

    } else if (o.kind === 'trunk') {                                    // tronco partido: topo em farpas e um bocado caído ao lado
      gctx.fillStyle = 'rgba(0,0,0,0.32)'; gctx.beginPath(); gctx.ellipse(x + 2, y + 1, 11, 3.2, 0, 0, 7); gctx.fill();
      gctx.fillStyle = '#000'; gctx.fillRect(x - 6, y - 10, 12, 11); gctx.fillRect(x - 8, y - 2, 16, 3);
      gctx.beginPath(); gctx.moveTo(x - 6, y - 10); gctx.lineTo(x - 4, y - 17); gctx.lineTo(x - 2, y - 12); gctx.lineTo(x, y - 20);
      gctx.lineTo(x + 2, y - 11); gctx.lineTo(x + 4, y - 16); gctx.lineTo(x + 6, y - 10); gctx.closePath(); gctx.fill();
      gctx.save(); gctx.translate(x + 14, y - 1); gctx.rotate(0.12); gctx.fillRect(-7, -3, 14, 6);
      gctx.fillStyle = 'rgba(255,255,255,0.18)'; gctx.fillRect(-7, -3, 14, 1); gctx.fillStyle = '#3b3b4a'; gctx.fillRect(-7, -2, 2, 4); gctx.restore();
      gctx.strokeStyle = 'rgba(255,255,255,0.3)'; gctx.lineWidth = 1; gctx.beginPath(); gctx.moveTo(x - 1, y - 9); gctx.lineTo(x + 1, y - 4); gctx.lineTo(x - 1, y); gctx.stroke();
    } else {
      const g = gctx.createRadialGradient(x, y - 12, 1, x, y - 12, 34);
      g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      gctx.fillStyle = g; gctx.fillRect(x - 36, y - 48, 72, 72);
      gctx.fillStyle = '#000'; gctx.fillRect(x - 1, y - 10, 3, 11); gctx.fillRect(x - 3, y, 7, 1);
      gctx.fillStyle = '#fff'; gctx.fillRect(x - 2, y - 14, 5, 4);
    }
  }

  const rnd = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };   // "aleatório" estável

  function shape(kind, x, y, s) {                                        // símbolos dos botões e do papel (usa o fillStyle atual)
    gctx.beginPath();
    if (kind === 'circle') gctx.arc(x, y, s, 0, 7);
    else if (kind === 'square') gctx.rect(x - s * 0.85, y - s * 0.85, s * 1.7, s * 1.7);
    else if (kind === 'triangle') { gctx.moveTo(x, y - s); gctx.lineTo(x + s, y + s * 0.8); gctx.lineTo(x - s, y + s * 0.8); gctx.closePath(); }
    else { gctx.moveTo(x, y - s); gctx.lineTo(x + s, y); gctx.lineTo(x, y + s); gctx.lineTo(x - s, y); gctx.closePath(); }
    gctx.fill();
  }
  function drawBlock(b, t) {                                             // bloco de pedra à volta da secretária (desfaz-se em pó ao abrir)
    const p = blocksOpening ? blocksT : 0, s = 1 - p * p, cx = b.x * TILE + 8, cy = b.y * TILE + 8, h = 16 * s;
    if (s < 0.03) return;
    const jx = blocksOpening ? (rnd(Math.floor(t * 30) + b.x * 3 + b.y) - 0.5) * 1.6 : 0;
    gctx.save(); gctx.globalAlpha = 1 - p * 0.5;
    gctx.fillStyle = 'rgba(0,0,0,0.35)'; gctx.beginPath(); gctx.ellipse(cx + jx, cy + h / 2, h * 0.55, 2.6 * s, 0, 0, 7); gctx.fill();
    gctx.fillStyle = '#0c0c12'; gctx.fillRect(cx - h / 2 + jx, cy - h / 2, h, h);                    // frente
    gctx.fillStyle = '#2a2a36'; gctx.fillRect(cx - h / 2 + jx, cy - h / 2, h, h * 0.72);             // topo
    gctx.fillStyle = 'rgba(255,255,255,0.12)'; gctx.fillRect(cx - h / 2 + jx, cy - h / 2, h, 1);
    gctx.fillStyle = 'rgba(0,0,0,0.45)'; gctx.fillRect(cx + jx, cy - h / 2 + 1, 1, h * 0.7);
    if (blocksOpening) {                                                                              // poeira a subir
      gctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) { gctx.globalAlpha = (1 - p) * 0.6; gctx.fillRect(cx + (rnd(b.x * 7 + b.y * 3 + i) - 0.5) * 14, cy - p * 22 * (0.5 + rnd(i + b.x)), 1, 1); }
    }
    gctx.restore();
  }
  function drawLamps(l, t) {                                             // luzes que mostram quantos botões já acertaste
    const n = CODE.length, x0 = l.x - (n - 1) * 6;
    gctx.fillStyle = '#0a0a0e'; gctx.fillRect(x0 - 9, l.y - 7, (n - 1) * 12 + 18, 14); gctx.strokeStyle = '#3a3a48'; gctx.lineWidth = 1; gctx.strokeRect(x0 - 8.5, l.y - 6.5, (n - 1) * 12 + 17, 13);   // placa
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 12, on = i < seqPos || (lampFlash > 0 && Math.floor(lampFlash * 10) % 2 === 0);
      gctx.fillStyle = '#0a0a0e'; gctx.beginPath(); gctx.arc(x, l.y, 3.6, 0, 7); gctx.fill();
      if (on) {
        const gl = gctx.createRadialGradient(x, l.y, 0.5, x, l.y, 11); gl.addColorStop(0, 'rgba(255,255,255,0.5)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        gctx.fillStyle = gl; gctx.fillRect(x - 11, l.y - 11, 22, 22);
        gctx.fillStyle = '#fff'; gctx.beginPath(); gctx.arc(x, l.y, 2.4, 0, 7); gctx.fill();
      } else { gctx.strokeStyle = '#3a3a48'; gctx.lineWidth = 1; gctx.beginPath(); gctx.arc(x, l.y, 3.6, 0, 7); gctx.stroke(); }
    }
  }
  function drawNote(t) {                                                 // o papel com a sequência, em ecrã cheio
    gctx.fillStyle = 'rgba(0,0,0,0.8)'; gctx.fillRect(0, 0, GW, GH);
    const pw = 232, ph = 104, nx = (GW - pw) / 2, ny = 34, n = CODE.length, step = (pw - 40) / n;
    gctx.fillStyle = 'rgba(0,0,0,0.5)'; gctx.fillRect(nx + 3, ny + 4, pw, ph);
    gctx.fillStyle = '#ececec'; gctx.fillRect(nx, ny, pw, ph);
    gctx.strokeStyle = '#c8c8d2'; gctx.lineWidth = 1; gctx.strokeRect(nx + 0.5, ny + 0.5, pw - 1, ph - 1);
    gctx.font = '8px "Press Start 2P", monospace'; gctx.textAlign = 'center'; gctx.textBaseline = 'top';
    CODE.forEach((c, i) => {
      const cx = nx + 20 + step * (i + 0.5), cy = ny + 44;
      gctx.fillStyle = '#1b1b21'; shape(SHAPES[c], cx, cy, 11);
      gctx.fillStyle = '#6a6a78'; gctx.fillText(String(i + 1), cx, cy + 22);
      if (i < n - 1) { gctx.strokeStyle = '#6a6a78'; gctx.lineWidth = 1.5; gctx.beginPath(); gctx.moveTo(cx + step / 2 - 3, cy - 4); gctx.lineTo(cx + step / 2 + 2, cy); gctx.lineTo(cx + step / 2 - 3, cy + 4); gctx.stroke(); }
    });
    if (Math.sin(t * 6) > 0) { gctx.fillStyle = '#6a6a78'; gctx.beginPath(); gctx.moveTo(nx + pw - 14, ny + ph - 12); gctx.lineTo(nx + pw - 6, ny + ph - 12); gctx.lineTo(nx + pw - 10, ny + ph - 6); gctx.fill(); }
    gctx.textAlign = 'left';
  }

  // ===== castelo atrás do portão: camada estática (desenhada uma só vez) + janelas, bandeiras e névoa animadas =====
  let castleLayer = null, castleWins = [], castleFlags = [];
  function buildCastle(x, top, bot) {
    const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; const c = cv.getContext('2d');
    const B = (ROWS - 1) * TILE, wt = top + 10;
    castleWins = []; castleFlags = [];
    const bricks = (rx, ry, rw, rh, a) => { c.fillStyle = 'rgba(0,0,0,' + a + ')'; for (let by = 0; by < rh; by += 6) { c.fillRect(rx, ry + by, rw, 1); for (let bx = (by / 6 % 2) * 6; bx < rw; bx += 12) c.fillRect(rx + bx, ry + by, 1, Math.min(6, rh - by)); } };
    const speckle = (rx, ry, rw, rh, sd) => { for (let i = 0; i < rw * rh / 36; i++) { c.fillStyle = rnd(sd + i * 3.1) > 0.55 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)'; c.fillRect(rx + (rnd(sd + i * 5.3) * rw | 0), ry + (rnd(sd + i * 7.7) * rh | 0), 2, 1); } };
    const merl = (x0, x1, y, col) => { for (let mx = x0; mx < x1 - 2; mx += 7) { c.fillStyle = col; c.fillRect(mx, y - 4, 4, 4); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(mx, y - 4, 4, 1); } };
    const wg = c.createLinearGradient(0, wt, 0, B); wg.addColorStop(0, '#222230'); wg.addColorStop(1, '#0c0c12');          // muralha
    c.fillStyle = wg; c.fillRect(x - 72, wt, 144, B - wt); bricks(x - 72, wt, 144, B - wt, 0.35); speckle(x - 72, wt, 144, B - wt, 11);
    merl(x - 72, x + 72, wt, '#2a2a3a'); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x - 72, wt, 144, 1);
    [x - 72, x + 52].forEach((tx, ti) => {                                                                                   // torres laterais: cilindros com luz à esquerda
      const ty = top + 24, tw = 20, apx = tx + tw / 2, rb = ty - 3, ap = rb - 20;
      const tg = c.createLinearGradient(tx, 0, tx + tw, 0); tg.addColorStop(0, '#34344a'); tg.addColorStop(0.4, '#21212e'); tg.addColorStop(1, '#0b0b11');
      c.fillStyle = tg; c.fillRect(tx, ty, tw, B - ty); bricks(tx, ty, tw, B - ty, 0.4); speckle(tx, ty, tw, B - ty, 30 + ti * 9);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(tx, ty, 1, B - ty);
      c.fillStyle = '#2c2c3e'; c.fillRect(tx - 2, rb, tw + 4, 4); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(tx - 2, rb, tw + 4, 1);       // coroa
      c.fillStyle = '#09090e'; c.beginPath(); c.moveTo(tx - 4, rb); c.lineTo(apx, ap); c.lineTo(tx + tw + 4, rb); c.closePath(); c.fill();          // telhado cónico
      c.fillStyle = '#2a2a40'; c.beginPath(); c.moveTo(tx - 4, rb); c.lineTo(apx, ap); c.lineTo(apx - 1, rb); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 1;
      for (let k = 1; k < 4; k++) { const yy = rb - k * 5, hw = (tw / 2 + 4) * (1 - k / 4); c.beginPath(); c.moveTo(apx - hw, yy); c.lineTo(apx + hw, yy); c.stroke(); }
      c.fillStyle = '#c8c8d2'; c.fillRect(apx - 1, ap - 2, 2, 2);
      castleFlags.push({ x: apx, y: ap - 2 });
      castleWins.push({ x: apx, y: ty + 12, w: 3, h: 7 }, { x: apx, y: ty + 34, w: 3, h: 7 });
    });
    const kx = x - 26, ky = bot + 3, kw = 52;                                                                                // torre de menagem, por baixo do portão
    const kg = c.createLinearGradient(kx, 0, kx + kw, 0); kg.addColorStop(0, '#2c2c3e'); kg.addColorStop(0.5, '#1d1d29'); kg.addColorStop(1, '#0f0f16');
    c.fillStyle = kg; c.fillRect(kx, ky, kw, B - ky); bricks(kx, ky, kw, B - ky, 0.4); speckle(kx, ky, kw, B - ky, 77); merl(kx, kx + kw, ky, '#2c2c3e');
    [-14, 0, 14].forEach(d => castleWins.push({ x: x + d, y: ky + 8, w: 4, h: 9, arch: true }));
    castleWins.push({ x: x - 8, y: ky + 28, w: 3, h: 8 }, { x: x + 8, y: ky + 28, w: 3, h: 8 });
    const sh = c.createLinearGradient(0, B - 26, 0, B); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.6)');   // sombra junto ao chão
    c.fillStyle = sh; c.fillRect(x - 72, B - 26, 144, 26);
    c.fillStyle = '#2c2c3e'; c.fillRect(x - 74, B - 5, 148, 5); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(x - 74, B - 5, 148, 1);   // soco de pedra
    castleLayer = cv;
  }
  function drawCastleLive(t, p) {                                          // janelas (acendem-se quando o portão abre), bandeiras e névoa
    const B = (ROWS - 1) * TILE;
    castleWins.forEach((w, i) => {
      const base = 0.4 + 0.18 * Math.sin(t * 2.1 + i * 1.7), a = base + (1 - base) * p * 0.95;
      if (p > 0) { const gl = gctx.createRadialGradient(w.x, w.y + w.h / 2, 0.5, w.x, w.y + w.h / 2, 11); gl.addColorStop(0, 'rgba(255,255,255,' + (0.3 * p).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,255,255,0)'); gctx.fillStyle = gl; gctx.fillRect(w.x - 11, w.y - 8, 22, 28); }
      gctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      if (w.arch) { gctx.fillRect(w.x - w.w / 2, w.y, w.w, w.h); gctx.beginPath(); gctx.arc(w.x, w.y, w.w / 2, Math.PI, 0); gctx.fill(); }
      else gctx.fillRect(w.x - w.w / 2, w.y, w.w, w.h);
    });
    castleFlags.forEach(f => { gctx.fillStyle = '#fff'; gctx.fillRect(f.x, f.y - 9, 1, 9); gctx.beginPath(); gctx.moveTo(f.x + 1, f.y - 9); gctx.lineTo(f.x + 8 + Math.sin(t * 4 + f.x) * 1.5, f.y - 7 + Math.sin(t * 5)); gctx.lineTo(f.x + 1, f.y - 5); gctx.closePath(); gctx.fill(); });
    gctx.save(); gctx.beginPath(); gctx.rect(94, B - 18, 148, 18); gctx.clip(); gctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 3; i++) { gctx.beginPath(); gctx.ellipse(90 + ((t * 5 * (i + 1) + i * 70) % 190), B - 7 + i * 2, 40, 6, 0, 0, 7); gctx.fill(); }
    gctx.restore();
  }

  // Árvore de Limbo: sombra no chão, tronco, copa feita de vários círculos (diferente em cada árvore) e folhas iluminadas
  function drawTree(x, y, seed, t) {
    const sw = Math.sin(t * 0.9 + seed) * 0.7;
    gctx.fillStyle = 'rgba(0,0,0,0.32)'; gctx.beginPath(); gctx.ellipse(x + 9, y + 15, 10, 3.2, 0, 0, 7); gctx.fill();
    gctx.fillStyle = '#000';
    gctx.fillRect(x + 6, y + 5, 4, 11); gctx.fillRect(x + 4, y + 14, 8, 2);           // tronco e raízes
    for (let i = 0; i < 6; i++) {
      const a = rnd(seed + i * 3.1), b = rnd(seed + i * 5.7), c = rnd(seed + i * 7.3);
      gctx.beginPath(); gctx.arc(x + 8 + (a - 0.5) * 15 + sw, y + (b - 0.55) * 11, 5 + c * 4, 0, 7); gctx.fill();
    }
    gctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 7; i++) gctx.fillRect(x + 2 + rnd(seed + i * 2.3) * 12 + sw, y - 6 + rnd(seed + i * 4.1) * 9, 2, 1);
  }

  function draw(t) {
    gt = t; const r = ROOMS[room];
    gctx.save();
    if (gateOpening) { const a = gateT < 0.85 ? 1.3 : 0; gctx.translate((rnd(t * 60) - 0.5) * 2 * a, (rnd(t * 70) - 0.5) * 2 * a); }   // o ecrã treme enquanto o portão abre
    if (blocksOpening) gctx.translate((rnd(t * 60) - 0.5) * 1.2, (rnd(t * 70) - 0.5) * 1.2);          // o ecrã treme enquanto os blocos se desfazem
    gctx.drawImage(floor, 0, 0);
    const trees = [];
    r.map.forEach((row, ry) => [...row].forEach((ch, rx) => {
      const x = rx * TILE, y = ry * TILE;
      if (r.exits[ch]) { gctx.fillStyle = '#1b1b1b'; gctx.fillRect(x, y, TILE, TILE); }                    // corredor
      else if (ch === 'w') {                                                                               // água parada com ondulações
        gctx.fillStyle = '#0c0c0c'; gctx.fillRect(x, y, TILE, TILE);
        gctx.fillStyle = 'rgba(255,255,255,0.09)'; const o = Math.sin(t * 1.3 + rx * 0.9 + ry * 1.7) * 3;
        gctx.fillRect(x + 4 + o, y + 5, 7, 1); gctx.fillRect(x + 2 - o, y + 11, 5, 1);
      } else if (ch === 'p') {                                                                             // cais de tábuas
        gctx.fillStyle = '#2b2b2b'; gctx.fillRect(x, y, TILE, TILE); gctx.fillStyle = 'rgba(0,0,0,0.5)';
        for (let k = 3; k < TILE; k += 5) gctx.fillRect(x, y + k, TILE, 1);
      } else if (ch === 'g') { gctx.fillStyle = gateOpen ? '#1b1b1b' : '#0a0a0e'; gctx.fillRect(x, y, TILE, TILE);   // aberto: passagem
      } else if (ch === '#') {
        const border = rx === 0 || ry === 0 || rx === COLS - 1 || ry === ROWS - 1;
        if (r.tree && !border) { trees.push({ y: y + 15, fn: () => drawTree(x, y, rx * 31 + ry * 17, t) }); return; }
        gctx.fillStyle = '#000'; gctx.fillRect(x, y, TILE, TILE);
        if (r.tree) {                                                                                      // orla de floresta: copas a espreitar para dentro
          const b = ry === 0 ? [0, 1] : ry === ROWS - 1 ? [0, -1] : rx === 0 ? [1, 0] : [-1, 0];
          for (let i = 0; i < 2; i++) {
            const q = rnd(rx * 13 + ry * 7 + i * 3.3);
            gctx.beginPath(); gctx.arc(x + 8 + b[0] * (7 + q * 3) + (b[0] ? 0 : (q - 0.5) * 8), y + 8 + b[1] * (7 + q * 3) + (b[1] ? 0 : (q - 0.5) * 8), 7 + q * 3, 0, 7); gctx.fill();
          }
        }
      }
    }));
    if (r.lamps) drawLamps(r.lamps, t);
    const blockList = r.blocks && !blocksOpen ? r.blocks.map(b => ({ y: b.y * TILE + 15, fn: () => drawBlock(b, t) })) : [];
    const list = trees.concat(blockList, r.objs.filter(vis).map(o => ({ y: o.kind === 'gate' ? o.y * TILE : o.y * TILE + 14, fn: () => drawObj(o, t) })), { y: py, fn: () => drawPlayer(px, py) });
    list.sort((a, b) => a.y - b.y).forEach(d => d.fn());
    const near = nearObj();   // mostra a tecla E
    if (near && !dlg) drawKey(near.x * TILE + 8, near.y * TILE - 12 + Math.round(Math.sin(t * 5)));
    gctx.fillStyle = 'rgba(255,255,255,0.045)';                                                             // nevoeiro
    for (let i = 0; i < 4; i++) { gctx.beginPath(); gctx.ellipse(((t * 7 * (i + 1) + i * 120) % (GW + 220)) - 110, 30 + i * 42, 95, 22, 0, 0, 7); gctx.fill(); }
    const v = gctx.createRadialGradient(px, py - 6, 18, px, py - 6, 150);                                    // luz à volta da personagem
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.94)'); gctx.fillStyle = v; gctx.fillRect(0, 0, GW, GH);
    if (r.beam) {                                                                                           // feixe de luz do céu a apontar para a flor
      const bx = r.beam.x * TILE + 8, by = r.beam.y * TILE + 14, w0 = 30 + Math.sin(t * 0.8) * 2;
      const lg = gctx.createLinearGradient(0, 0, 0, by); lg.addColorStop(0, 'rgba(255,255,255,0.05)'); lg.addColorStop(1, 'rgba(255,255,255,0.32)');
      gctx.fillStyle = lg; gctx.beginPath(); gctx.moveTo(bx - w0, 0); gctx.lineTo(bx + w0, 0); gctx.lineTo(bx + 11, by); gctx.lineTo(bx - 11, by); gctx.closePath(); gctx.fill();
      const pool = gctx.createRadialGradient(bx, by, 1, bx, by, 34); pool.addColorStop(0, 'rgba(255,255,255,0.45)'); pool.addColorStop(1, 'rgba(255,255,255,0)');
      gctx.save(); gctx.translate(bx, by); gctx.scale(1, 0.4); gctx.fillStyle = pool; gctx.fillRect(-34, -34, 68, 68); gctx.restore();
      for (let i = 0; i < 16; i++) {                                                                        // poeira a descer na luz
        const u = (t * 0.1 + rnd(i * 3.3)) % 1, hw = w0 + (11 - w0) * u;
        gctx.globalAlpha = 0.25 + 0.5 * rnd(i * 5.9); gctx.fillStyle = '#fff';
        gctx.fillRect(bx + (rnd(i * 7.1) - 0.5) * 1.8 * hw + Math.sin(t + i) * 1.2, u * by, 1, 1);
      }
      gctx.globalAlpha = 1;
    }
    gctx.drawImage(grain[Math.floor(t * 12) % 3], 0, 0);
    if (paperView) drawNote(t);
    gctx.restore();
    if (fade > 0) { gctx.fillStyle = 'rgba(0,0,0,' + fade + ')'; gctx.fillRect(0, 0, GW, GH); }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); if (active) draw(now / 1000);
  }

  function startGame() {
    active = true; fit(); gctx.imageSmoothingEnabled = false;
    wrap.style.display = 'block'; ctl.classList.add('on');
    fade = 1; fadeTo = 0; fadeDur = 1.4; fadeCb = null; dlg = null;
gateOpen = false; gateOpening = false; gateT = 0; window.quizWon = false; window.photoWon = false; window.prefWon = false;
    blocksOpen = false; blocksOpening = false; blocksT = 0; seqPos = 0; lampFlash = 0; paperView = false; btnT.fill(0);   // os blocos voltam a rodear a secretária
    sleeping = true; sleepT = 0;                                      // começa deitado, a dormir
    ROOMS.forEach(r => r.objs.forEach(o => { o.seen = false; }));                        // cada vez que o jogo começa, o portão volta a estar fechado
    setRoom(0, 10, 8);
    last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function gameStop() {
    active = false; sleeping = false; paperView = false; cancelAnimationFrame(raf); raf = null; clearInterval(typing); typing = null; clearTimeout(capTimer);
    for (const k in keys) keys[k] = false;
    dlg = null; dbox.style.display = 'none'; cap.classList.remove('show');
    wrap.style.display = 'none'; ctl.classList.remove('on');
  }
  window.startGame = startGame; window.gameStop = gameStop;

  // atalho para testar só o jogo: abre o site com #jogo no fim do endereço
  if (location.hash === '#jogo') { app.classList.add('finished'); startGame(); }
})();