/* FBT Online · движение блоков при прокрутке · 02.11.2026 (v5.60)
   Образец — yaas-energy.com: у каждого блока своё движение. Решение Александра 02.11: «весь сайт динамичный,
   направления движения разные».
   Как работает: на каждой странице скрипт находит группы одинаковых карточек (komu, отзывы, «Узнаёте себя?»,
   таймлайн, FAQ…) и по очереди даёт им разные движения из набора EFFECTS — соседние группы никогда не двигаются
   одинаково. Заголовки h1/h2 появляются по словам, одиночные блоки — мягко поднимаются, большие фото в рамках
   плавно приближаются при прокрутке. Секция «3 шага» (#shagi) анимируется своим скриптом (steps-arc.js).
   Не трогаем: страницы диагностики (body.pg-diag), шапку, плеер, формы; при «уменьшить движение» — ничего.
   Стили — assets/motion.css. Если что-то сломалось — убрать подключение motion.js, страница останется как была. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var body = document.body;
  if (!body || body.classList.contains('pg-diag')) return;
  document.documentElement.classList.add('mo');

  // Порядок движений для групп карточек: веер, слева-справа, переворот, падение с наклоном, зум, подъём
  var EFFECTS = ['fan', 'flyalt', 'flip', 'tilt', 'zoom', 'rise'];
  var SCROLL_EFFECTS = ['slide', 'swing'];   // для лент, которые листаются вбок
  var SKIP = '#shagi, .player, header, .hdr, .route, form, .push-wrap, [data-mo-skip], .igra-cue, script, style';
  var gi = 0, si = 0, sec = 0;
  var marked = new Set();

  function visible(el) { return el.offsetParent !== null && el.offsetWidth > 0; }
  function skipped(el) { return !!el.closest(SKIP); }
  function inMarked(el) { for (var p = el.parentElement; p && p !== body; p = p.parentElement) if (marked.has(p)) return true; return false; }
  function mark(el, fx, i) { el.setAttribute('data-mo', fx); if (i != null) el.style.setProperty('--i', String(i)); marked.add(el); }

  // ── Заголовки по словам ──
  function splitWords(h, variant) {
    if (h.dataset.moWords) return;
    h.dataset.moWords = variant;
    var n = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/( +)/);
          if (parts.length < 1 || !c.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (t) {
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
      // берём самый внешний подходящий контейнер — вложенные карточки не анимируем дважды
      for (var i = 0; i < out.length; i++) if (out[i].box.contains(p)) return;
      out.push({ box: p, kids: same });
    });
    return out;
  }

  function setupGroup(g) {
    var cs = getComputedStyle(g.box);
    var scrollX = cs.overflowX === 'auto' || cs.overflowX === 'scroll';
    var fx = scrollX ? SCROLL_EFFECTS[si++ % SCROLL_EFFECTS.length] : EFFECTS[gi++ % EFFECTS.length];
    g.box.setAttribute('data-mo-group', fx);
    if (fx === 'fan') {
      // карточки стартуют «стопкой» в центре группы и разлетаются по местам с наклоном
      var b = g.box.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + Math.min(b.height, 420) / 2;
      var oneCol = g.kids.every(function (k) { return Math.abs(k.getBoundingClientRect().left - g.kids[0].getBoundingClientRect().left) < 20; });
      g.kids.forEach(function (k, i) {
        var r = k.getBoundingClientRect();
        var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
        if (oneCol) { dx = (i % 2 ? 1 : -1) * Math.min(160, r.width * 0.45); dy = -40; }   // телефон: одна колонка — разлёт слева/справа
        k.style.setProperty('--fx', Math.round(dx * 0.85) + 'px');
        k.style.setProperty('--fy', Math.round(Math.max(-260, Math.min(260, dy * 0.85)) + 40) + 'px');
        k.style.setProperty('--fr', ((i % 2 ? 1 : -1) * (6 + (i % 3) * 3)) + 'deg');
        mark(k, fx, Math.min(i, 5));
      });
      watch(g.box, g.kids);
      return;
    }
    g.kids.forEach(function (k, i) { mark(k, fx, scrollX ? Math.min(i, 3) : Math.min(i, 6)); watch(k); });
  }

  // ── Наблюдатель: элемент в кадре → класс .mo-in ──
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var list = e.target._moList || [e.target];
      list.forEach(function (el) { el.classList.add('mo-in'); });
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  function watch(target, list) { if (list) target._moList = list; io.observe(target); }

  // ── Фото в рамке: плавное приближение при прокрутке ──
  var par = [];
  function setupParallax(section) {
    section.querySelectorAll('img').forEach(function (img) {
      if (skipped(img) || img.closest('[data-mo-group="slide"],[data-mo-group="swing"]')) return;
      var box = img.parentElement;
      if (!box || img.offsetWidth < 240 || getComputedStyle(box).overflow === 'visible') return;
      img.classList.add('mo-par'); par.push(img);
    });
  }
  var ticking = false;
  function scrub() {
    ticking = false;
    var vh = window.innerHeight;
    // Подстраховка: всё, что уже на экране по высоте (кроме лент вбок), показываем, даже если наблюдатель промолчал
    marked.forEach(function (el) {
      if (el.classList.contains('mo-in') || el.closest('[data-mo-group="slide"],[data-mo-group="swing"]')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0 && el.offsetParent) el.classList.add('mo-in');
    });
    par.forEach(function (img) {
      var r = img.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));   // 0 — внизу экрана, 1 — ушло вверх
      img.style.setProperty('--ps', (1.16 - p * 0.16).toFixed(3));
      img.style.setProperty('--py', ((0.5 - p) * 24).toFixed(1) + 'px');
    });
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(scrub); } }

  // ── Обход секций ──
  function setup() {
    var sections = [].slice.call(document.querySelectorAll('main section, main > div, body > section'))
      .filter(function (s) { return !skipped(s) && !s.closest('main section section'); });
    sections.forEach(function (s) {
      var odd = sec++ % 2;
      s.querySelectorAll('h1, .h1, h2, .h2').forEach(function (h) {
        if (skipped(h) || h.dataset.moWords) return;
        splitWords(h, odd ? 'left' : 'up');
        watch(h, [h]);
      });
      findGroups(s).forEach(setupGroup);
      setupParallax(s);
      // одиночные блоки: подзаголовки, абзацы, кнопки, фото, карточки
      s.querySelectorAll('.lead, .eyebrow, p, .btn, figure, blockquote, .card, .player, .sa-map, .watch-cue, ul, ol').forEach(function (el, i) {
        if (marked.has(el) || inMarked(el) || el.closest('#shagi, header, .route, form') || !visible(el)) return;
        if (el.matches('.player')) { mark(el, 'pop', 1); watch(el); return; }
        if (el.closest('[data-mo-group]')) return;
        mark(el, 'soft', Math.min(i % 4, 3)); watch(el);
      });
    });
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    scrub();
    setTimeout(ask, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
