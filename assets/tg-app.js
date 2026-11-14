/* 14.11.2026 · сайт v5.83 · Claude
   Режим «внутри Telegram» (Mini App): страница открыта кнопкой из бота @fbt_online_bot.
   Включается, если страница открыта внутри Telegram (Telegram.WebApp.initData) или есть ?tg=1.
   Что делает: прячет шапку, подвал и маршрут сайта (класс html.tg + html.clean),
   разворачивает окно на весь экран, а внешние ссылки и ссылки на бота открывает
   средствами Telegram — чтобы окно не ломалось и человек вернулся в чат. */
(function () {
  var W = window.Telegram && window.Telegram.WebApp;
  var on = false;
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('tg') === '1' || (W && W.initData)) sessionStorage.setItem('fbt_tg', '1');
    on = sessionStorage.getItem('fbt_tg') === '1';
    if (on) sessionStorage.setItem('fbt_clean', '1');
  } catch (e) { on = !!(W && W.initData); }
  if (!on) return;

  var root = document.documentElement;
  root.classList.add('tg', 'clean');
  var st = document.createElement('style');
  st.textContent = 'html.tg .hdr,html.tg .foot,html.tg .hdr-nav,html.tg .topbar,html.tg .funnel-only,html.tg .route{display:none!important}' +
    'html.tg body{padding-top:0!important}';
  (document.head || root).appendChild(st);

  if (W) { try { W.ready(); W.expand(); } catch (e) {} }

  function isTgLink(u) { return /^https?:\/\/(t\.me|telegram\.me)\//i.test(u); }
  function isExternal(u) {
    try { return new URL(u, location.href).host !== location.host; } catch (e) { return false; }
  }
  // Открыть ссылку так, чтобы Mini App не сломался
  function go(url) {
    if (W && isTgLink(url)) { try { W.openTelegramLink(url); return true; } catch (e) {} }
    if (W && isExternal(url)) { try { W.openLink(url); return true; } catch (e) {} }
    return false;
  }

  // Ссылки на сайте: внешние и t.me — через Telegram, свои страницы — в этом же окне
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
    var abs = new URL(href, location.href).href;
    if (isTgLink(abs) || isExternal(abs)) {
      if (go(abs)) ev.preventDefault();
    } else if (a.target === '_blank') {
      a.removeAttribute('target');   // своя страница — открываем в этом же окне, без нового вкладки
    }
  }, true);

  // Кнопки сайта, которые открывают ссылки кодом (FBT.open — например «Отправить куратору»)
  function patch() {
    if (window.FBT && window.FBT.open && !window.FBT.open._tg) {
      var orig = window.FBT.open;
      window.FBT.open = function (url) { if (!go(url)) orig(url); };
      window.FBT.open._tg = true;
    }
  }
  patch();
  document.addEventListener('DOMContentLoaded', patch);
})();
