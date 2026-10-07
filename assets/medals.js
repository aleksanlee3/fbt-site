/* FBT Online — «Артефакты» (с 06.10, бывший «Семейный альбом»): 9 артефактов за шаги воронки, за все 9 — книга.
   «Позвать друга» — личная ссылка на бота (start=ref_<id>, та же, что в боте); артефакт «Друг семьи» засчитывает бот,
   когда друг нажал «Старт», сайт получает его при сверке (GET /api/session → stickers).
   Выдать наклейку из любого скрипта: FBT.medal('karta').
   Хранится в браузере (fbt_medals); при сервере бота — событие 'medal' уходит в бот.
   Ссылка-наклейка от куратора: <сайт>/?m=<код из config.js → medals.codes>. */
(function () {
  var FBT = window.FBT; if (!FBT) return;
  var C = FBT.cfg, M = C.medals || {};
  var IMG = 'assets/medals/';
  var CARD = 'assets/medals/cards/';   // 06.10: карточки артефактов 4:5 «рисунок карандашом» (те же, что в боте)
  function card(m) { return CARD + m.img + '.webp'; }
  var BOOK = 'assets/img/kniga-10-zapovedey.jpg';

  var LIST = [
    { id: 'shag',   img: '01-shag',   name: 'Первый шаг',        hint: 'Досмотрите видеоразбор Любы до конца', go: ['index.html', 'К видеоразбору'] },
    { id: 'karta',  img: '02-karta',  name: 'Карта сокровищ',    hint: 'Заберите карту действий в конце видеоразбора', go: ['index.html#video', 'К видеоразбору'] },
    { id: 'dom',    img: '03-dom',    name: 'В кругу своих',     hint: 'Подпишитесь на канал FBT', act: 'channel', go: [null, 'Открыть канал'] },
    { id: 'kompas', img: '04-kompas', name: 'Компас в кармане',  hint: 'Ответьте на 10 вопросов диагностики', go: ['diagnostika.html', 'Пройти'] },
    { id: 'tetrad', img: '05-tetrad', name: 'Домашнее задание',  hint: 'Выполните 5 заданий диагностики', go: ['diagnostika.html#tasks', 'К заданиям'] },
    { id: 'pismo',  img: '06-pismo',  name: 'Письмо наставнику', hint: 'Отправьте ответы Александру', go: ['diagnostika.html', 'К диагностике'] },
    { id: 'drug',   img: '07-drug',   name: 'Друг семьи',        hint: 'Друг нажал «Старт» в боте по вашей ссылке', act: 'share', go: [null, 'Позвать друга'] },
    { id: 'choy',   img: '08-choy',   name: 'Разговор за чаем',  hint: 'Созвон с Любой или командой — куратор пригласит после разбора' },
    { id: 'drevo',  img: '09-drevo',  name: 'Семейное древо',    hint: 'Оставьте заявку в поток FBT', go: ['programma.html#apply', 'К программе'] }
  ];
  var ROWS = [['Знакомство', 0], ['Разбор', 3], ['Вместе', 6]];
  var TOTAL = LIST.length;
  var byId = {}; LIST.forEach(function (m) { byId[m.id] = m; });

  var got = FBT.store.get('fbt_medals', {}) || {};
  function count() { return LIST.filter(function (m) { return got[m.id]; }).length; }
  function full() { return count() === TOTAL; }

  function botEvent(id) {
    var token = FBT.store.get('fbt_token', '');
    if (!C.botApi || !token) return;
    try {
      fetch(C.botApi.replace(/\/$/, '') + '/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, event: 'medal', data: { id: id, total: count() } }), keepalive: true });
    } catch (e) { /* без сервера — пропускаем */ }
  }

  // ── Выдать наклейку ──
  var queue = [], showing = false, fresh = {};
  FBT.medal = function (id, quiet) {
    if (!byId[id] || got[id]) return false;
    got[id] = Date.now(); fresh[id] = 1;
    FBT.store.set('fbt_medals', got);
    botEvent(id);
    if (!quiet) { queue.push(id); savePending(); if (ready) next(); }
    if (!quiet && FBT.pushNotice) FBT.pushNotice.medal(byId[id], count(), TOTAL);   // пуш-плашка (assets/push.js)
    updateFab(true); FBT.albumShow();
    if (book && !book.hidden) renderBook();
    return true;
  };
  FBT.medals = function () { return Object.assign({}, got); };

  // ── Кнопка-альбом ──
  var fab, book, ready = false;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // На стр. 1 альбом не отвлекает от урока: кнопка появляется после минуты просмотра или первой наклейки (30.09)
  var onLesson = /(^|\/)(index\.html)?$/.test(location.pathname);
  FBT.albumShow = function () { if (fab) fab.classList.remove('is-wait'); };
  function buildFab() {
    fab = el('button', 'alb-fab');
    if (onLesson && !count()) fab.classList.add('is-wait');
    fab.type = 'button';
    fab.innerHTML = '<svg class="ring" viewBox="0 0 74 74" aria-hidden="true"><circle class="bg" cx="37" cy="37" r="34"/><circle class="fg" cx="37" cy="37" r="34"/></svg>' +
      '<img src="' + IMG + 'gift-box.svg" alt="" width="60" height="60"><b></b>';
    fab.addEventListener('click', openBook);
    document.body.appendChild(fab);
    updateFab(false);
  }
  function updateFab(bump) {
    if (!fab) return;
    var n = count(), L = 2 * Math.PI * 34;
    var fg = fab.querySelector('.fg');
    fg.style.strokeDasharray = L; fg.style.strokeDashoffset = L * (1 - n / TOTAL);
    fab.querySelector('b').textContent = n + '/' + TOTAL;
    // 06.10: в кружке — подарок (карточка 4:5 в маленьком круге не читается), прогресс — кольцом и «N/9»
    fab.querySelector('img').src = IMG + (full() ? 'gift-book.svg' : 'gift-box.svg');
    fab.setAttribute('aria-label', 'Мои артефакты: ' + n + ' из ' + TOTAL);
    if (bump) { fab.classList.remove('is-bump'); void fab.offsetWidth; fab.classList.add('is-bump'); }
  }

  // ── Когда показывать (01.10) ──
  // Поздравление показываем только когда человек точно смотрит на сайт: вкладка видна, окно в фокусе
  // и он не ушёл только что в Telegram / на другой сайт. Иначе ждём его возвращения.
  // Очередь хранится в браузере — если страница закрылась, наклейка всплывёт при следующем заходе.
  var away = false, awayAt = 0, blurred = false, retry = 0;
  function savePending() { FBT.store.set('fbt_medals_pending', queue.slice()); }
  function goAway() { away = true; awayAt = Date.now(); }
  function comeBack(delay) {
    away = false; blurred = false;
    clearTimeout(retry); retry = setTimeout(next, delay || 900);
  }
  function canShow() {
    return document.visibilityState === 'visible' && !blurred && !away && Date.now() - awayAt > 900;
  }
  function isOutbound(a) {
    if (!a) return false;
    if (a.hasAttribute('data-tg') || a.target === '_blank') return true;
    var h = a.getAttribute('href') || '';
    if (/^(tg|mailto|tel|whatsapp):/i.test(h)) return true;
    try { var u = new URL(h, location.href); return u.origin !== location.origin; } catch (e) { return false; }
  }
  document.addEventListener('click', function (e) {
    if (isOutbound(e.target.closest && e.target.closest('a,[data-tg]'))) goAway();
  }, true);
  var _open = window.open;
  window.open = function () { goAway(); return _open.apply(window, arguments); };
  window.addEventListener('blur', function () { blurred = true; });
  window.addEventListener('focus', function () { comeBack(); });
  window.addEventListener('pageshow', function () { comeBack(700); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') comeBack(); else { blurred = true; pauseShown(); }
  });
  // Ссылка не открыла ничего (Telegram не установлен и т.п.) — человек снова кликает или листает страницу
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (away && Date.now() - awayAt > 1500) comeBack(500); }, { passive: true });
  });

  // ── Всплывашка ──
  var current = null;
  function pauseShown() {
    // Страницу свернули, пока висело поздравление — вернём его в начало очереди и покажем после возвращения
    if (!current) return;
    queue.unshift(current.id); savePending();
    current.pop.remove(); current = null; showing = false;
  }
  function next() {
    if (showing || !queue.length) return;
    if (!canShow()) { clearTimeout(retry); retry = setTimeout(next, 800); return; }
    showing = true;
    var id = queue.shift(); savePending();
    var m = byId[id], n = count();
    var pop = el('div', 'alb-pop',
      '<img class="alb-card" src="' + card(m) + '" alt="' + m.name + '">' +
      '<div><small>Новый артефакт · ' + n + ' из ' + TOTAL + '</small><strong class="alb-sr">' + m.name + '</strong><span>' +
      (n === TOTAL ? 'Все 9 собраны — квест пройден! Вас ждёт книга в подарок' : 'Добавлен в ваши артефакты') + '</span></div>');
    pop.setAttribute('role', 'status');
    pop.addEventListener('click', function () { hide(); openBook(); });
    document.body.appendChild(pop);
    current = { id: id, pop: pop };
    confetti(pop);
    var t = setTimeout(hide, n === TOTAL ? 4200 : 2800);
    function hide() {
      clearTimeout(t);
      if (pop.classList.contains('is-out') || !pop.isConnected) return;
      pop.classList.add('is-out'); current = null;
      setTimeout(function () { pop.remove(); showing = false; firstHint(); next(); }, 420);
    }
  }
  function confetti(anchor) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = anchor.getBoundingClientRect(), cols = ['#F5C451', '#C4432D', '#6E9E6F', '#E9B23F', '#F2994A', '#8A4F7D'];
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, N = 34;
    for (var i = 0; i < N; i++) {
      var b = el('i', 'alb-bit'), a = (i / N) * Math.PI * 2 + Math.random() * .3, d = 140 + Math.random() * 160;
      b.style.left = cx + 'px'; b.style.top = cy + 'px';
      b.style.background = cols[i % cols.length];
      b.style.borderRadius = i % 3 ? '50%' : '2px';
      b.style.width = b.style.height = (7 + Math.random() * 7) + 'px';
      b.style.setProperty('--dx', (Math.cos(a) * d) + 'px');
      b.style.setProperty('--dy', (Math.sin(a) * d) + 'px');
      b.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg');
      b.style.animationDelay = '.18s';
      document.body.appendChild(b);
      setTimeout(b.remove.bind(b), 1500);
    }
  }

  // ── Альбом ──
  function buildBook() {
    book = el('div', 'alb');
    book.hidden = true;
    book.setAttribute('role', 'dialog'); book.setAttribute('aria-modal', 'true'); book.setAttribute('aria-label', 'Мои артефакты');
    book.addEventListener('click', function (e) {
      if (e.target === book || e.target.closest('.alb-x')) return closeBook();
      var act = e.target.closest('[data-alb-act]');
      if (act) { e.preventDefault(); doAct(act.getAttribute('data-alb-act'), act); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !book.hidden) closeBook(); });
    document.body.appendChild(book);
  }
  function renderBook() {
    var n = count(), h = '';
    h += '<div class="alb-book"><button class="alb-x" type="button" aria-label="Закрыть">×</button>';
    h += '<h2 class="alb-h">Мои артефакты</h2>';
    h += '<p class="alb-sub">' + (full() ? 'Квест пройден: все 9 артефактов собраны! Спасибо, что прошли путь до конца.' :
      'Квест: за каждый шаг — артефакт, на сайте и в боте. Соберите все ' + TOTAL + ' — и Люба подарит вам книгу.') + '</p>';
    h += '<div class="alb-bar"><i style="width:' + (n / TOTAL * 100) + '%"></i></div>';
    h += '<p class="alb-sub" style="margin:0">' + n + ' из ' + TOTAL + '</p>';
    ROWS.forEach(function (row) {
      h += '<div class="alb-row">' + row[0] + '</div><div class="alb-grid">';
      LIST.slice(row[1], row[1] + 3).forEach(function (m, i) {
        var on = !!got[m.id];
        h += '<div class="alb-it ' + (on ? 'is-on' : 'is-off') + (on && fresh[m.id] ? ' is-new' : '') + '" style="--tilt:' + ([-4, 3, -2][i]) + 'deg">' +
          '<div class="pic"><img src="' + card(m) + '" alt="" loading="lazy"></div><b>' + m.name + '</b>';
        if (!on) {
          h += '<em>' + m.hint + '</em>';
          if (m.act) h += '<a class="alb-go" href="#" data-alb-act="' + m.act + '">' + m.go[1] + '</a>' +
            (m.id === 'drug' && FBT.refLink && FBT.refLink() ? ' <a class="alb-go alb-go--soft" href="#" data-alb-act="copy">Скопировать ссылку</a>' : '');
          else if (m.go && location.pathname.split('/').pop() !== m.go[0].split('#')[0]) h += '<a class="alb-go" href="' + m.go[0] + '">' + m.go[1] + '</a>';
        }
        h += '</div>';
      });
      h += '</div>';
    });
    if (full()) {
      h += '<div class="alb-gift is-open"><img class="alb-book-img" src="' + BOOK + '" alt="Книга «Десять заповедей для предпринимателей»"><div><b>Ваш подарок: книга Марио Брюльмана «Десять заповедей для предпринимателей»</b>' +
        '<p>Печатная, на русском. Напишите Александру — он расскажет, как получить книгу. Заберите её у нас сами или закажите доставку (доставку оплачиваете вы).</p>' +
        '<a class="alb-go" href="#" data-alb-act="book">Забрать книгу</a></div></div>';
    } else {
      h += '<div class="alb-gift"><img class="alb-book-img" src="' + BOOK + '" alt="Книга «Десять заповедей для предпринимателей»"><div><b>Подарок за все ' + TOTAL + ': книга Марио Брюльмана «Десять заповедей для предпринимателей»</b>' +
        '<p>Осталось собрать ' + (TOTAL - n) + '.</p></div></div>';
    }
    h += '<p class="alb-note">Артефакты общие для сайта и бота.</p></div>';
    book.innerHTML = h;
    fresh = {};
  }
  // Подсказка «За каждый шаг — наклейка» — один раз, сразу после первой наклейки
  function firstHint() {
    if (FBT.store.get('fbt_alb_seen', 0) || count() !== 1 || queue.length) return;
    FBT.store.set('fbt_alb_seen', 1);
    var hint = el('div', 'alb-hint', 'За каждый шаг — артефакт');
    document.body.appendChild(hint);
    setTimeout(function () { hint.remove(); }, 6000);
  }
  var lastFocus = null;
  function openBook() {
    lastFocus = document.activeElement;
    renderBook(); book.hidden = false; document.documentElement.style.overflow = 'hidden';
    var hint = document.querySelector('.alb-hint'); if (hint) hint.remove();
    FBT.store.set('fbt_alb_seen', 1);
    book.querySelector('.alb-x').focus();
  }
  function closeBook() {
    book.hidden = true; document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // ── Действия из альбома ──
  // «Позвать друга»: личная ссылка на бота — та же, что бот присылает в чате (start=ref_<id>).
  // Сайт знает её после входа через бота (FBT.refLink из /api/session). Без входа — бот сам пришлёт ссылку (start=invite).
  // Артефакт по клику НЕ даём: его засчитывает бот, когда друг нажмёт «Старт», и сайт подтягивает его при сверке.
  var SHARE_TEXT = 'Посмотри видеоразбор Любы Бэй — как создать устойчивый семейный бизнес в Узбекистане. Открывается в Telegram:';
  FBT.invite = function () {
    var ref = FBT.refLink && FBT.refLink();
    if (!ref) {                                   // ещё не знакомы с ботом — бот пришлёт личную ссылку
      if (FBT.linked()) { FBT.event('bot_start', { start: 'invite' }); FBT.open(FBT.bot('')); }
      else FBT.open(FBT.bot('invite'));
      return;
    }
    if (navigator.share) { navigator.share({ title: 'FBT Online', text: SHARE_TEXT, url: ref }).catch(function () {}); return; }
    FBT.open('https://t.me/share/url?url=' + encodeURIComponent(ref) + '&text=' + encodeURIComponent(SHARE_TEXT));
  };
  function copyRef(btn) {
    var ref = FBT.refLink && FBT.refLink(); if (!ref) return;
    var ok = function () { btn.textContent = 'Скопировано ✓'; setTimeout(function () { btn.textContent = 'Скопировать ссылку'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(ref).then(ok, function () { window.prompt('Ваша ссылка:', ref); });
    else window.prompt('Ваша ссылка:', ref);
  }
  function doAct(a, btn) {
    if (a === 'channel') { FBT.open('https://t.me/' + (M.channel || 'fbt_ru')); FBT.medal('dom'); return; }
    if (a === 'share') { FBT.invite(); return; }
    if (a === 'copy') { copyRef(btn); return; }
    if (a === 'book' && full()) {
      FBT.open(FBT.tg(C.curator, 'Здравствуйте! Я собрал(а) все 9 артефактов FBT и хочу забрать книгу «Десять заповедей для предпринимателей».\nКак получу: доставка / заберу сам(а)'));
    }
  }

  // ── Автоматика: ссылки на канал, ссылка-наклейка от куратора, то, что уже сделано раньше ──
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="t.me/' + (M.channel || 'fbt_ru') + '"]');
    if (a) FBT.medal('dom');
  }, true);

  // Кнопки на страницах: data-invite — «Позвать друга», data-album — открыть «Мои артефакты»
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-invite],[data-album]');
    if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('data-invite')) FBT.invite(); else openBook();
  });

  document.addEventListener('DOMContentLoaded', function () {
    var codes = M.codes || {}, q = new URLSearchParams(location.search).get('m');
    if (q) Object.keys(codes).forEach(function (id) { if (codes[id] && codes[id] === q) FBT.medal(id); });
    if (FBT.gotMap()) FBT.medal('karta', true);

    // Наклейки, которые не успели показать в прошлый раз
    (FBT.store.get('fbt_medals_pending') || []).forEach(function (id) { if (got[id] && queue.indexOf(id) < 0) queue.push(id); });
    buildFab(); buildBook(); ready = true;
    setTimeout(function () { LIST.forEach(function (m) { (new Image()).src = card(m); }); }, 2500);   // карточки — заранее, чтобы всплывали сразу
    setTimeout(next, 900);
  });
})();
