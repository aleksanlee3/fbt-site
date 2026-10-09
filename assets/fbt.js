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

  // Полный сброс для теста: ?reset на любой странице стирает всё, что сайт помнит о человеке
  // (прогресс урока, карта, диагностика, артефакты, личный код из бота, источник).
  if (/[?&]reset(=|&|$)/.test(location.search)) {
    try {
      Object.keys(window.localStorage).forEach(function (k) { if (k.indexOf('fbt') === 0) window.localStorage.removeItem(k); });
    } catch (e) { /* хранилище недоступно */ }
  }

  // 09.10: версия сайта — уходит с каждым событием в бот (по ней в Notion видно, при какой версии это было)
  var VERSION = '5.17';

  // 09.10: тестовое прохождение. ?test, ?demo, ?reset в адресе или testMode в config.js — это сотрудник или проверка.
  // Отметка остаётся в браузере: все события отсюда идут с пометкой test, бот ставит человеку «Тест» в Notion.
  if (!!C.testMode || !!C.videoTest || /[?&](test|demo|reset)(=|&|$)/.test(location.search)) store.set('fbt_test', 1);
  var isTest = store.get('fbt_test', 0) === 1;

  // Метка источника: ?s=ig1 или utm_source → запоминаем при первом заходе (для ссылок в бот)
  function cleanTag(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24); }
  var qs = new URLSearchParams(window.location.search);
  // 09.10: все метки рекламы первого захода (utm_source / medium / campaign / content / term / id) — для Notion.
  // Первый заход не перезаписываем: важно, какая реклама привела человека впервые.
  (function () {
    var u = {}, any = false;
    ['source', 'medium', 'campaign', 'content', 'term', 'id'].forEach(function (k) {
      var v = String(qs.get('utm_' + k) || '').replace(/[^\w\-.:|]/g, '').slice(0, 80);
      if (v) { u[k] = v; any = true; }
    });
    if (any && !store.get('fbt_utm', null)) store.set('fbt_utm', u);
  })();
  // 09.10: анонимный ID браузера — без имени и телефона. По нему в Clarity находится запись визита человека из Notion.
  var anon = store.get('fbt_anon', '');
  if (!/^[a-z0-9]{12,32}$/.test(anon)) {
    anon = (Date.now().toString(36) + Math.random().toString(36).slice(2, 12)).replace(/[^a-z0-9]/g, '').slice(0, 20);
    store.set('fbt_anon', anon);
  }
  var src = cleanTag(qs.get('s') || qs.get('utm_source'));
  if (src) store.set('fbt_src', src);
  src = store.get('fbt_src', '');

  // Личный код человека из бота (?t=<код>): так сайт знает, кто это, и шлёт боту события без /start.
  // Код запоминаем, а из адреса убираем — чтобы не попал в чужие руки при пересылке ссылки.
  var tkn = qs.get('t');
  if (tkn && /^[A-Za-z0-9]{10,40}$/.test(tkn)) {
    // Пришёл с другим кодом, чем раньше (например, после /reset в боте) — это новое прохождение:
    // стираем старый прогресс на сайте, чтобы не было «как будто уже проходил»
    var prev = store.get('fbt_token', '');
    if (prev && prev !== tkn) {
      try {
        Object.keys(window.localStorage).forEach(function (k) { if (k.indexOf('fbt') === 0) window.localStorage.removeItem(k); });
      } catch (e) { /* хранилище недоступно */ }
    }
    store.set('fbt_token', tkn);
    try {
      qs.delete('t');
      var q = qs.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    } catch (e) { /* старый браузер — оставляем адрес как есть */ }
  }
  // Кнопки «в бот» без /start — только когда сервер бота точно отвечает (иначе обычные ссылки с /start)
  var apiOk = false;
  function linked() { return !!(apiOk && C.botApi && store.get('fbt_token', '')); }
  // Кнопки «Забрать карту» (p1.js/p2.js) спрашивают: можем ли отправить карту, не уводя человека в Telegram?
  // Связи нет (холодный трафик с рекламы) — ссылка на бота остаётся единственным способом её доставить.
  // 09.10: у каждого события — свой номер (eid): если браузер пришлёт его дважды, бот не засчитает повтор.
  var eidN = 0;
  function eid() { eidN += 1; return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + eidN.toString(36)).slice(0, 40); }
  function event(name, data) {
    var token = store.get('fbt_token', '');
    if (!C.botApi || !token) return;
    try {
      fetch(C.botApi.replace(/\/$/, '') + '/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, event: name, data: data || {}, eid: eid(), v: VERSION, test: isTest ? 1 : 0 }),
        keepalive: true });
    } catch (e) { /* без сервера — пропускаем */ }
  }

  function bot(start) {
    return 'https://t.me/' + C.bot + (start ? '?start=' + encodeURIComponent(start).slice(0, 64) : '');
  }
  function tg(user, text) {
    return 'https://t.me/' + user + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function mapStart(page) {
    // Бот понимает map (с сайта) и map_<метка> (реклама): так видно, откуда пришёл человек
    if (page) return 'map_' + page + (src ? '_' + src : '');   // страница карты: бот не поздравляет «вы досмотрели урок»
    return src ? 'map_' + src : 'map';
  }
  function open(url) {
    var w = null;
    try { w = window.open(url, '_blank', 'noopener'); } catch (e) { w = null; }
    if (!w) window.location.href = url;
  }

  var FBT = window.FBT = { cfg: C, store: store, bot: bot, tg: tg, mapStart: mapStart, open: open, src: src,
    linked: linked, event: event, version: VERSION, isTest: isTest, anon: anon };
  // Личная ссылка «Позвать друга» (t.me/<бот>?start=ref_<id>) — приходит от бота после входа
  FBT.refLink = function () { return store.get('fbt_token', '') ? store.get('fbt_ref', '') : ''; };
  // маршрут человека: какую страницу открыл
  event('page_view', { page: (location.pathname.split('/').pop() || 'index').replace('.html', '') || 'index' });
  // 07.10: сколько секунд человек провёл на странице и как глубоко прокрутил — для аналитики воронки (Notion).
  // Считаем только время, когда вкладка видна; отправляем при уходе со страницы или сворачивании.
  (function () {
    var page = (location.pathname.split('/').pop() || 'index').replace('.html', '') || 'index';
    var shown = document.hidden ? 0 : Date.now(), acc = 0, depth = 0;
    function scrolled() {
      var h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0) depth = Math.max(depth, Math.round(scrollY / h * 100));
    }
    addEventListener('scroll', scrolled, { passive: true });
    function flush() {
      if (shown) { acc += Date.now() - shown; shown = 0; }
      var sec = Math.round(acc / 1000);
      if (sec >= 3) event('page_time', { page: page, sec: sec, scroll: depth });
      acc = 0;
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); else shown = Date.now(); });
    addEventListener('pagehide', flush);
  })();

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
      // Человек уже знаком с ботом — открываем чат без /start, а сайт сам сообщает боту, что нажато
      a.href = linked() ? bot('') : bot(start);
      a.setAttribute('data-bot-start', start);
      a.target = '_blank'; a.rel = 'noopener';
    });
  }
  FBT.bindLinks = bindLinks;
  // Проверяем, что сервер отвечает и личный код ещё привязан к человеку в боте (после /reset в боте — нет)
  // Заодно сверяем артефакты, выданные в боте (созвон, друг, канал), и берём личную ссылку «Позвать друга» (ref_link).
  function syncWithBot() {
    var token = store.get('fbt_token', '');
    if (!C.botApi || !token) return;
    try {
      fetch(C.botApi.replace(/\/$/, '') + '/api/session/' + encodeURIComponent(token))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.linked) {
            if (!apiOk) { apiOk = true; bindLinks(); if (FBT.onLinked) FBT.onLinked(); }
            // 09.10: один раз на прохождение — метки рекламы первого захода и анонимный ID (для Clarity)
            if (store.get('fbt_utm_sent', '') !== token) {
              var u = store.get('fbt_utm', {}) || {}, payload = { anon: anon };
              Object.keys(u).forEach(function (k) { payload[k] = u[k]; });
              event('utm', payload);
              store.set('fbt_utm_sent', token);
            }
            (d.stickers || []).forEach(function (id) { if (FBT.medal) FBT.medal(id); });
            if (d.ref_link && /^https:\/\/t\.me\/[A-Za-z0-9_]+\?start=ref_\d+$/.test(d.ref_link)) store.set('fbt_ref', d.ref_link);
          } else if (d) { store.set('fbt_token', ''); store.set('fbt_ref', ''); apiOk = false; }   // код устарел — ссылки снова с /start
        }).catch(function () { /* сервер недоступен — остаются ссылки с /start */ });
    } catch (e) { /* нет fetch */ }
  }
  syncWithBot();
  setInterval(function () { if (!document.hidden) syncWithBot(); }, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncWithBot(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-bot-start]');
    if (!a || !linked()) return;
    var start = a.getAttribute('data-bot-start') || '';
    if (start.indexOf('map') === 0) { event('map_take', { page: a.getAttribute('data-page') || '' }); if (FBT.pushNotice) setTimeout(FBT.pushNotice.map, 2500); }
    else if (start) event('bot_start', { start: start });
  });

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
    { id: '5iXz6a-isZ8', name: 'Выпускница FBT', place: '' },
    { id: 'jRntkVMctD0', name: 'Выпускник FBT', place: '' },
    { id: '4PWNwSsQsIE', name: 'Выпускник FBT', place: 'Душанбе, Таджикистан' },
    { id: 'tV_5pNK2XRA', name: 'Выпускник FBT', place: '' },
    { id: 'zpWKM2sYcxQ', name: 'Выпускница FBT', place: '' }
  ];
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Позиция просмотра каждого ролика — чтобы «на весь экран» продолжал с того же места
  var rvTime = {};
  window.addEventListener('message', function (e) {
    if (!/youtube/.test(e.origin || '')) return;
    var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (!d || !d.info || typeof d.info.currentTime !== 'number') return;
    document.querySelectorAll('.rv iframe').forEach(function (f) {
      if (f.contentWindow === e.source) rvTime[f.getAttribute('data-id')] = d.info.currentTime;
    });
  });
  function ytSrc(id, start) {
    return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1&modestbranding=1&enablejsapi=1' +
      (start ? '&start=' + Math.floor(start) : '') + '&origin=' + encodeURIComponent(location.origin);
  }
  function stopInline(except) {
    document.querySelectorAll('.rv.is-on').forEach(function (rv) {
      if (rv === except) return;
      var f = rv.querySelector('iframe'); if (f) f.remove();
      rv.classList.remove('is-on');
    });
  }
  function playInline(rv) {
    var id = rv.getAttribute('data-rv'); if (rv.classList.contains('is-on')) return;
    stopInline(rv);
    var f = document.createElement('iframe');
    f.setAttribute('data-id', id);
    f.src = ytSrc(id, rvTime[id]);
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.setAttribute('allowfullscreen', ''); f.title = 'Видеоотзыв';
    f.addEventListener('load', function () { try { f.contentWindow.postMessage('{"event":"listening","id":"' + id + '"}', '*'); } catch (x) {} });
    rv.querySelector('.rv-cover').appendChild(f);
    rv.classList.add('is-on');
  }
  function openReview(id) {
    var start = rvTime[id] || 0;
    stopInline();
    var m = document.createElement('div');
    m.className = 'rv-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Видеоотзыв');
    m.innerHTML = '<div class="rv-box"><button type="button" class="rv-x" aria-label="Закрыть">×</button>' +
      '<iframe src="' + ytSrc(id, start) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Видеоотзыв"></iframe></div>';
    function close() { m.remove(); document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('rv-open'); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.rv-x')) close(); });
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('rv-open');
    document.body.appendChild(m);
  }
  var FULL_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>';
  FBT.renderReviews = function () {
    document.querySelectorAll('[data-reviews]').forEach(function (box) {
      var lim = parseInt(box.getAttribute('data-limit'), 10) || FBT.REVIEWS.length;
      box.innerHTML = FBT.REVIEWS.slice(0, lim).map(function (r) {
        return '<div class="rv" data-rv="' + r.id + '">' +
          '<span class="rv-cover"><img src="assets/img/rev/' + r.id + '.jpg" alt="" loading="lazy">' +
          '<button type="button" class="rv-play" data-rv-play aria-label="Смотреть отзыв: ' + esc(r.name) + '"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></button>' +
          '<button type="button" class="rv-full" data-rv-full aria-label="На весь экран">' + FULL_ICO + '</button></span>' +
          '<span class="rv-t"><b>' + esc(r.name) + '</b>' + (r.place ? '<span>' + esc(r.place) + '</span>' : '') + '</span></div>';
      }).join('');
      // Карусель прокрутили — ролик, ушедший из вида, останавливаем
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            if (en.isIntersecting || !en.target.classList.contains('is-on')) return;
            var f = en.target.querySelector('iframe'); if (f) f.remove();
            en.target.classList.remove('is-on');
          });
        }, { threshold: 0.35 });
        box.querySelectorAll('.rv').forEach(function (rv) { io.observe(rv); });
      }
    });
    // Стрелки для ленты отзывов (на компьютере; на телефоне — свайп)
    document.querySelectorAll('[data-reviews]').forEach(function (box) {
      if (box.previousElementSibling && box.previousElementSibling.classList.contains('revs-nav')) return;
      var nav = document.createElement('div');
      nav.className = 'revs-nav';
      var arr = function (d) { return '<button type="button" class="revs-arr" data-dir="' + d + '" aria-label="' + (d < 0 ? 'Назад' : 'Дальше') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (d < 0 ? '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>' : '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>') + '</svg></button>'; };
      nav.innerHTML = arr(-1) + arr(1);
      box.parentNode.insertBefore(nav, box);
      var upd = function () {
        var b = nav.querySelectorAll('.revs-arr');
        b[0].disabled = box.scrollLeft < 8;
        b[1].disabled = box.scrollLeft + box.clientWidth > box.scrollWidth - 8;
      };
      nav.addEventListener('click', function (e) {
        var btn = e.target.closest('.revs-arr'); if (!btn) return;
        box.scrollBy({ left: (+btn.getAttribute('data-dir')) * box.clientWidth * 0.8, behavior: 'smooth' });
      });
      box.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    });
    var all = document.querySelector('[data-reviews-all]');
    if (all && C.reviewsUrl) { all.href = C.reviewsUrl; all.hidden = false; }
  };
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var full = t.closest('[data-rv-full]');
    var rv = t.closest('.rv');
    if (full && rv) {
      e.preventDefault(); openReview(rv.getAttribute('data-rv'));
      if (FBT.event) try { FBT.event('review_full', { id: rv.getAttribute('data-rv') }); } catch (x) {}
      return;
    }
    if (rv && t.closest('.rv-cover') && !rv.classList.contains('is-on')) {
      playInline(rv);
      if (FBT.event) try { FBT.event('review_open', { id: rv.getAttribute('data-rv') }); } catch (x) {}
    }
  });

  // Тестовый режим: показываем подписи «заглушка» на фото
  if (C.testMode) document.documentElement.classList.add('is-test');

  document.addEventListener('DOMContentLoaded', function () {
    bindLinks(document);
    FBT.renderReviews();
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  });

  // ── 09.10: Microsoft Clarity — тепловые карты и записи визитов (необязательный визуальный слой) ──
  // Включается, только если в config.js указан clarity: '<ID проекта>'. Ответы диагностики, формы и все поля ввода
  // скрываются в записях (data-clarity-mask), в Clarity уходит только анонимный ID — без имени, телефона и Telegram.
  if (C.clarity && /^[a-z0-9]{6,20}$/i.test(C.clarity)) {
    var startClarity = function () {
      var mask = 'form, input, textarea, select, [data-ap], [data-t]' +
        (document.body && document.body.classList.contains('pg-diag') ? ', main' : '');
      document.querySelectorAll(mask).forEach(function (el) { el.setAttribute('data-clarity-mask', 'True'); });
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', C.clarity);
      window.clarity('identify', anon);
      window.clarity('set', 'fbt_test', isTest ? '1' : '0');
      window.clarity('set', 'fbt_version', VERSION);
      if (src) window.clarity('set', 'fbt_source', src);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startClarity);
    else startClarity();
  }
})();
