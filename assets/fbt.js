/* FBT Online — общие функции сайта: ссылки в Telegram, сохранение прогресса, метка источника. */
(function () {
  var C = window.FBT_CONFIG || {};

  var store = {
    get: function (k, def) {
      try { var v = window.localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* хранилище недоступно — страница работает и без него */ }
    }
  };

  // Метка источника: ?s=ig1 или utm_source → запоминаем при первом заходе (для ссылок в бот)
  function cleanTag(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24); }
  var qs = new URLSearchParams(window.location.search);
  var src = cleanTag(qs.get('s') || qs.get('utm_source'));
  if (src) store.set('fbt_src', src);
  src = store.get('fbt_src', '');

  function bot(start) {
    return 'https://t.me/' + C.bot + (start ? '?start=' + encodeURIComponent(start).slice(0, 64) : '');
  }
  function tg(user, text) {
    return 'https://t.me/' + user + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function mapStart(page) {
    // Бот понимает map (с сайта) и map_<метка> (реклама): так видно, откуда пришёл человек
    return src ? 'map_' + (page ? page + '_' : '') + src : 'map';
  }
  function open(url) {
    var w = null;
    try { w = window.open(url, '_blank', 'noopener'); } catch (e) { w = null; }
    if (!w) window.location.href = url;
  }

  var FBT = window.FBT = { cfg: C, store: store, bot: bot, tg: tg, mapStart: mapStart, open: open, src: src };

  // Карта получена? (общая отметка для всех страниц)
  FBT.gotMap = function () { return store.get('fbt_map', 0) === 1; };
  FBT.markMap = function () { store.set('fbt_map', 1); if (FBT.medal) FBT.medal('karta'); };
  // Был ли человек на стр. 1 (видео) — для подсказок холодному входу
  FBT.sawVideo = function () { var p = store.get('fbt_p1', {}) || {}; return Object.keys(p).length > 0; };
  FBT.inFunnel = function () { return FBT.sawVideo() || FBT.gotMap(); };

  // Ссылки по data-атрибутам: data-tg="contact|curator", data-bot="<start>"
  function bindLinks(root) {
    (root || document).querySelectorAll('[data-tg]').forEach(function (a) {
      var who = a.getAttribute('data-tg');
      a.href = tg(C[who] || C.contact, a.getAttribute('data-text') || '');
      a.target = '_blank'; a.rel = 'noopener';
    });
    (root || document).querySelectorAll('[data-bot]').forEach(function (a) {
      var start = a.getAttribute('data-bot');
      if (start === 'map') start = mapStart(a.getAttribute('data-page') || '');
      a.href = bot(start);
      a.target = '_blank'; a.rel = 'noopener';
    });
  }
  FBT.bindLinks = bindLinks;

  // Скрыть/показать по состоянию: data-show="got" / data-show="notGot" и т.п.
  FBT.toggle = function (state) {
    document.querySelectorAll('[data-show]').forEach(function (el) {
      var keys = el.getAttribute('data-show').split(' ');
      el.hidden = !keys.some(function (k) { return !!state[k]; });
    });
  };
  FBT.text = function (key, value) {
    document.querySelectorAll('[data-text-of="' + key + '"]').forEach(function (el) { el.textContent = value; });
  };

  FBT.fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); };
  FBT.plural = function (n, one, few, many) {
    return (n % 10 === 1 && n % 100 !== 11) ? one : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? few : many);
  };


  // ── Видеоотзывы выпускников (YouTube, вертикальные). Подписи — по названиям роликов на канале ──
  FBT.REVIEWS = [
    { id: 'NGUKPFtwmiI', name: 'Ирина', place: 'Южная Корея' },
    { id: 'FuIvvPfJZ58', name: 'Татьяна Ялышева', place: 'Выпускница FBT' },
    { id: 'wXmNb0LaE-E', name: 'Дмитрий Морозов', place: 'Победитель тренинга' },
    { id: 'f7TbHsUVdWY', name: 'Выпускник FBT', place: 'Душанбе, Таджикистан' },
    { id: '5iXz6a-isZ8', name: 'Выпускница FBT', place: '' },
    { id: 'jRntkVMctD0', name: 'Выпускник FBT', place: '' },
    { id: '4PWNwSsQsIE', name: 'Выпускник FBT', place: 'Душанбе, Таджикистан' },
    { id: 'wWW8hHLPUxM', name: 'Выпускница FBT', place: '' },
    { id: 'tV_5pNK2XRA', name: 'Выпускник FBT', place: '' },
    { id: 'zpWKM2sYcxQ', name: 'Выпускница FBT', place: '' }
  ];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function openReview(id) {
    var m = document.createElement('div');
    m.className = 'rv-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Видеоотзыв');
    m.innerHTML = '<div class="rv-box"><button type="button" class="rv-x" aria-label="Закрыть">×</button>' +
      '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Видеоотзыв"></iframe></div>';
    function close() { m.remove(); document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('rv-open'); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.rv-x')) close(); });
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('rv-open');
    document.body.appendChild(m);
  }
  FBT.renderReviews = function () {
    document.querySelectorAll('[data-reviews]').forEach(function (box) {
      var lim = parseInt(box.getAttribute('data-limit'), 10) || FBT.REVIEWS.length;
      box.innerHTML = FBT.REVIEWS.slice(0, lim).map(function (r) {
        return '<button type="button" class="rv" data-rv="' + r.id + '" aria-label="Смотреть отзыв: ' + esc(r.name) + '">' +
          '<span class="rv-cover"><img src="assets/img/rev/' + r.id + '.jpg" alt="" loading="lazy"><span class="rv-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span></span>' +
          '<span class="rv-t"><b>' + esc(r.name) + '</b>' + (r.place ? '<span>' + esc(r.place) + '</span>' : '') + '</span></button>';
      }).join('');
    });
    var all = document.querySelector('[data-reviews-all]');
    if (all && C.reviewsUrl) { all.href = C.reviewsUrl; all.hidden = false; }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rv]');
    if (b) { openReview(b.getAttribute('data-rv')); if (FBT.event) try { FBT.event('review_open', { id: b.getAttribute('data-rv') }); } catch (x) {} }
  });

  // Тестовый режим: показываем подписи «заглушка» на фото
  if (C.testMode) document.documentElement.classList.add('is-test');

  document.addEventListener('DOMContentLoaded', function () {
    bindLinks(document);
    FBT.renderReviews();
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  });
})();
