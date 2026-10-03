/* ---------- Jogo "Quem disse esta frase?" (abre ao interagir com o tronco partido) ---------- */
const PEOPLE = ['Martim', 'Lígia'];

const QUOTES = [
  { q: 'Eu não durmo, sou vampiro(a)', a: 'Lígia' },
  { q: 'Passei na casa de alguém ...', a: 'Martim' },
  { q: 'Ele(a) não me ama.', a: 'Martim' },
  { q: 'Quando chegares da faculdade vou te encher de beijinhos.', a: 'Lígia' },
  { q: 'Não tenho fome. Só quero provar o teu.', a: 'Lígia' },
  { q: 'Fica com o troco.', a: 'Martim' },
  { q: 'Dez minutos e estou pronta(o).', a: 'Lígia' },
  { q: 'Tu tens um fetiche, só pode', a: 'Lígia' },
  { q: 'Se não namorasses comigo eu pedia-te em namoro', a: 'Martim' },
  { q: 'Esta é a pessoa que estás a dizer que não.', a: 'Lígia' }
];

const ARTICLE = { 'Martim': 'o', 'Lígia': 'a' };                                   // para dizer "Foi o Martim" / "Foi a Lígia"
const QUIZ_WIN = 6;                                                                 // acertos necessários para ganhar (em 10)
const QUIZ_AUTO_MS = 1800;                                                          // tempo até passar sozinho à pergunta seguinte
const QUIZ_TEXT = { win: 'Ganhaste!', lose: 'Não foi desta.' };                     // texto do resultado

(function () {
  const $ = id => document.getElementById(id);
  const quiz = $('quiz'), qprog = $('qprog'), qfull = $('qfull'), qlive = $('qlive'), qopts = $('qopts'), qfb = $('qfb');
  let order = [], i = 0, score = 0, sel = 0, phase = 'closed', opts = [], typing = null, hideT = null, autoT = null, ignoreUntil = 0, onClose = null;

  const shuffle = a => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const buttons = () => Array.from(qopts.children || []);
  const choosing = () => phase === 'intro' || phase === 'ask' || phase === 'end';

  function say(text) {                                          // escreve o texto letra a letra (o espaço do texto todo fica reservado)
    clearInterval(typing); qfull.textContent = text; qlive.textContent = ''; let n = 0;
    typing = setInterval(() => { qlive.textContent = text.slice(0, ++n); if (n >= text.length) { clearInterval(typing); typing = null; } }, 26);
  }
  function paint() { buttons().forEach((b, k) => b.classList.toggle('sel', k === sel && choosing())); }
  function setOptions(list) {                                   // list = [{ label, fn }]
    opts = list; sel = 0; qopts.innerHTML = '';
    list.forEach((o, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'qopt'; b.textContent = o.label;
      b.addEventListener('click', () => { sel = k; paint(); o.fn(); });
      b.addEventListener('mouseenter', () => { if (choosing()) { sel = k; paint(); } });
      qopts.appendChild(b);
    });
    paint();
  }

  function intro() {                                            // primeiro explica-se o jogo; só depois começa
    phase = 'intro'; quiz.classList.add('intro'); const n = QUOTES.length;
    qprog.textContent = 'Como funciona';
    say('Vais ver ' + n + ' frases, uma de cada vez.\n\nEm cada uma, escolhe quem a disse: ' + PEOPLE.join(' ou ') + '.\n\nPara ganhares, tens de acertar ' + QUIZ_WIN + ' de ' + n + '.');
    qfb.textContent = 'Responde com o rato, com as setas + Enter, ou com as teclas ' + PEOPLE.map((_, k) => k + 1).join(' e ') + '.';
    setOptions([{ label: 'Começar', fn: begin }]);
  }
  function begin() { order = shuffle(QUOTES); i = 0; score = 0; quiz.classList.remove('intro'); ask(); }
  function ask() {
    phase = 'ask'; qprog.textContent = (i + 1) + ' / ' + order.length; qfb.textContent = '';
    say('"' + order[i].q + '"');
    setOptions(PEOPLE.map((p, k) => ({ label: p, fn: () => answer(k) })));
  }
  function answer(k) {
    if (phase !== 'ask') return;
    phase = 'result'; clearInterval(typing); typing = null; qlive.textContent = qfull.textContent;
    const it = order[i], right = PEOPLE[k] === it.a; if (right) score++;
    buttons().forEach((b, j) => {
      b.classList.remove('sel'); b.classList.toggle('ok', PEOPLE[j] === it.a); b.classList.toggle('bad', j === k && !right);
      b.classList.toggle('dim', PEOPLE[j] !== it.a && j !== k); b.disabled = true;
    });
    qfb.textContent = right ? 'Certo!' : 'Errado. Foi ' + (ARTICLE[it.a] ? ARTICLE[it.a] + ' ' : '') + it.a + '.';
    autoT = setTimeout(next, QUIZ_AUTO_MS);                     // passa sozinho à seguinte (Enter/E/Espaço salta a espera)
  }
  function next() {
    if (phase !== 'result') return; clearTimeout(autoT);
    if (++i < order.length) ask(); else end();
  }
  function end() {
    phase = 'end'; const n = order.length, win = score >= QUIZ_WIN;
    qprog.textContent = 'Resultado';
    say((win ? QUIZ_TEXT.win : QUIZ_TEXT.lose) + '\nAcertaste ' + score + ' de ' + n + '.');
    qfb.textContent = win ? 'Ao longe, ouve-se o som de correntes a cair.' : 'Precisas de acertar ' + QUIZ_WIN + ' de ' + n + '.';
    if (win) { window.quizWon = true; if (window.onQuizWin) window.onQuizWin(score); }   // ganhar desbloqueia o portão (game.js)
    setOptions([{ label: win ? 'Jogar outra vez' : 'Tentar outra vez', fn: begin }, { label: 'Sair', fn: close }]);
  }

  function open(cb) {                                           // ecrã todo preto por cima do jogo
    clearTimeout(hideT); onClose = cb || null; window.quizActive = true; ignoreUntil = performance.now() + 300;   // ignora o E que abriu o jogo
    quiz.style.display = 'flex'; requestAnimationFrame(() => quiz.classList.add('on')); intro();
  }
  function close() {
    phase = 'closed'; clearInterval(typing); typing = null; clearTimeout(autoT); window.quizActive = false;
    quiz.classList.remove('on'); hideT = setTimeout(() => { quiz.style.display = 'none'; }, 500);
    if (onClose) { const cb = onClose; onClose = null; cb(); }
  }

  addEventListener('keydown', e => {
    if (phase === 'closed' || performance.now() < ignoreUntil) return;
    const k = e.code, n = opts.length;
    if (k === 'Escape') close();
    else if (choosing() && ['ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW'].includes(k)) { sel = (sel + n - 1) % n; paint(); }
    else if (choosing() && ['ArrowRight', 'KeyD', 'ArrowDown', 'KeyS'].includes(k)) { sel = (sel + 1) % n; paint(); }
    else if (phase === 'ask' && /^Digit[1-9]$/.test(k) && +k.slice(5) <= n) opts[+k.slice(5) - 1].fn();
    else if (['Enter', 'Space', 'KeyE'].includes(k)) { if (!e.repeat) { if (phase === 'result') next(); else if (opts[sel]) opts[sel].fn(); } }
    else return;
    e.preventDefault();
  });
  quiz.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('button')) e.preventDefault(); });   // os botões não ficam com o foco
  $('qexit').addEventListener('click', close);
  window.startQuiz = open;
})();