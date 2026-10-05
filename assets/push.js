/*
  FBT Online — уведомления на сайте в виде системного пуша (стиль — assets/push.css).
  Выглядят как пуш на телефоне человека: iPhone — как iOS, Android — как Android, компьютер — как macOS.
  Подпись — как у бота: «FBT Online», картинка — аватарка Любы.

  Показать из любого скрипта:
    FBT.push({ title: 'FBT Online', text: 'Текст', tap: function () { … } })

  Что показываем (только по событию и только настоящие данные из бота, /api/feed):
    • наклейка в альбоме            — когда человек получил наклейку
    • карта действий в Telegram     — нажал «Забрать карту» (если вошёл через бота)
    • разбор диагностики готов      — бот прислал профиль и PDF
    • письмо куратору отправлено    — нажал «Отправить куратору»
    • новая заявка / предоплата     — настоящая заявка в поток (только имя из Telegram), за последние сутки
    • осталось N мест из 12         — по предоплатам в боте, на странице программы, раз за визит
    • урок сейчас смотрят N человек — на странице урока, если смотрят 3 и больше
  Отключить всё: в config.js → push: false
*/
(function () {
  var FBT = window.FBT || (window.FBT = {});
  var C = window.FBT_CONFIG || {};
  if (C.push === false) { FBT.push = function () {}; return; }

  var AVATAR = 'assets/img/luba-avatar.jpg';
  var BADGE = 'assets/logo/favicon-64.png';
  var APP = 'FBT Online';
  var SHOW_MS = 5500;               // сколько держится плашка
  var GAP_MS = 1200;                // пауза между плашками
  var SOCIAL_MAX = 3;               // «соцдоказательств» (заявки, места, смотрят) — не больше за визит
  var SOCIAL_GAP = 40000;           // и не чаще раза в 40 секунд

  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isPhone = isIOS || isAndroid || window.matchMedia('(max-width: 700px)').matches;
  var kind = isAndroid ? 'and' : 'ios';

  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ses(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function loc(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  // ── Плашка ──
  var wrap, queue = [], busy = false;
  function host() {
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'psh-wrap' + (isPhone ? '' : ' psh-wrap--desk');
    wrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(wrap);
    return wrap;
  }

  function build(n) {
    var el = document.createElement('div');
    el.className = 'psh psh--' + kind;
    el.setAttribute('role', 'status');
    var av = '<div class="psh-av"><img class="psh-face" src="' + esc(n.img || AVATAR) + '" alt=""><img class="psh-badge" src="' + BADGE + '" alt=""></div>';
    var title = '<b class="psh-title">' + esc(n.title || APP) + '</b>';
    var time = '<span class="psh-time">' + esc(n.time || 'сейчас') + '</span>';
    var text = '<p class="psh-text">' + (n.html || esc(n.text)) + '</p>';
    if (kind === 'and') {
      el.innerHTML = av + '<div class="psh-body"><div class="psh-app"><img src="' + BADGE + '" alt="">Impact Consulting · ' + time + '</div>' +
        '<div class="psh-top">' + title + '</div>' + text + '</div>';
    } else {
      el.innerHTML = av + '<div class="psh-body"><div class="psh-top">' + title + time + '</div>' + text + '</div>';
    }
    return el;
  }

  function show(n) {
    busy = true;
    var el = build(n), done = false, timer;
    host().appendChild(el);
    function hide(fast) {
      if (done) return; done = true; clearTimeout(timer);
      el.classList.remove('is-drag'); el.style.transform = ''; el.classList.add('is-out');
      setTimeout(function () { el.remove(); busy = false; setTimeout(next, fast ? 200 : GAP_MS); }, 380);
    }
    // свайп вверх (на компьютере — вправо) закрывает, тап — открывает
    var y0 = null, x0 = 0, dy = 0, dx = 0;
    el.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; dy = dx = 0; el.classList.add('is-drag'); clearTimeout(timer); }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0; dx = e.touches[0].clientX - x0;
      el.style.transform = 'translateY(' + (dy < 0 ? dy : dy / 6) + 'px)';
    }, { passive: true });
    el.addEventListener('touchend', function () {
      el.classList.remove('is-drag'); y0 = null;
      if (dy < -30) { hide(true); return; }
      el.style.transform = '';
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) { tap(); return; }
      timer = setTimeout(function () { hide(); }, SHOW_MS);
    });
    el.addEventListener('click', function (e) { if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return; tap(); });
    function tap() { hide(true); if (typeof n.tap === 'function') try { n.tap(); } catch (x) {} }
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-on'); }); });
    if (isAndroid && navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) try { navigator.vibrate(25); } catch (x) {}
    timer = setTimeout(function () { hide(); }, n.ms || SHOW_MS);
  }

  function next() {
    if (busy || !queue.length) return;
    if (document.hidden) return;                       // вкладка свёрнута — покажем, когда вернётся
    if (document.querySelector('.alb-pop')) { setTimeout(next, 800); return; }   // ждём, пока закроется большая наклейка
    show(queue.shift());
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(next, 600); });

  FBT.push = function (n) {
    if (!n) return;
    if (n.key) { var seen = ses('fbt_push_seen') || {}; if (seen[n.key]) return; seen[n.key] = 1; ses('fbt_push_seen', seen); }
    queue.push(n);
    if (document.body) next(); else document.addEventListener('DOMContentLoaded', next);
  };

  // «Соцдоказательства» — не чаще раза в 40 секунд и не больше 3 за визит
  function social(n) {
    var s = ses('fbt_push_social') || { n: 0, at: 0 };
    if (s.n >= SOCIAL_MAX || Date.now() - s.at < SOCIAL_GAP) return false;
    s.n++; s.at = Date.now(); ses('fbt_push_social', s);
    FBT.push(n); return true;
  }

  function plural(n, one, few, many) {
    if (FBT.plural) return FBT.plural(n, one, few, many);
    var a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  }
  function ago(sec) {
    if (sec < 90) return 'только что';
    var m = Math.round(sec / 60); if (m < 60) return m + ' ' + plural(m, 'минуту', 'минуты', 'минут') + ' назад';
    var h = Math.round(m / 60); return h + ' ' + plural(h, 'час', 'часа', 'часов') + ' назад';
  }
  function goProgram() { if (page !== 'programma') location.href = 'programma.html#apply'; else { var a = document.getElementById('apply'); if (a) a.scrollIntoView({ behavior: 'smooth' }); } }
  function openBot() { if (FBT.open && C.bot) FBT.open('https://t.me/' + C.bot); }
  function linked() { return !!(C.botApi && FBT.store && FBT.store.get('fbt_token', '')); }

  // ── События сайта ──
  FBT.pushNotice = {
    medal: function (m, n, total) {
      FBT.push({ key: 'medal-' + m.id, text: '', html: 'Новая наклейка в семейном альбоме — <strong>«' + esc(m.name) + '»</strong>. Уже ' + n + ' из ' + total + ' 🎉',
        tap: function () { var f = document.querySelector('.alb-fab'); if (f) f.click(); } });
    },
    map: function () {
      if (!linked()) return;
      FBT.push({ key: 'map', html: 'Карта действий уже в Telegram 🗺️ Откройте чат с ботом — PDF ждёт вас.', tap: openBot });
    },
    report: function () {
      FBT.push({ key: 'report', html: '<strong>Ваш разбор готов.</strong> Профиль и PDF уже в Telegram — откройте бота.', tap: openBot });
    },
    sent: function () {
      FBT.push({ key: 'sent', html: 'Письмо куратору отправлено ✉️ Александр посмотрит ответы и запишет вам голосовой разбор.' });
    }
  };

  // ── Лента бота: заявки, места, сколько смотрят ──
  var feedTimer;
  function feed() {
    if (!C.botApi || document.hidden) return;
    fetch(C.botApi.replace(/\/$/, '') + '/api/feed').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return;
      var seen = loc('fbt_push_joins') || [];
      var fresh = (d.joins || []).filter(function (j) { return j.ago < 86400 && seen.indexOf(j.id) < 0; });
      if (fresh.length) {
        var j = fresh[fresh.length - 1];              // по одной, начиная с более ранней
        var html = j.kind === 'prepaid'
          ? '<strong>' + esc(j.name) + '</strong> забронировал(а) место в потоке FBT · ' + ago(j.ago)
          : '<strong>' + esc(j.name) + '</strong> оставил(а) заявку в поток FBT · ' + ago(j.ago);
        if (social({ html: html, tap: goProgram })) {
          seen.push(j.id); loc('fbt_push_joins', seen.slice(-50));
        }
        return;
      }
      var left = d.seats_left;
      if (page === 'programma' && left > 0 && left <= 12 && !ses('fbt_push_seats')) {
        if (social({ html: '<strong>Осталось ' + left + ' ' + plural(left, 'место', 'места', 'мест') + ' из 12.</strong> Запись в поток закроется, когда места закончатся.', tap: goProgram })) ses('fbt_push_seats', 1);
        return;
      }
      if (page === 'index' && d.watching >= 3 && !ses('fbt_push_watch')) {
        if (social({ html: '<strong>Урок сейчас смотрят ' + d.watching + ' ' + plural(d.watching, 'человек', 'человека', 'человек') + '.</strong> Досмотрите до конца — в финале вас ждёт карта действий.' })) ses('fbt_push_watch', 1);
      }
    }).catch(function () { /* сервер недоступен — без уведомлений */ });
  }
  function startFeed() {
    setTimeout(feed, page === 'index' ? 45000 : 12000);   // на уроке не мешаем первые 45 секунд
    clearInterval(feedTimer); feedTimer = setInterval(feed, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startFeed); else startFeed();

  // Предпросмотр всех уведомлений: добавить к адресу ?push
  if (/[?&]push\b/.test(location.search)) {
    var demo = [
      function () { FBT.pushNotice.medal({ id: 'demo', name: 'Карта сокровищ' }, 2, 9); },
      function () { FBT.push({ html: 'Карта действий уже в Telegram 🗺️ Откройте чат с ботом — PDF ждёт вас.' }); },
      function () { FBT.push({ html: '<strong>Ваш разбор готов.</strong> Профиль и PDF уже в Telegram — откройте бота.' }); },
      function () { FBT.push({ html: 'Письмо куратору отправлено ✉️ Александр посмотрит ответы и запишет вам голосовой разбор.' }); },
      function () { FBT.push({ html: '<strong>Нигора</strong> оставил(а) заявку в поток FBT · 5 минут назад' }); },
      function () { FBT.push({ html: '<strong>Азиз</strong> забронировал(а) место в потоке FBT · только что' }); },
      function () { FBT.push({ html: '<strong>Осталось 4 места из 12.</strong> Запись в поток закроется, когда места закончатся.' }); },
      function () { FBT.push({ html: '<strong>Урок сейчас смотрят 17 человек.</strong> Досмотрите до конца — в финале вас ждёт карта действий.' }); }
    ];
    var start = function () { demo.forEach(function (f, i) { setTimeout(f, 1500 + i * 200); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
})();
