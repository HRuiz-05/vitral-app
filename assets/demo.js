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
    if (nowDone) { confetti(card._node || card); sound('done'); } else { sound('paper'); }
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

  /* criar card */
  var MAX_CARDS = 14;
  var form = document.getElementById('demoForm'), input = document.getElementById('demoTitle');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var title = input.value.trim();
    if (!title) { input.focus(); return; }
    if (board.querySelectorAll('.cd').length >= MAX_CARDS) { hint('O quadro de demonstração está cheio. Mova ou recarregue a página.'); return; }
    var card = document.createElement('div'), t = document.createElement('div');
    card.className = 'cd born'; card.tabIndex = 0;
    t.className = 'ct'; t.textContent = title;
    card.appendChild(t);
    cols[0].appendChild(card);
    input.value = '';
    sound('paper');
    if (mode === 'map') renderMap();
    hint(HINTS[mode]);
  });

  /* trocar entre quadro e mapa */
  var HINTS = { board: 'Experimente: arraste um card até Feito.', map: 'Arraste os itens. Solte um card sobre uma coluna para movê-lo.' };
  var mode = 'board', map = document.getElementById('demoMap'), edges = document.getElementById('demoEdges'), nodesBox = document.getElementById('demoNodes');
  var seg = document.getElementById('demoSeg'), root = { label: 'Meu quadro' };
  function hint(t) { document.getElementById('demoHint').textContent = t; }
  seg.addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]');
    if (!b || b.getAttribute('data-v') === mode) return;
    mode = b.getAttribute('data-v');
    Array.prototype.forEach.call(seg.children, function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    board.hidden = mode !== 'board'; map.hidden = mode !== 'map';
    hint(HINTS[mode]);
    if (mode === 'map') renderMap(); else clearMap();
  });
  function clearMap() { board.querySelectorAll('.cd').forEach(function (c) { c._node = null; }); nodesBox.textContent = ''; }

  var items = [];
  function makeNode(cls, text, hue, x, y, ref) {
    var n = document.createElement('div');
    n.className = 'mn ' + cls; n.textContent = text; n.tabIndex = 0;
    if (hue) n.style.setProperty('--a', hue);
    nodesBox.appendChild(n);
    var it = { el: n, x: x, y: y, ref: ref, parent: null };
    n._it = it; items.push(it); return it;
  }
  function renderMap() {
    clearMap(); items = [];
    var cards = 0; cols.forEach(function (c) { cards += Math.max(1, c.querySelectorAll('.cd').length); });
    var w = map.clientWidth, h = Math.max(260, cards * 44 + 24); map.style.height = h + 'px';
    var nodeW = Math.min(122, (w - 30) / 3), gap = (w - nodeW * 3 - 16) / 2, y = 12;
    var rootIt = makeNode('r', root.label, null, root.x != null ? root.x : 8, root.y != null ? root.y : h / 2 - 18, root); rootIt.w = nodeW;
    cols.forEach(function (col) {
      var cs = Array.prototype.slice.call(col.querySelectorAll('.cd')), blockH = Math.max(1, cs.length) * 44;
      var name = col.querySelector('span').textContent, hue = col.style.getPropertyValue('--a');
      var ci = makeNode('c', name, hue, col._mx != null ? col._mx : 8 + nodeW + gap, col._my != null ? col._my : y + blockH / 2 - 18, col);
      ci.parent = rootIt; ci.col = col;
      cs.forEach(function (card, i) {
        var ti = card.querySelector('.ct').textContent;
        var it = makeNode('k' + (card.classList.contains('done') ? ' done' : ''), ti, hue, card._mx != null ? card._mx : 8 + (nodeW + gap) * 2, card._my != null ? card._my : y + i * 44, card);
        it.parent = ci; it.card = card; card._node = it.el;
      });
      y += blockH;
    });
    items.forEach(function (it) { it.el.style.width = nodeW + 'px'; position(it); });
    drawEdges();
  }
  function position(it) { it.el.style.left = it.x + 'px'; it.el.style.top = it.y + 'px'; }
  function drawEdges() {
    var d = {};
    edges.textContent = '';
    items.forEach(function (it) {
      if (!it.parent) return;
      var a = it.parent, ax = a.x + a.el.offsetWidth, ay = a.y + a.el.offsetHeight / 2, bx = it.x, by = it.y + it.el.offsetHeight / 2, mx = (ax + bx) / 2;
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M' + ax + ' ' + ay + ' C' + mx + ' ' + ay + ' ' + mx + ' ' + by + ' ' + bx + ' ' + by);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', it.el.style.getPropertyValue('--a') || 'rgba(255,255,255,.3)');
      p.setAttribute('stroke-opacity', '.55'); p.setAttribute('stroke-width', '1.5');
      edges.appendChild(p);
    });
  }
  function save(it) {
    var r = it.ref; if (r === root) { root.x = it.x; root.y = it.y; } else { r._mx = it.x; r._my = it.y; }
  }
  function columnUnder(it) {
    var r = it.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, hit = null;
    items.forEach(function (o) {
      if (!o.col) return;
      var b = o.el.getBoundingClientRect();
      if (cx >= b.left - 8 && cx <= b.right + 8 && cy >= b.top - 8 && cy <= b.bottom + 8) hit = o.col;
    });
    return hit;
  }
  var md = null;
  map.addEventListener('pointerdown', function (e) {
    var n = e.target.closest('.mn'); if (!n || e.button > 0) return;
    e.preventDefault(); n.setPointerCapture(e.pointerId); n.focus({ preventScroll: true }); n.classList.add('dragging');
    md = { it: n._it, id: e.pointerId, dx: e.clientX - n._it.x, dy: e.clientY - n._it.y };
  });
  map.addEventListener('pointermove', function (e) {
    if (!md || e.pointerId !== md.id) return;
    var it = md.it;
    it.x = Math.max(0, Math.min(map.clientWidth - it.el.offsetWidth, e.clientX - md.dx));
    it.y = Math.max(0, Math.min(map.clientHeight - it.el.offsetHeight, e.clientY - md.dy));
    position(it); drawEdges();
  });
  function mapEnd(e) {
    if (!md || e.pointerId !== md.id) return;
    var it = md.it; md = null; it.el.classList.remove('dragging');
    save(it);
    if (it.card) {
      var to = columnUnder(it), from = it.card.parentNode;
      if (to && to !== from) {
        to.appendChild(it.card); it.card._mx = it.card._my = null;
        moveInMap(it.card, from, to);
      }
    }
  }
  function moveInMap(card, from, to) {
    renderMap();
    placed(card, from, to);
    var n = card._node;
    if (n) { n.classList.toggle('done', card.classList.contains('done')); n.classList.add('landed'); n.focus({ preventScroll: true }); }
  }
  map.addEventListener('pointerup', mapEnd);
  map.addEventListener('pointercancel', mapEnd);
  map.addEventListener('keydown', function (e) {
    var n = e.target.closest('.mn'); if (!n || !n._it.card || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    var card = n._it.card, from = card.parentNode, to = cols[cols.indexOf(from) + (e.key === 'ArrowRight' ? 1 : -1)];
    if (!to) return;
    to.appendChild(card); card._mx = card._my = null;
    moveInMap(card, from, to);
  });
  window.addEventListener('resize', function () { if (mode === 'map') renderMap(); });
})();
