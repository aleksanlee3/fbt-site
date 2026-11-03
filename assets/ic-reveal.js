/* FBT Online · лёгкие анимации в стиле icgroup.uz (v5.70, 03.11.2026 — главная как образец).
   Решение Александра: блок плавно появляется ОДИН раз, когда попал на экран, и дальше стоит на месте.
   Ничего не считается на каждом кадре прокрутки: IntersectionObserver ставит класс .icr-in, остальное делает CSS
   (assets/ic-home.css). Поэтому сайт не тормозит и на простых телефонах.
   «Узнаёте себя?» (data-mo-scene="needs") — номера на красной линии, как в v5.69 (стили — assets/motion.css). */
(function () {
  var body = document.body, root = document.documentElement;
  if (!body || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('mo', 'icr-on');

  var SKIP = 'header, .hdr, .route, .player, form, [data-mo-skip], .igra-cue, .mo-needs';
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('icr-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  function vis(el) { return el.offsetParent !== null || getComputedStyle(el).position === 'fixed'; }
  // fx: up — подъём на 20 px · img — фото раскрывается от центра · bar — красная полоска растёт · num — номер загорается
  function mark(el, fx, delay) {
    if (!el || el.classList.contains('icr') || el.closest(SKIP)) return;
    el.classList.add('icr');
    el.setAttribute('data-icr', fx || 'up');
    if (delay) el.style.setProperty('--icr-d', delay + 'ms');
    io.observe(el);
  }

  // ── «Узнаёте себя?»: тот же вид, что в v5.69 (номера на линии, заголовок слева на компьютере) ──
  function setupNeeds(box) {
    var section = box.closest('section');
    var kids = [].slice.call(box.children);
    box.setAttribute('data-mo-group', 'needs');
    box.classList.add('mo-needs');
    if (section) section.classList.add('mo-needs-sec');
    var head = section && section.querySelector('h2, .h2');
    if (head && head.parentNode === box.parentNode) {
      var lay = document.createElement('div'); lay.className = 'mo-needs-lay';
      var side = document.createElement('div'); side.className = 'mo-needs-side';
      var cnt = document.createElement('p'); cnt.className = 'mo-needs-cnt';
      cnt.textContent = kids.length + ' ' + (kids.length >= 5 ? 'частых ситуаций' : 'частые ситуации');
      head.parentNode.insertBefore(lay, head);
      side.appendChild(head); side.appendChild(cnt);
      lay.appendChild(side); lay.appendChild(box);
    }
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('mo-nd-in'); nio.unobserve(e.target); } });
    }, { threshold: 0.22, rootMargin: '0px 0px -10% 0px' });
    kids.forEach(function (k, i) {
      k.classList.add('mo-nd');
      var n = document.createElement('i'); n.className = 'mo-nd-n'; n.setAttribute('aria-hidden', 'true');
      n.textContent = (i < 9 ? '0' : '') + (i + 1);
      k.insertBefore(n, k.firstChild);
      nio.observe(k);
    });
  }

  // группа карточек: соседи появляются по очереди, с шагом 70 мс (как на icgroup.uz)
  function group(sel, opt) {
    document.querySelectorAll(sel).forEach(function (box) {
      [].slice.call(box.children).filter(vis).forEach(function (k, i) {
        mark(k, 'up', Math.min(i, 6) * 70);
        if (opt && opt.img) mark(k.querySelector(opt.img), 'img', Math.min(i, 6) * 70 + 120);
      });
    });
  }

  function setup() {
    document.querySelectorAll('[data-mo-scene="needs"]').forEach(setupNeeds);

    document.querySelectorAll('main section').forEach(function (s) {
      if (s.closest(SKIP) || s.matches('.sec--hero')) return;
      // шапка секции: метка, заголовок (с красной полоской), подзаголовок
      s.querySelectorAll(':scope > .wrap > .eyebrow, :scope > .wrap > .h2, :scope .story-main > .tag-tone, :scope .story-main > .h2')
        .forEach(function (el, i) { mark(el, el.matches('.h2') ? 'head' : 'up', i * 70); });
      s.querySelectorAll(':scope > .wrap > .sub, :scope > .wrap > .komu-lead, :scope > .wrap > .komu-note, :scope .story-foot, :scope .lquote')
        .forEach(function (el) { mark(el, 'up', 140); });
    });

    group('.komu-grid', { img: '.komu-ph' });
    group('.rsteps');
    group('.timeline');
    group('.revs');
    mark(document.querySelector('.story-photo'), 'img');
    mark(document.querySelector('.story-num'), 'up', 200);
    mark(document.querySelector('.igv'), 'up');
    mark(document.querySelector('.end-cta .unlock'), 'up');

    // первый экран — мягкое появление сразу при загрузке (без ожидания прокрутки)
    var hero = document.querySelector('.sec--hero > .wrap');
    if (hero) [].slice.call(hero.querySelectorAll('[data-hero]:not([hidden]) > *, :scope > .meta, :scope > .watch-cue, :scope > .player, :scope > .unlock'))
      .forEach(function (el, i) { el.classList.add('icr', 'icr-hero'); el.setAttribute('data-icr', 'up'); el.style.setProperty('--icr-d', (i * 70) + 'ms'); });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      document.querySelectorAll('.icr-hero').forEach(function (el) { el.classList.add('icr-in'); });
    }); });

    // отзывы дорисовываются скриптом сайта позже — подхватить новые карточки
    var revs = document.querySelector('.revs');
    if (revs && 'MutationObserver' in window) new MutationObserver(function () { group('.revs'); }).observe(revs, { childList: true });
  }

  function start() { setTimeout(setup, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
