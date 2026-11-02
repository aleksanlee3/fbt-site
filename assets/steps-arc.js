/* FBT Online · 3 шага на дуге (posle-zapuska.html, #shagi) · 02.11.2026 v5.59
   Телефон: прогресс прокрутки секции (0…1) поворачивает дугу — карточки 01 → 02 → 03 по очереди выезжают в центр.
   Компьютер: дуга раскрывается из стопки, когда секция появляется на экране. */
(function () {
  var sec = document.getElementById('shagi');
  if (!sec) return;
  var cards = [].slice.call(sec.querySelectorAll('.sa3-card'));
  var dots = [].slice.call(sec.querySelectorAll('.sa3-dots i'));
  var n = cards.length;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !n) return;
  var wide = function () { return window.innerWidth >= 1000; };

  // d — место карточки на дуге относительно центра (0 — в центре, ±1 — соседние)
  function place(card, d, opened) {
    var w = wide();
    var step = w ? 350 : Math.min(window.innerWidth * 0.62, 260);
    var x = d * step * opened;
    var rot = d * (w ? 9 : 7) * opened;
    var y = Math.abs(d) * Math.abs(d) * (w ? 22 : 26) * opened;
    var sc = w ? 1 : 1 - Math.min(Math.abs(d), 1) * 0.08;
    card.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
    card.style.opacity = w ? 1 : Math.max(0.35, 1 - Math.abs(d) * 0.45).toFixed(2);
    card.style.zIndex = String(10 - Math.round(Math.abs(d) * 3));
  }

  var shown = 0;          // компьютер: 0 → 1 раскрытие дуги
  var ticking = false;

  function render() {
    ticking = false;
    if (wide()) {
      cards.forEach(function (c, i) { place(c, i - (n - 1) / 2, shown); });
      return;
    }
    var r = sec.getBoundingClientRect();
    var run = Math.max(1, sec.offsetHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, -r.top / run));          // 0…1 пока секция прилипла
    var pos = p * (n - 1);                                    // 0…2 — какая карточка в центре
    cards.forEach(function (c, i) { place(c, i - pos, 1); });
    var cur = Math.round(pos);
    dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
  }
  function ask() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  // Компьютер: плавное раскрытие при появлении
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || shown) return;
        var t0 = null;
        (function anim(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / 900);
          shown = 1 - Math.pow(1 - k, 3);
          render();
          if (k < 1) requestAnimationFrame(anim);
        })(performance.now());
        if (window.FBT && FBT.event) FBT.event('see_steps', {});
        io.disconnect();
      });
    }, { threshold: 0.35 });
    io.observe(sec);
  } else { shown = 1; }

  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  render();
})();
