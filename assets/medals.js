/* FBT Online — «Семейный альбом»: 9 наклеек за шаги воронки и подарок за полный альбом.
   Выдать наклейку из любого скрипта: FBT.medal('karta').
   Хранится в браузере (fbt_medals); при сервере бота — событие 'medal' уходит в бот.
   Ссылка-наклейка от куратора: <сайт>/?m=<код из config.js → medals.codes>. */
(function () {
  var FBT = window.FBT; if (!FBT) return;
  var C = FBT.cfg, M = C.medals || {};
  var IMG = 'assets/medals/';

  var LIST = [
    { id: 'shag',   img: '01-shag',   name: 'Первый шаг',        hint: 'Досмотрите урок Любы до конца', go: ['index.html', 'К уроку'] },
    { id: 'karta',  img: '02-karta',  name: 'Карта сокровищ',    hint: 'Заберите карту действий', go: ['karta.html', 'Забрать карту'] },
    { id: 'dom',    img: '03-dom',    name: 'В кругу своих',     hint: 'Подпишитесь на канал FBT', act: 'channel', go: [null, 'Открыть канал'] },
    { id: 'kompas', img: '04-kompas', name: 'Компас в кармане',  hint: 'Ответьте на 10 вопросов диагностики', go: ['diagnostika.html', 'Пройти'] },
    { id: 'tetrad', img: '05-tetrad', name: 'Домашнее задание',  hint: 'Выполните все 5 заданий второй части', go: ['diagnostika.html#tasks', 'К заданиям'] },
    { id: 'pismo',  img: '06-pismo',  name: 'Письмо наставнику', hint: 'Отправьте разбор куратору', go: ['diagnostika.html', 'К диагностике'] },
    { id: 'drug',   img: '07-drug',   name: 'Друг семьи',        hint: 'Позовите друга на бесплатный урок', act: 'share', go: [null, 'Позвать друга'] },
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
    if (!quiet) { queue.push(id); if (ready) next(); }
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
    fab.querySelector('img').src = IMG + (full() ? 'gift-book.svg' : (n ? LIST.filter(function (m) { return got[m.id]; }).sort(function (a, b) { return got[b.id] - got[a.id]; })[0].img + '.svg' : 'gift-box.svg'));
    fab.setAttribute('aria-label', 'Семейный альбом: ' + n + ' из ' + TOTAL + ' наклеек');
    if (bump) { fab.classList.remove('is-bump'); void fab.offsetWidth; fab.classList.add('is-bump'); }
  }

  // ── Всплывашка ──
  function next() {
    if (showing || !queue.length) return;
    showing = true;
    var m = byId[queue.shift()], n = count();
    var pop = el('div', 'alb-pop',
      '<img src="' + IMG + m.img + '.svg" alt="">' +
      '<div><small>Новая наклейка · ' + n + ' из ' + TOTAL + '</small><strong>' + m.name + '</strong><span>' +
      (n === TOTAL ? 'Альбом собран — вас ждёт подарок от Любы' : 'Наклеили в ваш семейный альбом') + '</span></div>');
    pop.setAttribute('role', 'status');
    pop.addEventListener('click', function () { hide(); openBook(); });
    document.body.appendChild(pop);
    confetti(pop);
    var t = setTimeout(hide, n === TOTAL ? 3600 : 1900);
    function hide() {
      clearTimeout(t);
      if (pop.classList.contains('is-out')) return;
      pop.classList.add('is-out');
      setTimeout(function () { pop.remove(); showing = false; firstHint(); next(); }, 420);
    }
  }
  function confetti(anchor) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = anchor.getBoundingClientRect(), cols = ['#F5C451', '#C4432D', '#6DBB87', '#4FA3E3', '#F2994A', '#8B6CF6'];
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
    book.setAttribute('role', 'dialog'); book.setAttribute('aria-modal', 'true'); book.setAttribute('aria-label', 'Семейный альбом');
    book.addEventListener('click', function (e) {
      if (e.target === book || e.target.closest('.alb-x')) return closeBook();
      var act = e.target.closest('[data-alb-act]');
      if (act) { e.preventDefault(); doAct(act.getAttribute('data-alb-act')); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !book.hidden) closeBook(); });
    document.body.appendChild(book);
  }
  function renderBook() {
    var n = count(), h = '';
    h += '<div class="alb-book"><button class="alb-x" type="button" aria-label="Закрыть">×</button>';
    h += '<h2 class="alb-h">Семейный альбом</h2>';
    h += '<p class="alb-sub">' + (full() ? 'Все 9 наклеек собраны. Спасибо, что прошли путь до конца!' :
      'За каждый шаг — наклейка. Соберите все ' + TOTAL + ' — и получите подарок от Любы.') + '</p>';
    h += '<div class="alb-bar"><i style="width:' + (n / TOTAL * 100) + '%"></i></div>';
    h += '<p class="alb-sub" style="margin:0">' + n + ' из ' + TOTAL + '</p>';
    ROWS.forEach(function (row) {
      h += '<div class="alb-row">' + row[0] + '</div><div class="alb-grid">';
      LIST.slice(row[1], row[1] + 3).forEach(function (m, i) {
        var on = !!got[m.id];
        h += '<div class="alb-it ' + (on ? 'is-on' : 'is-off') + (on && fresh[m.id] ? ' is-new' : '') + '" style="--tilt:' + ([-4, 3, -2][i]) + 'deg">' +
          '<div class="pic"><img src="' + IMG + m.img + '.svg" alt=""></div><b>' + m.name + '</b>';
        if (!on) {
          h += '<em>' + m.hint + '</em>';
          if (m.act) h += '<a class="alb-go" href="#" data-alb-act="' + m.act + '">' + m.go[1] + '</a>';
          else if (m.go && location.pathname.split('/').pop() !== m.go[0].split('#')[0]) h += '<a class="alb-go" href="' + m.go[0] + '">' + m.go[1] + '</a>';
        }
        h += '</div>';
      });
      h += '</div>';
    });
    if (full()) {
      h += '<div class="alb-gift is-open"><img src="' + IMG + 'gift-book.svg" alt=""><div><b>Подарок: книга «10 заповедей предпринимателя»</b>' +
        '<p>На русском или узбекском — выберите сами. Напишите куратору: он сверит альбом с вашей перепиской и расскажет, как получить книгу. Книга в подарок, доставку оплачиваете только вы — или заберите её сами.</p>' +
        '<a class="alb-go" href="#" data-alb-act="book">Забрать книгу</a></div></div>';
    } else {
      h += '<div class="alb-gift"><img src="' + IMG + 'gift-box.svg" alt=""><div><b>Подарок-сюрприз</b>' +
        '<p>Откроется, когда в альбоме будут все ' + TOTAL + ' наклеек. Осталось ' + (TOTAL - n) + '.</p></div></div>';
    }
    h += '<p class="alb-note">Наклейки хранятся в этом браузере.</p></div>';
    book.innerHTML = h;
    fresh = {};
  }
  // Подсказка «За каждый шаг — наклейка» — один раз, сразу после первой наклейки
  function firstHint() {
    if (FBT.store.get('fbt_alb_seen', 0) || count() !== 1 || queue.length) return;
    FBT.store.set('fbt_alb_seen', 1);
    var hint = el('div', 'alb-hint', 'За каждый шаг — наклейка');
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
  function inviteUrl() { return location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html?s=friend'; }
  function doAct(a) {
    if (a === 'channel') { FBT.open('https://t.me/' + (M.channel || 'fbt_ru')); FBT.medal('dom'); return; }
    if (a === 'share') {
      var url = inviteUrl(), text = 'Смотри, бесплатный урок Любы Бэй — как выстроить системный бизнес:';
      var done = function () { FBT.medal('drug'); };
      if (navigator.share) { navigator.share({ title: 'FBT Online', text: text, url: url }).then(done).catch(function () {}); return; }
      FBT.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text)); done(); return;
    }
    if (a === 'book' && full()) {
      FBT.open(FBT.tg(C.curator, 'Здравствуйте! Я собрал(а) все 9 наклеек в семейном альбоме FBT и хочу забрать книгу «10 заповедей предпринимателя».\nЯзык: русский / узбекский\nКак получу: доставка / заберу сам(а)'));
    }
  }

  // ── Автоматика: ссылки на канал, ссылка-наклейка от куратора, то, что уже сделано раньше ──
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="t.me/' + (M.channel || 'fbt_ru') + '"]');
    if (a) FBT.medal('dom');
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    var codes = M.codes || {}, q = new URLSearchParams(location.search).get('m');
    if (q) Object.keys(codes).forEach(function (id) { if (codes[id] && codes[id] === q) FBT.medal(id); });
    if (FBT.gotMap()) FBT.medal('karta', true);

    buildFab(); buildBook(); ready = true;
    setTimeout(next, 600);
  });
})();
