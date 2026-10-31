/* Quadro de demonstração: arrastar com mouse ou toque, setas no teclado, confete ao concluir. */
(function () {
  var board = document.getElementById('demo');
  if (!board) return;
  var cols = Array.prototype.slice.call(board.querySelectorAll('.col'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var drag = null, audio = null;

  function sound(kind) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      if (kind === 'done') {
        [660, 880, 1175].forEach(function (f, i) { tone(f, t + i * 0.075, 0.2, 0.1); });
      } else {
        var n = Math.floor(audio.sampleRate * 0.2), b = audio.createBuffer(1, n, audio.sampleRate), d = b.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.sin(i / n * 38));
        var s = audio.createBufferSource(), fl = audio.createBiquadFilter(), g = audio.createGain();
        s.buffer = b; fl.type = 'bandpass'; fl.Q.value = 0.8;
        fl.frequency.setValueAtTime(1300, t); fl.frequency.exponentialRampToValueAtTime(3400, t + 0.2);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        s.connect(fl); fl.connect(g); g.connect(audio.destination); s.start(t);
      }
    } catch (e) { /* sem som, o quadro segue funcionando */ }
  }
  function tone(f, at, dur, gain) {
    var o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(audio.destination); o.start(at); o.stop(at + dur + 0.02);
  }

  function confetti(card) {
    if (reduced) return;
    var hues = ['#ff6b8b', '#8b7cff', '#ffb547', '#00c2a8'];
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('i');
      p.className = 'conf';
      p.style.setProperty('--s', hues[i % 4]);
      p.style.setProperty('--x', Math.round(Math.random() * 130 - 50) + 'px');
      p.style.setProperty('--y', Math.round(-14 - Math.random() * 26) + 'px');
      p.style.setProperty('--f', Math.round(14 + Math.random() * 34) + 'px');
      p.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg');
      p.style.animationDelay = (Math.random() * 0.07).toFixed(2) + 's';
      card.appendChild(p);
      remove(p);
    }
  }
  function remove(p) { setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 800); }

  function isDone(col) { return col.getAttribute('data-col') === 'done'; }

  function placed(card, from, to) {
    if (from === to) return;
    var nowDone = isDone(to);
    card.classList.toggle('done', nowDone);
    card.classList.remove('landed', 'dropped');
    void card.offsetWidth;
    card.classList.add(nowDone ? 'landed' : 'dropped');
    if (nowDone) { confetti(card); sound('done'); } else { sound('paper'); }
    var s = document.getElementById('demoStatus');
    if (s) s.textContent = '"' + card.querySelector('.ct').textContent + '" movido para ' + to.querySelector('span').textContent + '.';
  }

  function colAt(x, y) {
    for (var i = 0; i < cols.length; i++) {
      var r = cols[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top - 20 && y <= r.bottom + 20) return cols[i];
    }
    return null;
  }

  board.addEventListener('pointerdown', function (e) {
    var card = e.target.closest('.cd');
    if (!card || e.button > 0) return;
    e.preventDefault();
    card.setPointerCapture(e.pointerId);
    drag = { card: card, id: e.pointerId, x: e.clientX, y: e.clientY, from: card.parentNode };
    card.classList.add('dragging');
    card.focus({ preventScroll: true });
  });
  board.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.card.style.transform = 'translate(' + (e.clientX - drag.x) + 'px,' + (e.clientY - drag.y) + 'px) rotate(1.5deg)';
    var over = colAt(e.clientX, e.clientY);
    cols.forEach(function (c) { c.classList.toggle('over', c === over); });
  });
  function finish(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var card = drag.card, from = drag.from, to = e.type === 'pointerup' ? (colAt(e.clientX, e.clientY) || from) : from;
    card.classList.remove('dragging');
    card.style.transform = '';
    cols.forEach(function (c) { c.classList.remove('over'); });
    if (to !== from) to.appendChild(card);
    drag = null;
    placed(card, from, to);
  }
  board.addEventListener('pointerup', finish);
  board.addEventListener('pointercancel', finish);

  board.addEventListener('keydown', function (e) {
    var card = e.target.closest('.cd');
    if (!card || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    var from = card.parentNode, to = cols[cols.indexOf(from) + (e.key === 'ArrowRight' ? 1 : -1)];
    if (!to) return;
    to.appendChild(card);
    card.focus();
    placed(card, from, to);
  });
})();
