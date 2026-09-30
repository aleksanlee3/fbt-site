/* Стр. 4 · Программа FBT: цены ранней записи по дате, отсчёт, семейная скидка, модули, FAQ, заявка */
(function () {
  var C = FBT.cfg;
  var qs = new URLSearchParams(location.search);

  // ── Цены 3-го потока (решение 30.09): 4 ступени по неделе от 13.09, +25 $ каждая, курс 12 000 сум ──
  // Старт 10 октября, цена 800 $ действует и в этот день; с 11 октября запись закрыта.
  // Семейная скидка — в долларах каждому (d): вдвоём −25, втроём −50, от четырёх −75. Суммируется с ранней записью.
  var DAY = 86400000;
  function tzDate(y, m, d) { return Date.UTC(y, m - 1, d) - 5 * 3600000; }   // полночь по Ташкенту
  var RATE = 12000;
  var PREV_START = tzDate(2026, 9, 13);
  var START = tzDate(2026, 10, 11);
  var PRICES = [725, 750, 775, 800];
  var LAST = PRICES.length - 1;
  var NEXT_FULL = 850;
  var BOUNDS = [1, 2, 3].map(function (k) { return PREV_START + k * 7 * DAY; });   // 20.09, 27.09, 04.10
  var RANGES = ['13 — 19 сентября', '20 — 26 сентября', '27 сентября — 3 октября', '4 — 10 октября'];
  var ENDS = ['20 сентября', '27 сентября', '4 октября', '10 октября'];       // с какого дня новая цена / старт
  var LASTDAY = ['19 сентября', '26 сентября', '3 октября', '10 октября'];   // последний день текущей цены
  var GROUP = [{ label: '1', n: 1, d: 0 }, { label: '2', n: 2, d: 25 }, { label: '3', n: 3, d: 50 }, { label: '4+', n: 4, d: 75 }];
  var fmt = FBT.fmt;

  // Для проверки: ?date=2026-10-20 или ?date=2026-11-20 — показать страницу на эту дату
  var fake = qs.get('date') ? Date.parse(qs.get('date') + 'T12:00:00+05:00') : NaN;
  var offset = isNaN(fake) ? 0 : fake - Date.now();
  function now() { return Date.now() + offset; }

  var seatsLeft = Math.max(0, Math.min(12, parseInt(C.seatsLeft, 10) || 0));
  var full = seatsLeft === 0;

  var saved = FBT.store.get('fbt_p4', {}) || {};
  var st = {
    mod: typeof saved.mod === 'number' ? saved.mod : 0,
    faq: saved.faq === undefined ? 0 : saved.faq,
    ap: Object.assign({ name: '', phone: '', task: '', sit: null, agree: false, group: 0 }, saved.ap || {}),
    sent: !!saved.sent
  };
  function save() { FBT.store.set('fbt_p4', { mod: st.mod, faq: st.faq, ap: st.ap, sent: st.sent }); }

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function setV(key, val) { $$('[data-v="' + key + '"]').forEach(function (e) { e.textContent = val; }); }

  function pricing() {
    var t = now(), started = t >= START;
    var tier = Math.min(LAST, BOUNDS.filter(function (b) { return t >= b; }).length);
    var tierEnd = tier < LAST ? BOUNDS[tier] : START;
    var left = Math.max(0, tierEnd - t);
    var priceSum = PRICES[tier] * RATE;
    var g = GROUP[Math.max(0, Math.min(GROUP.length - 1, Number(st.ap.group) || 0))];
    var per = (PRICES[tier] - g.d) * RATE, total = per * g.n;
    return { started: started, tier: tier, left: left, priceSum: priceSum, g: g, per: per, total: total };
  }

  function ctaLabels(p) {
    return {
      cta: p.started ? 'В лист ожидания 2027' : (full ? 'В лист ожидания' : 'Забронировать место'),
      ctaLong: p.started ? 'Записаться в лист ожидания 2027' : (full ? 'Записаться в лист ожидания' : 'Забронировать место'),
      ctaShort: (p.started || full) ? 'Лист ожидания' : 'Записаться'
    };
  }

  function renderTick() {
    var p = pricing(), L = p.left, pad = function (n) { return String(n).padStart(2, '0'); };
    var d = Math.floor(L / DAY), h = pad(Math.floor(L / 3600000) % 24), m = pad(Math.floor(L / 60000) % 60), s = pad(Math.floor(L / 1000) % 60);
    setV('cdD', String(d)); setV('cdH', h); setV('cdM', m); setV('cdS', s);
    setV('cdShort', d + ' дн ' + h + ' ч ' + m + ' мин');
    $$('[role="timer"]').forEach(function (e) { e.setAttribute('aria-label', (p.tier < LAST ? 'До повышения цены ' : 'До старта ') + d + ' дней ' + h + ' часов ' + m + ' минут'); });
  }

  function renderPrices() {
    var p = pricing(), labels = ctaLabels(p);
    FBT.toggle({ open: !p.started, closed: p.started, multi: p.g.n > 1 });
    setV('priceNow', fmt(p.priceSum)); setV('usdNow', '$' + PRICES[p.tier]); setV('priceFull', fmt(PRICES[LAST] * RATE));
    setV('nextFull', fmt(NEXT_FULL * RATE));
    setV('tierEnd', LASTDAY[p.tier]); setV('tierEndUp', LASTDAY[p.tier].toUpperCase());
    setV('cdTitle', p.tier < LAST ? 'До повышения цены' : 'До старта');
    setV('cdLower', p.tier < LAST ? 'цена вырастет через' : 'до старта');
    setV('riseText', p.tier < LAST ? ENDS[p.tier] + ' цена станет ' + fmt(PRICES[p.tier + 1] * RATE) + ' сум' : 'следующий поток — ' + fmt(NEXT_FULL * RATE) + ' сум');
    setV('chip', p.started ? 'Набор закрыт' : (full ? 'Мест нет' : 'Набор открыт'));
    // «Осталось N» показываем, когда занято хотя бы 3 места; до этого — просто «12 мест» (30.09)
    var fewLeft = seatsLeft <= 9;
    setV('seatsText', p.started ? 'поток уже идёт' : (full ? 'мест не осталось' : (fewLeft ? 'осталось ' + seatsLeft + ' ' + FBT.plural(seatsLeft, 'место', 'места', 'мест') + ' из 12' : 'всего 12 мест')));
    setV('seatsShort', p.started ? 'поток идёт' : (full ? 'мест нет' : (fewLeft ? 'осталось ' + seatsLeft + ' из 12' : '12 мест')));
    setV('cta', labels.cta); setV('ctaLong', labels.ctaLong); setV('ctaShort', labels.ctaShort);
    setV('per', fmt(p.per)); setV('total', fmt(p.total)); setV('prepay', fmt(p.total * 0.2));
    setV('groupLabel', p.g.n === 1 ? 'Один участник' : (p.g.label === '4+' ? 'От 4 человек, −$' + p.g.d + ' каждому' : p.g.n + ' человека, −$' + p.g.d + ' каждому'));

    // Было / сейчас / будет — одним простым блоком (30.09)
    var cells = [];
    if (p.tier > 0) cells.push('<div class="s3 past"><span class="s3-l">Было на прошлой неделе</span><b><s>' + fmt(PRICES[p.tier - 1] * RATE) + '</s></b><span class="s3-u">сум · $' + PRICES[p.tier - 1] + '</span></div>');
    cells.push('<div class="s3 cur"><span class="s3-l">Сейчас · до ' + LASTDAY[p.tier] + '</span><b>' + fmt(PRICES[p.tier] * RATE) + '</b><span class="s3-u">сум · $' + PRICES[p.tier] + '</span></div>');
    if (p.tier < LAST) cells.push('<div class="s3 next"><span class="s3-l">С ' + ENDS[p.tier] + '</span><b>' + fmt(PRICES[p.tier + 1] * RATE) + '</b><span class="s3-u">сум · $' + PRICES[p.tier + 1] + ' ↑</span></div>');
    else cells.push('<div class="s3 next"><span class="s3-l">Следующий поток · 2027</span><b>' + fmt(NEXT_FULL * RATE) + '</b><span class="s3-u">сум · $' + NEXT_FULL + ' ↑</span></div>');
    $('[data-steps3]').innerHTML = cells.join('');
    var fullSum = PRICES[LAST] * RATE;
    setV('offPct', String(Math.round((1 - p.per / fullSum) * 1000) / 10).replace('.', ','));
    setV('saveSum', fmt(fullSum - p.per)); setV('saveWho', p.g.n > 1 ? 'каждому' : '');

    var bar = '', boxes = '';
    for (var i = 0; i < 12; i++) {
      var free = i < seatsLeft && !p.started;
      bar += '<span class="' + (free ? 'on' : '') + '"></span>';
      boxes += '<span class="' + (free ? 'on' : '') + '"><svg><use href="#i-seat"/></svg></span>';
    }
    $('[data-seatbar]').innerHTML = bar; $('[data-seatboxes]').innerHTML = boxes;

    $$('[data-grp]').forEach(function (box) {
      var small = box.getAttribute('data-grp') === 'form';
      box.innerHTML = '';
      GROUP.forEach(function (o, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === (Number(st.ap.group) || 0) ? 'true' : 'false');
        b.setAttribute('aria-label', o.label + (o.n === 1 ? ' участник' : ' участника') + (o.d ? ', скидка ' + o.d + ' долларов каждому' : ''));
        b.innerHTML = '<span>' + o.label + '</span>' + (small ? '' : '<small>' + (o.d ? '−$' + o.d : 'без скидки') + '</small>');
        b.addEventListener('click', function () { st.ap.group = i; save(); renderPrices(); });
        box.appendChild(b);
      });
    });
    renderTick();
  }

  // ── Модули ──────────────────────────────────────────────
  var MODS = [
    { n: '01', name: 'Бизнес-модель', sub: 'Мышление и модель бизнеса', full: 'Предпринимательское мышление и бизнес-модель',
      q: 'На чём на самом деле держится ваш бизнес?',
      topics: ['Мышление собственника', 'SWOT-анализ', 'Риски', 'Клиент и рынок', 'Ценностное предложение', '10 вопросов бизнес-модели'],
      result: 'Понятная модель бизнеса, SWOT-анализ и ключевые факторы успеха вашей компании.' },
    { n: '02', name: 'Маркетинг', sub: 'Стратегия и тактика', full: 'Маркетинговая стратегия и тактика',
      q: 'Кому вы продаёте — и почему должны выбрать именно вас?',
      topics: ['Рынок и конкуренты', 'Целевая аудитория', 'Продуктовая линейка', 'Позиционирование', 'Каналы привлечения', 'Маркетинг-микс'],
      result: 'Портрет клиента, картина конкурентов и логика продвижения — вместо решений «на ощупь».' },
    { n: '03', name: 'Финансы', sub: 'Управление деньгами', full: 'Управление финансами',
      q: 'Вы зарабатываете деньги или просто видите оборот?',
      topics: ['Цена и юнит-экономика', 'Точка безубыточности', 'Движение денег', 'P&L и баланс', 'Финансовые риски', 'Резервы'],
      result: 'Прозрачная картина: где бизнес зарабатывает, где теряет, и деньги семьи отдельно от денег бизнеса.' },
    { n: '04', name: 'Время', sub: 'Управление временем и жизнью', full: 'Управление временем и жизнью',
      q: 'Что действительно должен делать собственник?',
      topics: ['Приоритеты', 'Баланс сфер жизни', 'Полезные привычки', 'Принцип Парето', 'Матрица Эйзенхауэра'],
      result: 'Система приоритетов, в которой есть время не только на операционку, но и на развитие бизнеса и семью.' },
    { n: '05', name: 'Люди', sub: 'Лидерство и взаимоотношения', full: 'Лидерство и взаимоотношения',
      q: 'Как перестать быть главным исполнителем в своей компании?',
      topics: ['Делегирование', 'Роли и ответственность', 'Стили поведения', 'Коммуникация', 'Работа со стрессом', 'Команда и партнёры'],
      result: 'Понятные зоны ответственности, общий язык с партнёрами и команда, которой не нужен постоянный контроль.' }
  ];
  var tabs = $('[data-tabs]'), zero = tabs.querySelector('.mod-zero');
  var path = $('[data-path]');
  MODS.forEach(function (m, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mod-tab'; b.setAttribute('role', 'tab');
    b.innerHTML = '<span class="mt-n mono">' + m.n + '</span><span class="mt-t"><b>' + m.name + '</b><span>' + m.sub + '</span></span>';
    b.addEventListener('click', function () { st.mod = i; renderMod(); });
    tabs.insertBefore(b, zero);
    var d = document.createElement('button');
    d.type = 'button'; d.className = 'pdot mono'; d.textContent = m.n; d.setAttribute('aria-label', 'Модуль ' + m.n + ': ' + m.name);
    d.addEventListener('click', function () { st.mod = i; renderMod(); });
    path.appendChild(d);
    if (i < MODS.length - 1) path.appendChild(document.createElement('i'));
  });
  function renderMod() {
    var i = Math.max(0, Math.min(4, st.mod)), m = MODS[i];
    $$('.mod-tab').forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    $$('.pdot').forEach(function (b, k) { b.classList.toggle('on', k === i); });
    $('[data-m="n"]').textContent = 'МОДУЛЬ ' + m.n;
    $('[data-m="q"]').textContent = m.q;
    $('[data-m="full"]').textContent = m.full;
    $('[data-m="topics"]').innerHTML = m.topics.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    $('[data-m="result"]').textContent = m.result;
    $('[data-m="pos"]').textContent = m.n + ' / 05';
    $('[data-mod-prev]').disabled = i === 0;
    $('[data-mod-next]').textContent = i === 4 ? 'К первому модулю' : 'Следующий модуль →';
    save();
  }
  $('[data-mod-prev]').addEventListener('click', function () { st.mod = Math.max(0, st.mod - 1); renderMod(); });
  $('[data-mod-next]').addEventListener('click', function () { st.mod = (st.mod + 1) % 5; renderMod(); });

  // ── FAQ ─────────────────────────────────────────────────
  function faqData() {
    var p = pricing();
    return [
      ['У меня ещё нет бизнеса. Мне подойдёт?', 'Да. В начале есть бонусный модуль: как найти идею для бизнеса. Потом вы проверите идею и посчитаете, сколько нужно денег, — ещё до того, как вложитесь.'],
      ['У меня уже есть бизнес. Мне подойдёт?', 'Да. Все задания вы делаете на своём бизнесе: считаете свои деньги, ищете своих клиентов, раздаёте задачи своей команде.'],
      ['Это просто видеокурс?', 'Нет. Уроки — в видео, но рядом с вами наставник. Он проверяет каждое задание и созванивается с вами каждую неделю.'],
      ['У меня мало времени. Я успею?', 'Нужно 3–4 часа в неделю. Уроки в записи — смотрите, когда удобно: вечером или в дороге. А задания — это ваши же рабочие дела, только по порядку.'],
      ['Я уже учился на курсах. Чем это другое?', 'На курсе вы слушаете. Здесь вы делаете: каждое задание — на своём бизнесе, и наставник проверяет, что получилось.'],
      ['Зачем столько тем сразу?', 'Потому что в бизнесе всё связано. Нет клиентов — нет денег. Нет денег — не наймёте людей. Нет людей — всё делаете сами. Поэтому разбираем всё вместе.'],
      ['Можно прийти с мужем, женой или партнёром?', 'Да, и так дешевле. Вдвоём — каждому минус $25, втроём — минус $50, вчетвером и больше — минус $75. Эта скидка добавляется к ранней цене.'],
      ['Как закрепить за собой цену?', 'Внесите предоплату 20%. Сейчас для одного человека это ' + fmt(p.priceSum * 0.2) + ' сум. После этого цена ваша, даже если потом она вырастет. Остальное — до старта.'],
      ['А если до старта что-то изменится?', 'Бывает. Просто напишите нам — решим вопрос лично, в минусе вы не останетесь.'],
      ['Как понять, подходит ли мне программа?', 'Пройдите бесплатную диагностику — это 5 минут. Или оставьте заявку: мы поговорим и честно скажем, подойдёт вам или нет.']
    ];
  }
  function renderFaq() {
    var box = $('[data-faq]'); box.innerHTML = '';
    faqData().forEach(function (f, i) {
      var open = st.faq === i;
      var item = document.createElement('div'); item.className = 'fq' + (open ? ' open' : '');
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.innerHTML = '<span></span><i aria-hidden="true">' + (open ? '−' : '+') + '</i>';
      b.firstChild.textContent = f[0];
      b.addEventListener('click', function () { st.faq = open ? null : i; save(); renderFaq(); });
      item.appendChild(b);
      if (open) { var p = document.createElement('p'); p.textContent = f[1]; item.appendChild(p); }
      box.appendChild(item);
    });
  }

  // ── Заявка: открываем чат с нами в Telegram с готовым текстом ──
  var SITS = ['Пока только идея', 'Бизнес уже работает', 'Бизнес растёт'];
  function renderSits() {
    var box = $('[data-sits]'); box.innerHTML = '';
    SITS.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sit'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', st.ap.sit === i ? 'true' : 'false');
      b.textContent = t;
      b.addEventListener('click', function () { st.ap.sit = i; save(); renderSits(); });
      box.appendChild(b);
    });
  }
  $$('[data-ap]').forEach(function (inp) {
    var k = inp.getAttribute('data-ap');
    inp.value = st.ap[k] || '';
    inp.addEventListener('input', function () { st.ap[k] = inp.value; $('[data-ap-err]').hidden = true; save(); });
  });
  var agree = $('[data-agree]');
  function renderAgree() { agree.setAttribute('aria-checked', st.ap.agree ? 'true' : 'false'); agree.querySelector('.box').textContent = st.ap.agree ? '✓' : ''; }
  agree.addEventListener('click', function () { st.ap.agree = !st.ap.agree; $('[data-ap-err]').hidden = true; save(); renderAgree(); });

  function applyText() {
    var p = pricing(), a = st.ap;
    var lines = [
      p.started ? 'Здравствуйте! Хочу в лист ожидания 4-го потока FBT Online.' : 'Здравствуйте! Хочу забронировать место в 3-м потоке FBT Online (старт 10 октября).',
      '',
      'Имя: ' + a.name.trim(),
      'Телефон: ' + a.phone.trim()
    ];
    if (a.sit != null) lines.push('Где я сейчас: ' + SITS[a.sit].toLowerCase());
    lines.push('Участников: ' + p.g.label + (p.g.d ? ' (скидка −$' + p.g.d + ' каждому)' : ''));
    if (!p.started) lines.push('Цена на участника: ' + fmt(p.per) + ' сум · предоплата 20%: ' + fmt(p.total * 0.2) + ' сум');
    if (a.task.trim()) lines.push('Главная задача: ' + a.task.trim());
    return lines.join('\n');
  }
  function renderApply() {
    $('[data-apply-form]').hidden = st.sent;
    $('[data-apply-done]').hidden = !st.sent;
  }
  $('[data-apply-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var miss = [];
    if (!st.ap.name.trim()) miss.push('имя');
    if (!st.ap.phone.trim()) miss.push('телефон');
    var err = $('[data-ap-err]');
    if (miss.length || !st.ap.agree) {
      err.textContent = miss.length ? 'Заполните ' + miss.join(' и ') + ' — так мы сможем с вами связаться.' : 'Отметьте согласие на обработку данных.';
      err.hidden = false; return;
    }
    FBT.open(FBT.tg(C.curator, applyText()));
    st.sent = true; save(); renderApply();
    if (FBT.medal) FBT.medal('drevo');
  });
  $('[data-apply-reopen]').addEventListener('click', function (e) { e.preventDefault(); FBT.open(FBT.tg(C.curator, applyText())); });
  if (qs.has('reset')) { st.sent = false; save(); }

  // После старта потока «Записаться» ведёт в бот: лист ожидания
  function wireWaitlist() {
    var p = pricing();
    if (!p.started) return;
    $$('a[href="#apply"]').forEach(function (a) { a.href = FBT.bot('wait4'); a.target = '_blank'; a.rel = 'noopener'; });
  }

  renderPrices(); renderMod(); renderFaq(); renderSits(); renderAgree(); renderApply(); wireWaitlist();
  setInterval(function () {
    var before = pricing().tier;
    renderTick();
    if (pricing().tier !== before) renderPrices();
  }, 1000);
})();
