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
  FBT.markMap = function () { store.set('fbt_map', 1); };

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

  // Тестовый режим: показываем подписи «заглушка» на фото
  if (C.testMode) document.documentElement.classList.add('is-test');

  document.addEventListener('DOMContentLoaded', function () {
    bindLinks(document);
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  });
})();
