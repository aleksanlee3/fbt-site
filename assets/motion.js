/* FBT Online · движение блоков при прокрутке · v5.62 · 02.11.2026
   v5.62 (правки Александра 02.11): «Кому подходит» и «Узнаёте себя?» — сцена: прилипает целиком, сначала крупный
   заголовок по центру, потом карточки сменяют друг друга (data-mo-scene="down" — сверху, "mix" — с разных сторон);
   отзывы больше не прилипают (зависание на телефоне) — обычная колонка, карточки залетают слева и справа.
   Образец — yaas-energy.com. Решения Александра 02.11:
   — весь сайт динамичный, у разных блоков разные направления движения;
   — человек только листает вниз: ничего не надо свайпать вбок, всё происходит само от прокрутки.
   Что делает скрипт:
   1. Ленты, которые листаются вбок («Узнаёте себя?», отзывы, наставники…): секция прилипает к экрану,
      и прокрутка вниз сама двигает ленту влево; карточки залетают по очереди.
   2. Крупные карточки в одну колонку (Производство / Торговля / Сфера услуг на телефоне): прилипают стопкой,
      каждая следующая залетает с другой стороны и ложится сверху — как фото в образце.
   3. Остальные группы карточек и блоки: движение привязано к прокрутке (идёт вместе с пальцем и откатывается
      при прокрутке вверх), соседние группы — разными способами: веер, слева-справа, переворот, падение с наклоном,
      зум, подъём.
   4. Заголовки h1/h2 появляются по словам, фото в рамках плавно приближаются.
   Не трогаем: страницы диагностики (body.pg-diag), секцию «3 шага» (#shagi, свой скрипт steps-arc.js), шапку,
   плеер, формы. При «уменьшить движение» анимаций нет. Стили — assets/motion.css. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;
  if (reduce || !body || body.classList.contains('pg-diag') || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('mo');

  var EFFECTS = ['fan', 'flyalt', 'flip', 'tilt', 'zoom', 'rise'];
  var SKIP = '#shagi, .player, header, .hdr, .route, form, [data-mo-skip], .igra-cue';
  var gi = 0, sec = 0;
  var marked = new Set();
  var items = [];    // { el, horiz, shift, stack }
  var pins = [];     // ленты вбок, которые двигает прокрутка
  var scenes = [];   // сцены: заголовок + карточки сменяют друг друга
  var par = [];      // фото с приближением

  function visible(el) { return el.offsetParent !== null && el.offsetWidth > 0; }
  function skipped(el) { return !!el.closest(SKIP); }
  function inMarked(el) { for (var p = el.parentElement; p && p !== body; p = p.parentElement) if (marked.has(p)) return true; return false; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function add(el, fx, opt) {
    opt = opt || {};
    el.setAttribute('data-mo', fx);
    marked.add(el);
    items.push({ el: el, horiz: !!opt.horiz, shift: opt.shift || 0, stack: opt.stack || null, last: -1 });
  }

  // ── Заголовки по словам (по времени, когда заголовок попал в кадр) ──
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('mo-in'); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  function splitWords(h, variant) {
    if (h.dataset.moWords) return;
    h.dataset.moWords = variant;
    var n = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          if (!c.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          c.textContent.split(/( +)/).forEach(function (t) {
            if (!t) return;
            if (/^ +$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement('span'); s.className = 'mo-w'; s.style.setProperty('--w', String(n++)); s.textContent = t;
            frag.appendChild(s);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !/^(BR|SVG|IMG)$/.test(c.tagName)) walk(c);
      });
    })(h);
    marked.add(h);
    io.observe(h);
  }

  // ── Группы одинаковых карточек ──
  function findGroups(section) {
    var out = [];
    section.querySelectorAll('*').forEach(function (p) {
      if (skipped(p) || inMarked(p) || marked.has(p)) return;
      var kids = [].slice.call(p.children).filter(function (c) { return visible(c) && c.offsetHeight > 50 && c.offsetWidth > 110 && !/^(BUTTON|SCRIPT|BR)$/.test(c.tagName); });
      if (kids.length < 2) return;
      var key = function (k) { return k.tagName + '.' + String(k.className || '').split(' ')[0]; };
      var same = kids.filter(function (k) { return key(k) === key(kids[0]); });
      if (same.length < 2 || same.length < kids.length * 0.6) return;
      for (var i = 0; i < out.length; i++) if (out[i].box.contains(p)) return;
      out.push({ box: p, kids: same });
    });
    return out;
  }

  function setupGroup(g, section) {
    var cs = getComputedStyle(g.box);
    var scrollX = (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && g.box.scrollWidth - g.box.clientWidth > 40;
    var lefts = g.kids.map(function (k) { return k.getBoundingClientRect().left; });
    var oneCol = lefts.every(function (l) { return Math.abs(l - lefts[0]) < 20; });
    if (g.box.hasAttribute('data-mo-scene') && (scrollX || oneCol)) { setupScene(g, section); return; }
    if (scrollX) { setupPin(g, section); return; }
    var vh = window.innerHeight;
    var tall = g.kids.every(function (k) { return k.offsetHeight > 260 && k.offsetHeight < vh * 0.82; });

    // Стопка: крупные карточки в одну колонку (телефон)
    if (oneCol && tall && g.kids.length >= 3 && g.kids.length <= 6) {
      g.box.setAttribute('data-mo-group', 'stack');
      g.kids.forEach(function (k, i) {
        var top = 70 + i * 14;
        k.style.setProperty('--st', top + 'px');
        k.style.setProperty('--sx', ((i % 2 ? 1 : -1) * 75) + 'vw');
        k.style.setProperty('--sr', ((i % 2 ? 1 : -1) * 11) + 'deg');
        add(k, 'stack', { stack: top });
      });
      return;
    }

    var fx = g.box.getAttribute('data-mo-fx') || EFFECTS[gi++ % EFFECTS.length];
    g.box.setAttribute('data-mo-group', fx);
    // номер карточки в своём ряду — чтобы в ряду они залетали по очереди
    var tops = g.kids.map(function (k) { return Math.round(k.getBoundingClientRect().top); });
    var b = g.box.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + Math.min(b.height, 420) / 2;
    g.kids.forEach(function (k, i) {
      var rank = 0; for (var j = 0; j < i; j++) if (Math.abs(tops[j] - tops[i]) < 12) rank++;
      k.classList.add(i % 2 ? 'mo-even' : 'mo-odd');
      if (fx === 'fan') {
        var r = k.getBoundingClientRect();
        var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
        if (oneCol) { dx = (i % 2 ? 1 : -1) * Math.min(170, r.width * 0.5); dy = 40; }
        k.style.setProperty('--fx', Math.round(dx * 0.85) + 'px');
        k.style.setProperty('--fy', Math.round(Math.max(-260, Math.min(260, dy * 0.85)) + 40) + 'px');
        k.style.setProperty('--fr', ((i % 2 ? 1 : -1) * (7 + (i % 3) * 3)) + 'deg');
      }
      add(k, fx, { shift: Math.min(rank, 4) * 0.14 });
    });
  }

  // ── Лента вбок: секция прилипает, прокрутка вниз двигает ленту ──
  function setupPin(g, section) {
    var box = g.box;
    g.box.setAttribute('data-mo-group', 'hpin');
    box.style.scrollSnapType = 'none';
    var wrap = document.createElement('div');
    wrap.className = 'mo-hpin';
    section.parentNode.insertBefore(wrap, section);
    wrap.appendChild(section);
    section.classList.add('mo-hpin-sec');
    var pin = { wrap: wrap, sec: section, box: box, travel: 0, top: 0, H: 0 };
    pins.push(pin);
    measurePin(pin);
    g.kids.forEach(function (k, i) { k.classList.add(i % 2 ? 'mo-even' : 'mo-odd'); add(k, i % 2 ? 'hfly2' : 'hfly', { horiz: true }); });
  }
  function measurePin(pin) {
    var vh = window.innerHeight;
    pin.wrap.style.height = '';
    pin.sec.style.top = '';
    pin.H = pin.sec.offsetHeight;
    pin.travel = Math.max(0, pin.box.scrollWidth - pin.box.clientWidth);
    var sr = pin.sec.getBoundingClientRect();
    var off = pin.box.getBoundingClientRect().top - sr.top;
    var h2 = pin.sec.querySelector('h2, .h2');
    var hOff = h2 ? h2.getBoundingClientRect().top - sr.top : off;
    var bar = document.querySelector('.route, .hdr');
    var barH = bar ? Math.min(160, bar.getBoundingClientRect().bottom) : 0;
    // прилипаем так, чтобы заголовок секции был виден под верхней плашкой, а лента — целиком на экране
    var t = barH + 12 - hOff;
    if (t + off + pin.box.offsetHeight > vh) t = vh - 16 - off - pin.box.offsetHeight;   // не влезает — прижимаем ленту к низу
    pin.top = Math.min(barH + 12, Math.max(vh - pin.H, t));
    pin.run = pin.travel * 1.15;
    pin.wrap.style.height = (pin.H + pin.run) + 'px';
    pin.sec.style.top = pin.top + 'px';
  }


  // ── Сцена: заголовок крупно по центру → карточки по одной сменяют друг друга ──
  // Откуда прилетает каждая карточка: [сдвиг X, сдвиг Y, поворот, масштаб]
  var DIRS = {
    down: [['0px', '-95vh', '-7deg', '1'], ['0px', '-95vh', '7deg', '1']],
    mix: [['-110vw', '0px', '-14deg', '1'], ['0px', '-95vh', '9deg', '1'], ['110vw', '0px', '14deg', '1'], ['0px', '0px', '0deg', '.35'],
          ['0px', '95vh', '-8deg', '1'], ['-95vw', '-75vh', '-22deg', '1'], ['0px', '0px', '0deg', '1.7'], ['95vw', '75vh', '20deg', '1']]
  };
  function setupScene(g, section) {
    var box = g.box, mode = box.getAttribute('data-mo-scene') || 'mix', dirs = DIRS[mode] || DIRS.mix;
    var parent = box.parentNode;
    var head = section.querySelector('h2, .h2');
    if (!head || head.parentNode !== parent) head = box;
    var outer = document.createElement('div'); outer.className = 'mo-scene';
    var pin = document.createElement('div'); pin.className = 'mo-scene-pin';
    parent.insertBefore(outer, head);
    outer.appendChild(pin);
    // в сцену переносим всё от заголовка до карточек включительно (заголовок, подзаголовок, карточки)
    var n = outer.nextSibling;
    while (n) { var nx = n.nextSibling; pin.appendChild(n); if (n === box) break; n = nx; }
    if (head !== box) head.classList.add('mo-scene-h');
    box.setAttribute('data-mo-group', 'scene');
    box.classList.add('mo-scene-deck');
    marked.add(box);
    var cards = g.kids;
    cards.forEach(function (k, i) {
      var d = dirs[i % dirs.length];
      k.setAttribute('data-mo-card', '');
      k.style.setProperty('--dx', d[0]); k.style.setProperty('--dy', d[1]);
      k.style.setProperty('--dr', d[2]); k.style.setProperty('--ds', d[3]);
      k.style.zIndex = String(i + 1);
      marked.add(k);
    });
    var sc = { outer: outer, pin: pin, deck: box, head: head !== box ? head : null, cards: cards, top: 0, run: 1, mode: mode };
    if (mode === 'carousel') { outer.classList.add('mo-scene--carousel'); cards.forEach(function (k) { k.style.zIndex = ''; }); }
    scenes.push(sc);
    measureScene(sc);
  }
  function measureScene(sc) {
    var vh = window.innerHeight;
    sc.outer.style.height = '';
    var H = sc.pin.offsetHeight;
    var bar = document.querySelector('.route, .hdr');
    var barH = bar ? Math.max(0, Math.min(160, bar.getBoundingClientRect().bottom)) : 0;
    // вся сцена (заголовок + карточка) — по центру экрана под верхней плашкой
    var top = barH + Math.max(8, (vh - barH - H) / 2);
    if (top + H > vh) top = Math.max(vh - H - 8, Math.min(barH + 8, vh - H));
    sc.top = top;
    // v5.64: «Кому подходит» (down) — медленнее, карточка едет дольше; карусель — свой шаг на карточку
    var per = sc.mode === 'down' ? 1.15 : sc.mode === 'carousel' ? 0.6 : 0.62;
    sc.run = vh * (0.35 + sc.cards.length * per);
    sc.outer.style.height = (H + sc.run) + 'px';
    sc.pin.style.top = top + 'px';
    // пока карточек нет — заголовок опущен на середину места под карточки и крупнее
    sc.pin.style.setProperty('--hd', Math.round(sc.deck.offsetHeight / 2) + 'px');
  }
  // v5.64 · Карусель («Узнаёте себя?»): карточки стоят на кольце, как кинолента; прокрутка вниз поворачивает кольцо —
  // центральная карточка крупно, соседние уходят вглубь и в стороны, дальние гаснут. Образец — реклама газировки (исходник Александра).
  function frameCarousel(sc) {
    var n = sc.cards.length;
    var t = clamp((sc.top - sc.outer.getBoundingClientRect().top) / sc.run);
    var f = t * (n - 1 + 0.75);
    var e0 = ease(clamp(f / 0.75));
    var pos = Math.max(0, Math.min(n - 1, f - 0.75));
    sc.pin.style.setProperty('--h', (1 - e0).toFixed(3));
    var w = sc.deck.offsetWidth;
    sc.cards.forEach(function (k, i) {
      var d = i - pos, a = Math.abs(d), s = d < 0 ? -1 : 1;
      var x = s * Math.min(a, 2.6) * w * 0.56;
      var z = -Math.min(a, 2.6) * 0.75 * w - (1 - e0) * 1.4 * w;
      var ry = -s * Math.min(a, 1.5) * 40;
      k.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
      k.style.opacity = (e0 * clamp(1 - (a - 1.4) / 1.1)).toFixed(3);
      k.style.filter = 'brightness(' + (1 - 0.55 * clamp(a)).toFixed(3) + ')';
      k.style.zIndex = String(100 - Math.round(a * 10));
    });
  }
  function frameScene(sc) {
    if (sc.mode === 'carousel') return frameCarousel(sc);
    var n = sc.cards.length;
    var t = clamp((sc.top - sc.outer.getBoundingClientRect().top) / sc.run);
    var f = t * (n + 0.55);
    var e = sc.cards.map(function (k, i) { return clamp((f - i - 0.3) / 0.7); });
    sc.pin.style.setProperty('--h', (1 - ease(e[0])).toFixed(3));
    sc.cards.forEach(function (k, i) {
      k.style.setProperty('--e', ease(e[i]).toFixed(3));
      k.style.setProperty('--l', (i + 1 < n ? ease(e[i + 1]) : 0).toFixed(3));
    });
  }

  // ── Фото в рамке: приближение ──
  function setupParallax(section) {
    section.querySelectorAll('img').forEach(function (img) {
      if (skipped(img) || img.closest('[data-mo-group="hpin"], [data-mo-group="stack"], [data-mo-group="scene"]')) return;
      var box = img.parentElement;
      if (!box || img.offsetWidth < 240 || getComputedStyle(box).overflow === 'visible') return;
      img.classList.add('mo-par'); par.push(img);
    });
  }

  // ── Кадр: всё считается от положения прокрутки ──
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight, vw = window.innerWidth;

    scenes.forEach(frameScene);
    pins.forEach(function (pin) {
      var t = clamp((pin.top - pin.wrap.getBoundingClientRect().top) / (pin.run || 1));
      pin.box.scrollLeft = Math.round(t * pin.travel);
    });

    items.forEach(function (it) {
      var r = it.el.getBoundingClientRect(), p;
      if (it.stack != null) {
        // карточка стопки: от низа экрана до своего места наверху
        p = clamp((vh - r.top) / Math.max(1, vh - it.stack - 40));
      } else if (r.bottom < -40) p = 1;
      else if (r.top > vh + 40) p = 0;
      else {
        p = clamp((vh - r.top) / (vh * 0.4));
        if (it.horiz) p = Math.min(p, clamp((vw - r.left) / (vw * 0.5)));
        p = clamp((p - it.shift) / (1 - it.shift));
      }
      p = ease(p);
      if (Math.abs(p - it.last) < 0.003) return;
      it.last = p;
      it.el.style.setProperty('--p', p.toFixed(3));
    });

    par.forEach(function (img) {
      var r = img.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var q = clamp((vh - r.top) / (vh + r.height));
      img.style.setProperty('--ps', (1.16 - q * 0.16).toFixed(3));
      img.style.setProperty('--py', ((0.5 - q) * 24).toFixed(1) + 'px');
    });
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  function setup() {
    var sections = [].slice.call(document.querySelectorAll('main section, main > div, body > section'))
      .filter(function (s) { return !skipped(s) && !s.parentElement.closest('main section'); });
    sections.forEach(function (s) {
      var odd = sec++ % 2;
      s.querySelectorAll('h1, .h1, h2, .h2').forEach(function (h) { if (!skipped(h)) splitWords(h, odd ? 'left' : 'up'); });
      findGroups(s).forEach(function (g) { setupGroup(g, s); });
      setupParallax(s);
      s.querySelectorAll('.lead, .eyebrow, p, .btn, figure, blockquote, .card, .player, .sa-map, .watch-cue, ul, ol').forEach(function (el, i) {
        if (marked.has(el) || inMarked(el) || el.closest('#shagi, header, .route, form, [data-mo-group]') || !visible(el)) return;
        add(el, el.matches('.player') ? 'pop' : 'soft', { shift: 0 });
      });
    });
    window.addEventListener('scroll', ask, { passive: true });
    var remeasure = function () { scenes.forEach(measureScene); pins.forEach(measurePin); ask(); };
    var lastW = window.innerWidth;
    // на телефоне при прокрутке прячется адресная строка и меняется высота — пересчитываем только при смене ширины
    window.addEventListener('resize', function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; remeasure(); } });
    window.addEventListener('load', remeasure);   // картинки догрузились — пересчитать высоты   // картинки догрузились — пересчитать высоты
    frame();
  }

  // Запуск после всех обработчиков загрузки: отзывы и другие блоки дорисовываются скриптами сайта
  function start() { setTimeout(setup, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
