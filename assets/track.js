/* FBT Online · система событий сайта (27.10, просьба Александра: «полноценная система событий, потом будем менять»).
   Подключается на всех страницах сразу после fbt.js. Всё уходит через FBT.event(name, data):
   • в журнал бота web_events — и от тех, кто уже в боте (по коду), и от тех, кто ещё не заходил (по анонимному ID сайта);
     сводка — команда /sobytiya в боте;
   • в Microsoft Clarity — как «пользовательское событие» (фильтр записей визитов), кроме частых ui_click;
   • в Meta Pixel — только важное: TelegramDirect, Scroll75, EngagedVisit (60 с на странице) — см. fbt.js → pixelStep.
   Тестовые заходы (?test, ?demo) помечаются test=1 и в сводку не попадают.

   Каталог событий (data — что приходит вместе с событием):
   ui_click      {label, sec, kind}   ЛЮБОЕ нажатие на сайте: кнопки, ссылки, карточки, видео, картинки, текст.
                                      kind: bot · tg · site · ext · btn · area (не кнопка — просто место на странице)
   video_play / video_pause {sec}     видео запущено / на паузе (sec — на какой секунде)
   video_sound_on / video_sound_off   включил / выключил звук видео
   video_speed   {rate}               сменил скорость видео (1 / 1,25 / 1,5)
   video_fullscreen {on}              развернул видео на весь экран (on 1) / свернул (on 0)
   tg_direct     {who, label, sec}    «Написать / Связаться в Telegram» — личный чат (не бот)
   bot_link      {start, label, sec}  кнопка, ведущая в бота
   outbound      {host, label}        ссылка на другой сайт (YouTube, канал и т. п.)
   theme_toggle  {to, n}              сменил тему (to: dark / light, n — какой раз за визит)
   scroll_depth  {pct}                докрутил страницу до 25 / 50 / 75 / 90 %
   time_mark     {sec}                пробыл на странице 15 / 30 / 60 / 120 / 300 секунд (активная вкладка)
   section_view  {id}                 блок страницы (section с id) хотя бы наполовину на экране — один раз
   faq_open      {q}                  раскрыл вопрос (details/summary)
   album_open                         открыл «Мои артефакты»
   invite_click                       «Позвать друга»
   tab_return    {away}               вернулся на вкладку после 30+ секунд отсутствия
   rage_click    {label}              3 клика за секунду по одному месту — признак, что что-то не работает
   У всех событий есть page — страница сайта. Новое событие: добавить сюда, в fbt.js (если нужно в Meta)
   и в bot/fbt/api.py → EVENTS и TRACK_ONLY. */
