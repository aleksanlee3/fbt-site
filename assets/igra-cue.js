/* FBT Online · стр. 1, блок «Книга в подарок» (#igra) — 06.10, v4.7.
   Пока блок на экране, от подписи «Ваши артефакты — в кнопке справа внизу» к кнопке артефактов (.alb-fab)
   тянется живая стрелка. Она пересчитывается при прокрутке, поэтому всегда указывает на кнопку.
   Подпись «Ваши артефакты — здесь». Счётчик «У вас N из 9» и 9 ячеек берут прогресс из FBT.medals(). Нажатие на подпись открывает артефакты. */
(function () {
  var FBT = window.FBT || {};
  var sec = document.getElementById('igra'), cue = document.getElementById('igra-cue');
  if (!sec || !cue) return;
  var NS = 'http://www.w3.org/2000/svg', TOTAL = 9;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fab() { return document.querySelector('.alb-fab'); }
  function got() { try { return Object.keys(FBT.medals ? FBT.medals() : {}).length; } catch (e) { return 0; } }

  // ── счётчик и 9 ячеек ──
  function paintCount() {
    var n = Math.min(got(), TOTAL);
    var b = sec.querySelector('[data-igra-n]'); if (b) b.textContent = n;
    var slots = sec.querySelectorAll('.igra-slots i');
    for (var i = 0; i < slots.length; i++) slots[i].classList.toggle('on', i < n);
  }
  paintCount();
  setInterval(paintCount, 2500);   // артефакт может прийти из бота, пока человек на странице

  // ── стрелка поверх страницы ──
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'igra-arrow');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    '<defs><marker id="igra-head" viewBox="0 0 12 12" refX="7" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M1 1.5 L10 6 L1 10.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>' +
    '<path class="igra-arrow-p" marker-end="url(#igra-head)"/>';
  document.body.appendChild(svg);
  var path = svg.querySelector('path.igra-arrow-p');

  var visible = false, raf = 0, t0 = performance.now();
  function draw(now) {
    raf = 0;
    var f = fab();
    if (!visible || !f || f.classList.contains('is-wait') || document.querySelector('.alb:not([hidden])')) { svg.classList.remove('on'); if (f) f.classList.remove('is-called'); return; }
    var a = cue.getBoundingClientRect(), b = f.getBoundingClientRect();
    var vh = window.innerHeight;
    if (a.bottom < 0 || a.top > vh) { svg.classList.remove('on'); f.classList.remove('is-called'); return; }
    // начало — у правого края подписи; конец — чуть не доходя до кнопки
    var t = cue.querySelector('.igra-cue-t').getBoundingClientRect();
    var x1 = t.right + 10, y1 = t.top + t.height * 0.6;
    var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    var dx = cx - x1, dy = cy - y1, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var stop = b.width / 2 + 12;
    var x2 = cx - dx / d * stop, y2 = cy - dy / d * stop;
    // мягкий изгиб; лёгкое «дыхание», чтобы стрелка жила
    var wob = calm ? 0 : Math.sin(((now || performance.now()) - t0) / 420) * 10;
    // изгиб уводим к правому краю экрана, чтобы стрелка не перечёркивала текст
    var mx = Math.min(window.innerWidth - 10, Math.max(x1, x2) + 30 + wob), my = (y1 + y2) / 2;
    path.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
    svg.classList.add('on');
    f.classList.add('is-called');
    if (!calm) raf = requestAnimationFrame(draw);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(draw); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && FBT.albumShow) FBT.albumShow();   // кнопка артефактов нужна здесь, даже если урок ещё не смотрели
      kick();
    }, { threshold: 0.25 }).observe(cue);
  } else { visible = true; }
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  document.addEventListener('click', function () { setTimeout(kick, 60); });

  cue.addEventListener('click', function () { var f = fab(); if (f) { f.classList.remove('is-wait'); f.click(); } });
})();
