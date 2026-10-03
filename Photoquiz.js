/* ---------- Jogo "Foto mais recente ou mais antiga?" (abre ao interagir com a polaroid) ---------- */
const PQ_ROUNDS = 10;                        // número de pares por jogo (no máximo)
const PQ_WIN = 6;                            // acertos necessários para ganhar (nunca mais do que o número de pares)
const PQ_OK_MS = 2000, PQ_BAD_MS = 2600;     // tempo a mostrar as datas antes de passar à seguinte (certa / errada)

(function () {
  const $ = id => document.getElementById(id);
  const box = $('pquiz'), prog = $('pqprog'), full = $('pqfull'), live = $('pqlive'), photos = $('pqphotos'), opts = $('pqopts'), fb = $('pqfb');
  const LIST = () => (typeof PHOTOS !== 'undefined' ? PHOTOS : []);
  let pairs = [], i = 0, score = 0, sel = 0, phase = 'closed', list = [], right = 0, pair = null, typing = null, hideT = null, autoT = null, ignoreUntil = 0;

  const shuffle = a => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  const items = () => Array.from((phase === 'ask' || phase === 'result' ? photos : opts).children);
  const choosing = () => phase === 'intro' || phase === 'ask' || phase === 'end';
  const rounds = () => Math.min(PQ_ROUNDS, Math.floor(LIST().length / 2)), need = () => Math.min(PQ_WIN, rounds());
  const playable = () => new Set(LIST().map(p => p.date)).size >= 2;

  function say(text) {                                          // máquina de escrever
    clearInterval(typing); full.textContent = text; live.textContent = ''; let n = 0;
    typing = setInterval(() => { live.textContent = text.slice(0, ++n); if (n >= text.length) { clearInterval(typing); typing = null; } }, 26);
  }
  function paint() { items().forEach((b, k) => b.classList.toggle('sel', k === sel && choosing())); }
  function setOptions(l) {                                      // botões de texto (início e fim)
    list = l; sel = 0; opts.innerHTML = ''; photos.innerHTML = ''; photos.classList.remove('on');
    l.forEach((o, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'qopt'; b.textContent = o.label;
      b.addEventListener('click', () => { sel = k; paint(); o.fn(); });
      b.addEventListener('mouseenter', () => { if (choosing()) { sel = k; paint(); } });
      opts.appendChild(b);
    });
    paint();
  }
  function setPhotos(pr) {                                      // as duas fotografias
    opts.innerHTML = ''; photos.innerHTML = ''; photos.classList.add('on'); sel = 0;
    list = pr.map((p, k) => ({ fn: () => answer(k) }));
    pr.forEach((p, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'qph';
      const w = document.createElement('span'); w.className = 'qimg';
      const im = document.createElement('img'); im.alt = ''; im.src = p.src; im.addEventListener('error', () => w.classList.add('miss'));
      const c = document.createElement('span'); c.className = 'qcap'; c.innerHTML = '&nbsp;';
      w.appendChild(im); b.appendChild(w); b.appendChild(c);
      b.addEventListener('click', () => { sel = k; paint(); answer(k); });
      b.addEventListener('mouseenter', () => { if (phase === 'ask') { sel = k; paint(); } });
      photos.appendChild(b);
    });
    paint();
  }

  function makePairs() {                                        // pares com datas diferentes
    const n = Math.min(PQ_ROUNDS, Math.floor(LIST().length / 2)), out = [];
    let pool = shuffle(LIST()), tries = 0;
    while (out.length < n && tries++ < 200) {
      if (pool.length < 2) pool = shuffle(LIST());
      const a = pool.pop(), k = pool.findIndex(p => p.date !== a.date);
      if (k >= 0) out.push(shuffle([a, pool.splice(k, 1)[0]]));
    }
    return out;
  }

  function intro() {
    phase = 'intro'; box.classList.add('intro'); box.classList.remove('end');
    prog.textContent = 'Como funciona'; fb.textContent = '';
    if (!playable()) {
      say('Ainda não há fotografias suficientes.');
      setOptions([{ label: 'Sair', fn: close }]);
      return;
    }
    say('Vais ver pares de fotografias.\n\nEm cada par, escolhe a mais recente ou a mais antiga, conforme te for pedido.\n\nPara ganhares, tens de acertar ' + need() + ' de ' + rounds() + '.');
    fb.textContent = 'Responde com o rato, com as setas + Enter, ou com as teclas 1 e 2.';
    setOptions([{ label: 'Começar', fn: begin }]);
  }
  function begin() { pairs = makePairs(); i = 0; score = 0; box.classList.remove('intro', 'end'); ask(); }
  function ask() {
    phase = 'ask'; pair = pairs[i]; fb.textContent = '';
    const recent = Math.random() < 0.5, later = pair[0].date > pair[1].date ? 0 : 1;
    right = recent ? later : 1 - later;
    prog.textContent = (i + 1) + ' / ' + pairs.length;
    say('Qual foto é a mais ' + (recent ? 'recente' : 'antiga') + '?');
    setPhotos(pair);
  }
  function answer(k) {
    if (phase !== 'ask') return;
    phase = 'result'; clearInterval(typing); typing = null; live.textContent = full.textContent;
    const ok = k === right; if (ok) score++;
    Array.from(photos.children).forEach((b, j) => {
      b.classList.remove('sel'); b.classList.toggle('ok', j === right); b.classList.toggle('bad', j === k && !ok);
      b.disabled = true; b.querySelector('.qcap').textContent = fmtDate(pair[j].date);
    });
    fb.textContent = ok ? 'Certo!' : 'Errado.';
    autoT = setTimeout(next, ok ? PQ_OK_MS : PQ_BAD_MS);        // passa sozinho (Enter/E/Espaço salta a espera)
  }
  function next() {
    if (phase !== 'result') return; clearTimeout(autoT);
    if (++i < pairs.length) ask(); else end();
  }
  function end() {
    phase = 'end'; box.classList.add('end');
    const win = score >= Math.min(PQ_WIN, pairs.length);
    prog.textContent = 'Resultado'; say((win ? 'Ganhaste!' : 'Não foi desta.') + '\nAcertaste ' + score + ' de ' + pairs.length + '.');
    fb.textContent = win ? 'Ao longe, ouve-se o som de correntes a cair.' : 'Precisas de acertar ' + Math.min(PQ_WIN, pairs.length) + ' de ' + pairs.length + '.';
    if (win) window.photoWon = true;                               // ganhar solta a segunda corrente do portão (game.js)
    setOptions([{ label: 'Jogar outra vez', fn: begin }, { label: 'Sair', fn: close }]);
  }

  function open() {
    clearTimeout(hideT); window.quizActive = true; ignoreUntil = performance.now() + 300;   // ignora o E que abriu o jogo
    box.style.display = 'flex'; requestAnimationFrame(() => box.classList.add('on')); intro();
  }
  function close() {
    phase = 'closed'; clearInterval(typing); typing = null; clearTimeout(autoT); window.quizActive = false;
    box.classList.remove('on'); hideT = setTimeout(() => { box.style.display = 'none'; }, 500);
  }

  addEventListener('keydown', e => {
    if (phase === 'closed' || performance.now() < ignoreUntil) return;
    const k = e.code, n = list.length;
    if (k === 'Escape') close();
    else if (choosing() && ['ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW'].includes(k)) { sel = (sel + n - 1) % n; paint(); }
    else if (choosing() && ['ArrowRight', 'KeyD', 'ArrowDown', 'KeyS'].includes(k)) { sel = (sel + 1) % n; paint(); }
    else if (phase === 'ask' && /^Digit[1-9]$/.test(k) && +k.slice(5) <= n) list[+k.slice(5) - 1].fn();
    else if (['Enter', 'Space', 'KeyE'].includes(k)) { if (!e.repeat) { if (phase === 'result') next(); else if (list[sel]) list[sel].fn(); } }
    else return;
    e.preventDefault();
  });
  box.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('button')) e.preventDefault(); });
  $('pqexit').addEventListener('click', close);
  window.startPhotoQuiz = open;
})();