(function () {
  var FBT = window.FBT; if (!FBT) return;
  var C = FBT.cfg || {};
  var page = (location.pathname.split('/').pop() || 'index').replace('.html', '') || 'index';
  function send(name, data) { try { FBT.event(name, Object.assign({ page: page }, data || {})); } catch (e) { /* без событий */ } }
  FBT.track = send;

  function clean(s, n) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, n || 60); }
  function labelOf(el) {
    return clean(el.getAttribute('data-track') || el.getAttribute('aria-label') || el.innerText || el.textContent || el.getAttribute('title') ||
      (el.querySelector('img') && el.querySelector('img').alt) || el.className, 60);
  }
  // Нажатие не по кнопке: описываем место — картинка (alt), заголовок или блок
  function areaOf(el) {
    if (el.tagName === 'IMG') return 'фото: ' + clean(el.alt || el.src.split('/').pop(), 50);
    var h = el.closest('h1, h2, h3, h4, p, li, figure, .card, [class]');
    if (!h) return 'страница';
    var t = clean(h.innerText || h.textContent, 50);
    return (h.tagName === 'H1' || h.tagName === 'H2' || h.tagName === 'H3' ? 'заголовок: ' : 'текст: ') + (t || h.className);
  }
  function sectionOf(el) {
    var s = el.closest('section[id], [id].sec, header, footer, [data-track-sec]');
    if (!s) return '';
    return clean(s.getAttribute('data-track-sec') || s.id || s.tagName.toLowerCase(), 30);
  }
  var botRe = new RegExp('t\\.me/' + String(C.bot || 'fbt_online_bot') + '(\\?|$|/)', 'i');
  function kindOf(href) {
    if (!href || href.charAt(0) === '#' || /^javascript:/i.test(href)) return 'btn';
    if (botRe.test(href)) return 'bot';
    if (/(^|\/\/)(t\.me|telegram\.me)\//i.test(href)) return 'tg';
    try { return new URL(href, location.href).host === location.host ? 'site' : 'ext'; } catch (e) { return 'btn'; }
  }
  function tgWho(href) {
    var m = /t\.me\/([A-Za-z0-9_]+)/i.exec(href || ''); var u = m ? m[1].toLowerCase() : '';
    if (u && u === String(C.curator || '').toLowerCase()) return 'curator';
    if (u && u === String(C.contact || '').toLowerCase()) return 'contact';
    return u || 'other';
  }

  // ── Клики ──
  var last = { el: null, t: 0, n: 0 };
  document.addEventListener('click', function (e) {
    // 27.10 (Александр): все нажатия — и по кнопкам, и по любому месту страницы (видео, фото, карточки, текст)
    var btn = e.target.closest && e.target.closest('a, button, [role="button"], [data-track], summary, label, input, .qopt, .opt, .player, [data-player]');
    var el = btn || e.target;
    if (!el || !el.getAttribute) return;
    if (el.tagName === 'SUMMARY') { send('ui_click', { label: 'FAQ: ' + labelOf(el), sec: sectionOf(el), kind: 'btn' }); return; }
    if (el.tagName === 'INPUT' && /text|tel|email|search|number/.test(el.type)) return;   // поля ввода не пишем (личные данные)
    var label = btn ? labelOf(el) : areaOf(el), sec = sectionOf(el), href = el.getAttribute('href') || '';
    var kind = btn ? kindOf(href) : 'area';
    if (el.matches('.player, [data-player]') || el.closest('.player')) { label = 'видео: ' + clean(e.target.getAttribute('aria-label') || e.target.className || 'экран', 40); kind = 'video'; }
    // ответы диагностики не логируем по одному (их и так видно в результате) — только факт клика
    if (el.classList.contains('qopt') || el.classList.contains('opt')) label = 'ответ диагностики';
    send('ui_click', { label: label, sec: sec, kind: kind });
    if (kind === 'tg') send('tg_direct', { who: tgWho(href), label: label, sec: sec });
    else if (kind === 'bot') send('bot_link', { start: clean((/start=([^&]+)/.exec(href) || [])[1], 40), label: label, sec: sec });
    else if (kind === 'ext') { try { send('outbound', { host: new URL(href, location.href).host, label: label }); } catch (x) { /* */ } }
    if (el.classList.contains('alb-fab')) send('album_open');
    if (el.matches('[data-alb-act="share"], [data-invite]')) send('invite_click');
    // много кликов подряд по одному месту
    var now = Date.now();
    if (last.el === el && now - last.t < 1000) { last.n += 1; if (last.n === 3) send('rage_click', { label: label, sec: sec }); }
    else { last.el = el; last.n = 1; }
    last.t = now;
  }, true);

  // Кнопки, которые открывают Telegram из кода (FBT.open), а не ссылкой
  var open0 = FBT.open;
  FBT.open = function (url) {
    var k = kindOf(url);
    if (k === 'tg') send('tg_direct', { who: tgWho(url), label: 'из кода', sec: '' });
    return open0.apply(this, arguments);
  };

  // ── Тема ──
  var themeN = 0;
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('[data-theme-toggle]')) return;   // ловим до перерисовки кнопки (capture)
    setTimeout(function () {
      themeN += 1;
      var b = document.body, dark = b.classList.contains('ic-dark') || b.classList.contains('theme-dark');
      send('theme_toggle', { to: dark ? 'dark' : 'light', n: themeN });
    }, 50);
  }, true);

  // ── FAQ ──
  document.addEventListener('toggle', function (e) {
    var d = e.target; if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    var s = d.querySelector('summary'); send('faq_open', { q: clean(s ? s.textContent : '', 80) });
  }, true);

  // ── Прокрутка ──
  var marks = [25, 50, 75, 90], done = {};
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    var pct = Math.round((h.scrollTop || document.body.scrollTop) / max * 100);
    marks.forEach(function (m) { if (pct >= m && !done[m]) { done[m] = 1; send('scroll_depth', { pct: m }); } });
  }
  window.addEventListener('scroll', function () { if (!onScroll.t) onScroll.t = setTimeout(function () { onScroll.t = 0; onScroll(); }, 250); }, { passive: true });

  // ── Время на странице (только пока вкладка видна) ──
  var tmarks = [15, 30, 60, 120, 300], tdone = {}, active = 0, hiddenAt = 0;
  setInterval(function () {
    if (document.hidden) return;
    active += 1;
    tmarks.forEach(function (m) { if (active >= m && !tdone[m]) { tdone[m] = 1; send('time_mark', { sec: m }); } });
  }, 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 30000) send('tab_return', { away: Math.round((Date.now() - hiddenAt) / 1000) });
    hiddenAt = 0;
  });

  // ── Какие блоки увидел ──
  if ('IntersectionObserver' in window) {
    var seen = {};
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (en) {
        var id = en.target.id;
        // «увидел» = блок наполовину на экране или занял полэкрана (высокие блоки целиком не помещаются)
        var ok = en.isIntersecting && (en.intersectionRatio >= 0.5 || en.intersectionRect.height >= window.innerHeight * 0.5);
        if (ok && id && !seen[id]) { seen[id] = 1; send('section_view', { id: id }); io.unobserve(en.target); }
      });
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75] });
    function watch() { document.querySelectorAll('section[id]').forEach(function (s) { io.observe(s); }); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  }
})();
