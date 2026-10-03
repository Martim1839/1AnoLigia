/* ---------- Jogo "O que é que o teu namorado prefere?" (abre ao interagir com a secretária da Casa) ---------- */
// Cada pergunta tem 2 a 4 opções ("o") e "a" é o índice da resposta certa (0 = a primeira opção).
// ATENÇÃO: as respostas certas abaixo são provisórias (a = 0). Confirma-as e troca as perguntas por outras tuas.
const PREFS = [
  { q: 'Pizza ou hambúrguer?',                     o: ['Pizza', 'Hambúrguer'],                          a: 0 },
  { q: 'Praia ou montanha?',                       o: ['Montanha', 'Praia'],                            a: 0 },
  { q: 'Filme em casa ou ir ao cinema?',           o: ['Filme em casa', 'Ir ao cinema'],                a: 0 },
  { q: 'Café ou chá?',                             o: ['Chá', 'Café'],                                  a: 0 },
  { q: 'Que tipo de filme?',                       o: ['Terror', 'Comédia', 'Ação', 'Romance'],         a: 0 },
  { q: 'Doce ou salgado?',                         o: ['Salgado', 'Doce'],                              a: 0 },
  { q: 'Cães ou gatos?',                           o: ['Gatos', 'Cães'],                                a: 0 },
  { q: 'Qual é a estação do ano favorita?',        o: ['Inverno', 'Verão', 'Outono', 'Primavera'],      a: 0 },
  { q: 'Cidade ou campo?',                         o: ['Campo', 'Cidade'],                              a: 0 },
  { q: 'Madrugar ou ficar acordado até tarde?',    o: ['Ficar acordado até tarde', 'Madrugar'],         a: 0 },
  { q: 'Qual é a refeição favorita?',              o: ['Jantar', 'Almoço', 'Pequeno-Almoço'],           a: 0 },
  { q: 'Chocolate ou gelado?',                     o: ['Gelado', 'Chocolate'],                          a: 0 }
];

const PREF_ROUNDS = 10;                                        // número de perguntas por jogo (no máximo)
const PREF_WIN = 6;                                            // acertos necessários para ganhar (nunca mais do que o número de perguntas)
const PREF_OK_MS = 1200, PREF_BAD_MS = 2200;                   // tempo a mostrar o resultado antes de passar sozinho à seguinte (certa / errada)
const PREF_TEXT = { win: 'Ganhaste!', lose: 'Não foi desta.' };   // textos do resultado

