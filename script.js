const target = new Date('2026-10-04T00:00:00+01:00').getTime();

const els = {
  d: document.getElementById('d'),
  h: document.getElementById('h'),
  m: document.getElementById('m'),
  s: document.getElementById('s')
};

const pad = n => String(n).padStart(2, '0');

function tick() {
  const diff = Math.max(0, target - Date.now());

  if (diff === 0) {
    document.getElementById('app').classList.add('finished');
    return;
  }

  const secs = Math.floor(diff / 1000);
  els.d.textContent = pad(Math.floor(secs / 86400));
  els.h.textContent = pad(Math.floor(secs % 86400 / 3600));
  els.m.textContent = pad(Math.floor(secs % 3600 / 60));
  els.s.textContent = pad(secs % 60);

  setTimeout(tick, 1000 - (Date.now() % 1000));
}

tick();