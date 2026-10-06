/* FBT Online · переключатель темы (06.10, v4.6).
   Подключается сразу после <body>, чтобы страница не мигала: выбор применяется до показа.
   По умолчанию: стр. 1 тёмная, остальные светлые. Если человек выбрал тему — она на всех страницах.
   Ключ не начинается с «fbt», поэтому ?reset его не стирает (это настройка удобства, а не прогресс). */
(function () {
  // С 06.10 (v5.0) все страницы в цветах Impact Consulting (body.ic): тёмная = графит сверху до отзывов (класс ic-dark),
  // светлая = графит только первый экран. Старые классы theme-dark на страницах .ic не используются.
  var KEY = 'site_theme', b = document.body, IC = b.classList.contains('ic');
  var CLS = IC ? 'ic-dark' : 'theme-dark', defDark = b.classList.contains(CLS);
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) {
    var dark = t === 'dark' || (t !== 'light' && defDark);
    b.classList.toggle(CLS, dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', IC ? (dark ? '#181818' : '#F5F5F7') : (dark ? '#17120F' : '#FBF6EE'));
    return dark;
  }
  apply(saved());

  var SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

  function paint(btn) {
    var dark = b.classList.contains(CLS);
    btn.innerHTML = (dark ? SUN : MOON) + '<span class="theme-btn-l">' + (dark ? 'Светлая' : 'Тёмная') + '<span class="theme-btn-x"> тема</span></span>';
    btn.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    btn.setAttribute('aria-pressed', dark ? 'false' : 'true');
  }

  function init() {
    var nav = document.querySelector('.hdr-nav') || document.querySelector('.hdr .wrap');
    if (!nav || nav.querySelector('[data-theme-toggle]')) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'theme-btn'; btn.setAttribute('data-theme-toggle', '');
    paint(btn);
    btn.addEventListener('click', function () {
      var next = b.classList.contains(CLS) ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) { /* без хранилища тема меняется только на этой странице */ }
      apply(next); paint(btn);
    });
    nav.insertBefore(btn, nav.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