(function () {
  const $ = id => document.getElementById(id);
  const box = $('prefquiz'), prog = $('pfprog'), full = $('pffull'), live = $('pflive'), opts = $('pfopts'), fb = $('pffb');
  let order = [], cur = [], list = [], i = 0, score = 0, sel = 0, right = 0, phase = 'closed', typing = null, hideT = null, autoT = null, ignoreUntil = 0;

  const shuffle = a => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const buttons = () => Array.from(opts.children || []);
  const choosing = () => phase === 'intro' || phase === 'ask' || phase === 'end';
  const rounds = () => Math.min(PREF_ROUNDS, PREFS.length), need = () => Math.min(PREF_WIN, rounds());

  function say(text) {                                          // máquina de escrever (o espaço do texto todo fica reservado)
    clearInterval(typing); full.textContent = text; live.textContent = ''; let n = 0;
    typing = setInterval(() => { live.textContent = text.slice(0, ++n); if (n >= text.length) { clearInterval(typing); typing = null; } }, 26);
  }
  function paint() { buttons().forEach((b, k) => b.classList.toggle('sel', k === sel && choosing())); }
  function setOptions(l) {                                      // l = [{ label, fn }]
    list = l; sel = 0; opts.innerHTML = '';
    l.forEach((o, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'qopt'; b.textContent = o.label;
      b.addEventListener('click', () => { sel = k; paint(); o.fn(); });
      b.addEventListener('mouseenter', () => { if (choosing()) { sel = k; paint(); } });
      opts.appendChild(b);
    });
    paint();
  }

  function intro() {                                            // primeiro explica-se o jogo; só depois começa
    phase = 'intro'; box.classList.add('intro'); prog.textContent = 'Como funciona';
    if (!PREFS.length) { say('Ainda não há perguntas.'); fb.textContent = ''; setOptions([{ label: 'Sair', fn: close }]); return; }
    say('Vais ver ' + rounds() + ' perguntas sobre o teu namorado.\n\nEm cada uma, escolhe o que ele prefere.\n\nPara ganhares, tens de acertar ' + need() + ' de ' + rounds() + '.');
    fb.textContent = 'Responde com o rato, com as setas + Enter, ou com as teclas dos números.';
    setOptions([{ label: 'Começar', fn: begin }]);
  }
  function begin() { order = shuffle(PREFS).slice(0, rounds()); i = 0; score = 0; box.classList.remove('intro'); ask(); }
  function ask() {
    phase = 'ask'; const q = order[i]; fb.textContent = '';
    cur = shuffle(q.o.map((label, k) => ({ label, ok: k === q.a })));          // as opções mudam de ordem em cada pergunta
    right = cur.findIndex(o => o.ok);
    prog.textContent = (i + 1) + ' / ' + order.length;
    say(q.q);
    setOptions(cur.map((o, k) => ({ label: o.label, fn: () => answer(k) })));
  }
  function answer(k) {
    if (phase !== 'ask') return;
    phase = 'result'; clearInterval(typing); typing = null; live.textContent = full.textContent;
    const ok = k === right; if (ok) score++;
    buttons().forEach((b, j) => {
      b.classList.remove('sel'); b.classList.toggle('ok', j === right); b.classList.toggle('bad', j === k && !ok);
      b.classList.toggle('dim', j !== right && j !== k); b.disabled = true;
    });
    fb.textContent = ok ? 'Certo!' : 'Errado. Ele prefere: ' + cur[right].label + '.';
    autoT = setTimeout(next, ok ? PREF_OK_MS : PREF_BAD_MS);    // passa sozinho (Enter/E/Espaço salta a espera)
  }
  function next() {
    if (phase !== 'result') return; clearTimeout(autoT);
    if (++i < order.length) ask(); else end();
  }
  function end() {
    phase = 'end'; const n = order.length, win = score >= need();
    prog.textContent = 'Resultado';
    say((win ? PREF_TEXT.win : PREF_TEXT.lose) + '\nAcertaste ' + score + ' de ' + n + '.');
    fb.textContent = win ? 'Ao longe, ouve-se o som de correntes a cair.' : 'Precisas de acertar ' + need() + ' de ' + n + '.';
    if (win) window.prefWon = true;                              // ganhar solta a terceira corrente do portão (game.js)
    setOptions([{ label: win ? 'Jogar outra vez' : 'Tentar outra vez', fn: begin }, { label: 'Sair', fn: close }]);
  }

  function open() {                                             // ecrã todo preto por cima do jogo
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
    else if (choosing() && n && ['ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW'].includes(k)) { sel = (sel + n - 1) % n; paint(); }
    else if (choosing() && n && ['ArrowRight', 'KeyD', 'ArrowDown', 'KeyS'].includes(k)) { sel = (sel + 1) % n; paint(); }
    else if (phase === 'ask' && /^Digit[1-9]$/.test(k) && +k.slice(5) <= n) list[+k.slice(5) - 1].fn();
    else if (['Enter', 'Space', 'KeyE'].includes(k)) { if (!e.repeat) { if (phase === 'result') next(); else if (list[sel]) list[sel].fn(); } }
    else return;
    e.preventDefault();
  });
  box.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('button')) e.preventDefault(); });   // os botões não ficam com o foco
  $('pfexit').addEventListener('click', close);
  window.startPrefQuiz = open;
})();