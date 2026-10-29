/* 29.10 v5.57: объяснения по ответам, честные статусы (аудит CJM). Стр. 3 · Онлайн-диагностика «Швейцарский компас»: 10 вопросов, уровень и тип профиля, главная точка, отправка куратору (13.10: без заданий) */
(function () {
  var C = FBT.cfg;
  var qs = new URLSearchParams(location.search);
  if (qs.has('reset')) FBT.store.set('fbt_diag', null);

  var DIRS = [
    { id: 'model', name: 'Бизнес-модель', color: '#F0625F', axis: 0, stop: 'Остановка 2 · Бизнес-модель',
      why: 'Пока сложно одной фразой сказать, кто ваш клиент и на чём бизнес зарабатывает. Без этого шаги в маркетинге и финансах дают случайный результат.',
      step: 'Закончите фразу «Я зарабатываю деньги, когда…»: кто платит, за что и когда.',
      cost: 'Пока модель неясна, деньги на рекламу и новые продукты уходят наугад — и часто не возвращаются.',
      fix: 'Это решаемо: этому посвящён модуль «Бизнес-модель» в программе FBT.' },
    { id: 'marketing', name: 'Маркетинг', color: '#F5C451', axis: 4, stop: 'Остановка 4 · Маркетинг',
      why: 'Клиенты приходят нерегулярно, и непонятно, какой способ привлечения можно повторить.',
      step: 'Опишите клиента, который уже купил, и канал, через который он к вам пришёл.',
      cost: 'Каждый месяц начинается с нуля: продажи зависят от случая и сарафана, их нельзя спланировать.',
      fix: 'Это решаемо: этому посвящён модуль «Маркетинг» в программе FBT.' },
    { id: 'finance', name: 'Финансы', color: '#2BB5A0', axis: 3, stop: 'Остановка 5 · Финансы',
      why: 'Нет ясности, сколько бизнес реально зарабатывает, а деньги семьи и бизнеса могут смешиваться.',
      step: 'Посчитайте, сколько остаётся с одного заказа и сколько заказов нужно, чтобы выйти в ноль.',
      cost: 'Пока неясно, сколько остаётся с заказа, рост оборота может приносить не прибыль, а кассовые разрывы.',
      fix: 'Это решаемо: этому посвящён модуль «Финансы» в программе FBT.' },
    { id: 'time', name: 'Время', color: '#8A4F7D', axis: 2, stop: 'Остановка 6 · Время',
      why: 'Текучка забирает почти всё время, и на развитие бизнеса его не остаётся.',
      step: 'Выпишите задачи недели и разложите их: сделать, запланировать, передать, убрать.',
      cost: 'Бизнес растёт ровно настолько, насколько хватает ваших часов, — а их уже не хватает, в том числе на семью.',
      fix: 'Это решаемо: этому посвящён модуль «Время» в программе FBT.' },
    { id: 'people', name: 'Лидерство', color: '#4FA3E3', axis: 1, stop: 'Остановка 7 · Люди',
      why: 'Роли и ответственность размыты, а сложные вопросы трудно обсуждать спокойно.',
      step: 'Дайте каждой роли владельца: кто делает, какой результат нужен и когда проверяете.',
      cost: 'Все решения возвращаются к вам, а напряжение в команде копится и тормозит рост.',
      fix: 'Это решаемо: этому посвящён модуль «Люди» в программе FBT.' }
  ];
  var QS = [
    [0, 'Я могу одним предложением сказать, кто мой клиент и за что он мне платит.'],
    [0, 'Я понимаю, на чём именно мой бизнес зарабатывает деньги.'],
    [1, 'Я точно знаю, кому продаю и какая проблема волнует этих людей.'],
    [1, 'Я знаю, откуда к нам приходят клиенты, и могу повторить этот способ.'],
    [2, 'Деньги семьи и деньги бизнеса у нас лежат отдельно.'],
    [2, 'Я знаю прибыль, расходы и сколько нужно продать, чтобы не уйти в минус.'],
    [3, 'У меня остаётся время не только на текучку, но и на развитие бизнеса.'],
    [3, 'Я умею выбирать главное и завершаю важные задачи.'],
    [4, 'Каждый в команде (и в семье, если она участвует) знает свою роль и за что отвечает.'],
    [4, 'С партнёрами, командой или семьёй мы спокойно обсуждаем сложные вопросы и принимаем решения.']
  ];
  // 29.10 (аудит R1): объяснение строим по тем ответам, которые человек дал сам, — вывод не должен противоречить ответу.
  // [что сказать при «Нет / Скорее нет», что сказать при «Частично»]
  var GAPS = [
    ['сложно одной фразой сказать, кто ваш клиент и за что он платит', 'не до конца ясно, кто ваш клиент и за что он платит'],
    ['непонятно, на чём именно бизнес зарабатывает', 'не до конца понятно, на чём именно бизнес зарабатывает'],
    ['неясно, кому вы продаёте и что волнует этих людей', 'не до конца ясно, кому вы продаёте и что волнует этих людей'],
    ['непонятно, откуда приходят клиенты и как повторить этот способ', 'не всегда понятно, откуда приходят клиенты и как повторить этот способ'],
    ['деньги семьи и бизнеса лежат вместе', 'деньги семьи и бизнеса разделены не до конца'],
    ['пока неясно, какая прибыль и сколько нужно продать, чтобы не уйти в минус', 'не до конца понятно, какая прибыль и сколько нужно продать, чтобы не уйти в минус'],
    ['текучка забирает почти всё время, на развитие его не остаётся', 'на развитие бизнеса остаётся мало времени'],
    ['трудно выбрать главное и довести важные задачи до конца', 'не всегда получается выбрать главное и довести важные задачи до конца'],
    ['не у каждого в команде понятна роль и ответственность', 'роли и ответственность договорены не у всех'],
    ['сложные вопросы трудно обсуждать спокойно', 'сложные вопросы обсуждать спокойно получается не всегда']
  ];
  // Слабые ответы направления: «Нет / Скорее нет» — всегда; «Частично» — если он самый низкий в паре
  function gapIdx(d) {
    var a = st.answers[2 * d], b = st.answers[2 * d + 1];
    var low = Math.min(a == null ? 9 : a, b == null ? 9 : b);
    return [2 * d, 2 * d + 1].filter(function (i) { var v = st.answers[i]; return v != null && (v <= 2 || (v === 3 && v === low)); });
  }
  function gapText(d) {
    var g = gapIdx(d).map(function (i) { return GAPS[i][st.answers[i] <= 2 ? 0 : 1]; });
    return g.join(', а также ');
  }
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
  function whyOf(d) { var g = gapText(d); return g ? 'Вы отметили, что ' + g + '.' : DIRS[d].why; }

  var SYMS = [['s1', 'Мало клиентов', 1], ['s2', 'Продажи скачут', 1], ['s3', 'Неясно, кому продаём', 1], ['s4', 'Не понимаем прибыль', 2],
    ['s5', 'Деньги смешаны', 2], ['s6', 'Все перегружены', 3], ['s7', 'Задачи зависают', 3], ['s8', 'Роли пересекаются', 4], ['s9', 'Часто спорим', 4]];
  // 07.10 (решение Александра, вариант A): 3 вопроса перед тестом — стадия, кто из семьи участвует, что мешает.
  var STAGES = [['one', 'У меня есть действующий бизнес'], ['launch', 'Я запускаю бизнес сейчас'], ['none', 'Бизнеса пока нет, но планирую начать']];
  var STAGE_CODE = { one: 'o', launch: 'l', none: 'n', many: 'o' };
  function familyOpts() {
    if (SEG && SEG.family) return SEG.family;               // 16.10: свой вопрос 2 у страницы сегмента
    return st.stage === 'none' ? [
      ['spouse', 'Планирую вести бизнес вместе с супругом / супругой'],
      ['relatives', 'Будут участвовать родители, дети, братья, сёстры или другие родственники'],
      ['want', 'Начну сам(а), но хочу вовлечь семью'],
      ['no', 'Семья в бизнесе участвовать не будет']] : [
      ['spouse', 'Я веду бизнес вместе с супругом / супругой'],
      ['relatives', 'В бизнесе участвуют родители, дети, братья, сёстры или другие родственники'],
      ['want', 'Сейчас бизнес веду я, но хочу вовлечь семью'],
      ['no', 'Семья в бизнесе не участвует']];
  }
  var PAINS = [
    ['self', 'Всё держится на мне', 'one launch'],
    ['system', 'Нет понятной системы и порядка', 'one launch'],
    ['roles', 'Сложно разделить роли между членами семьи', 'one launch none'],
    ['conflict', 'Возникают конфликты между семьёй и бизнесом', 'one launch none'],
    ['scale', 'Не понимаю, как масштабировать бизнес', 'one'],
    ['succession', 'Думаю о передаче бизнеса детям / следующему поколению', 'one'],
    ['start', 'Только начинаю и хочу сразу построить всё правильно', 'launch none']];
  function painOpts() { if (SEG && SEG.pains) return SEG.pains; return PAINS.filter(function (p) { return p[2].split(' ').indexOf(st.stage || 'one') >= 0; }); }
  function labelOf(list, key) { var f = list.filter(function (o) { return o[0] === key; })[0]; return f ? f[1] : ''; }
  var SQ_TITLES = ['Что лучше всего описывает вашу ситуацию сейчас?', 'Кто участвует в вашем бизнесе или будет участвовать?',
    'Что сейчас больше всего мешает вашему бизнесу двигаться дальше?'];
  // 15.10: копия диагностики для сегмента (diagnostika-posle-zapuska.html) задаёт свои заголовки; без SEG всё как раньше
  var SEG = window.FBT_SEG || null;
  if (SEG && SEG.sqTitles) SQ_TITLES = SEG.sqTitles;
  // Слова для задания 4. Ключ «буква:слово» нужен боту для PDF; человеку буквы и названия стилей не показываем.
  var WORDS = ['I:общительный', 'C:аналитичный', 'D:решительный', 'S:терпеливый', 'C:точный', 'S:надёжный',
    'D:прямой', 'I:вдохновляющий', 'S:командный игрок', 'D:соревновательный', 'C:любит правила', 'I:оптимистичный',
    'D:нетерпеливый', 'I:эмоциональный', 'S:избегает конфликтов', 'C:осторожный', 'S:лояльный', 'I:любит внимание',
    'C:критичный', 'D:требовательный', 'C:системный', 'D:нацелен на результат', 'S:спокойный', 'I:убедительный'];
  var DEMO = [5, 3, 3, 3, 3, 1, 3, 5, 5, 3];

  // ── Состояние (сохраняется в браузере) ─────────────────
  function fresh() {
    return { step: 'intro', qi: 0, answers: [null, null, null, null, null, null, null, null, null, null], stage: null, idea: null, family: null, pain: null, sq: 0, sym: {},
      tasks: { t1: '', t2: '', t3a: '', t3b: '', t4: '', disc: {}, t5: ['', '', '', '', ''], t5rank: [0, 0, 0, 0, 0] },
      pdf: false, sent1: false, sent2: false };
  }
  var st = Object.assign(fresh(), FBT.store.get('fbt_diag', null) || {});
  if (st.stage === 'many') st.stage = 'one';                 // старый вариант ответа (до 07.10)
  st.tasks = Object.assign(fresh().tasks, st.tasks || {});
  if (location.hash === '#tasks') st.step = 'tasks';          // ссылка из бота «Пройти вторую часть»
  function save() { FBT.store.set('fbt_diag', st); }

  // ── Расчёты ─────────────────────────────────────────────
  function scoresOf(ans) {
    return DIRS.map(function (d, i) {
      var v = [ans[2 * i], ans[2 * i + 1]].filter(function (x) { return x != null; });
      return v.length ? Math.min.apply(null, v) : 0;
    });
  }
  function calc() {
    var sc = scoresOf(st.answers);
    var min = Math.min.apply(null, sc);
    var weak = sc.indexOf(min);
    var perfect = min === 5;
    var complete = sc.every(function (s) { return s > 0; });
    var ties = DIRS.filter(function (d, i) { return sc[i] === min; }).map(function (d) { return d.name; });
    return { sc: sc, weak: weak, perfect: perfect, complete: complete, ties: ties };
  }
  // 13.10 (Александр): над профилем — уровень 1–5 и название профиля. Та же логика — в боте (fbt/diagnostic.py → archetype_key).
  var LEVELS = ['', 'Ручное управление', 'Первые опоры', 'Растущий бизнес', 'Крепкий бизнес', 'Устойчивый бизнес'];
  var ARCH = {
    system: ['Устойчивая система', 'Деньги посчитаны, клиенты приходят, роли понятны. Задача — сохранить это при росте.'],
    fresh: ['Бизнес с чистого листа', 'Бизнеса пока нет — значит, его можно сразу построить правильно.'],
    manual: ['Всё на ручном управлении', 'Пока почти всё держится на вас. Начать можно с одного шага — с главной точки.'],
    half: ['Всё работает наполовину', 'Явных провалов нет, но и сильных сторон тоже. Рост держится на ваших усилиях, а не на системе.'],
    owner: ['Всё держится на владельце', 'Время и люди — самые слабые места. Стоит вам выпасть на неделю — работа встаёт.'],
    no_profit: ['Продажи есть — прибыли не видно', 'Клиенты приходят, но сколько бизнес реально зарабатывает — неясно.'],
    no_clients: ['Деньги посчитаны — клиентов мало', 'С цифрами порядок, но клиенты приходят нерегулярно.'],
    idea: ['Хорошая идея без системы', 'Вы понимаете, на чём зарабатываете. Но маркетинг, деньги, время и люди пока на среднем уровне — бизнес растёт за счёт ваших усилий.'],
    no_hands: ['Клиенты есть — рук не хватает', 'Спрос есть, но время и команда не успевают за ним.'],
    one_gap: ['Сильный бизнес с одним провалом', 'Почти всё выстроено, но одно направление тянет вниз весь бизнес — {main}.'],
    almost: ['Почти система', 'Большая часть бизнеса уже работает без ручного управления. Осталось подтянуть одно-два направления.'],
    model: ['Непонятно, на чём зарабатываем', 'Сложно сказать, кто клиент и за что он платит. Из-за этого остальные усилия дают случайный результат.'],
    marketing: ['Клиенты приходят случайно', 'Продажи зависят от случая и сарафана, их нельзя спланировать.'],
    finance: ['Деньги без учёта', 'Неясно, сколько бизнес зарабатывает, а деньги семьи и бизнеса смешиваются.'],
    time: ['Владелец в текучке', 'Текучка забирает почти всё время, на развитие его не остаётся.'],
    people: ['Роли не договорены', 'Не ясно, кто за что отвечает, а сложные вопросы откладываются.'],
    base: ['Крепкая основа с узким местом', 'Основа есть, но рост упирается в одно направление — {main}.']
  };
  function levelOf() {
    var pts = st.answers.reduce(function (a, x) { return a + (x ? x - 1 : 0); }, 0);   // 27.10: нет 0 · скорее нет 1 · частично 2 · скорее да 3 · да 4 (0…40)
    return pts <= 8 ? 1 : pts <= 16 ? 2 : pts <= 24 ? 3 : pts <= 32 ? 4 : 5;
  }
  // 16.10 (Александр): уровень дробный — средний балл 10 ответов по шкале 1–5 (нет 1 · скорее нет 2 · частично 3 · скорее да 4 · да 5), один знак.
  // Название уровня — по целой части: 4,2 → «Крепкий бизнес».
  function levelScore() {
    var a = st.answers.filter(function (x) { return x != null; });
    if (!a.length) return 1;
    var v = a.reduce(function (s, x) { return s + x; }, 0) / a.length;
    return Math.round(v * 10) / 10;
  }
  function levelText(v) { return String(v.toFixed(1)).replace('.', ','); }
  function levelName(v) { return LEVELS[Math.max(1, Math.min(5, Math.floor(v)))]; }
  function archKey(sc) {
    var m = sc[0], k = sc[1], f = sc[2], t = sc[3], p = sc[4];
    // 27.10: шкала 1–5 — «сильно» = 4–5 (да / скорее да), «слабо» = 1–2 (нет / скорее нет), 3 — середина
    function H(x) { return x >= 4; } function L(x) { return x > 0 && x <= 2; }
    var hi = sc.filter(H).length, lo = sc.filter(L).length;
    if (hi === 5) return 'system';
    if (lo === 5) return st.stage === 'none' || st.stage === 'launch' ? 'fresh' : 'manual';
    if (hi === 0 && lo === 0) return 'half';
    if (L(t) && L(p)) return 'owner';
    if (H(k) && L(f)) return 'no_profit';
    if (H(f) && L(k)) return 'no_clients';
    if (H(m) && hi === 1 && lo === 0) return 'idea';
    if (H(k) && (L(t) || L(p))) return 'no_hands';
    if (hi >= 3 && lo === 1) return 'one_gap';
    if (hi >= 3) return 'almost';
    var low = Math.min.apply(null, sc);
    for (var i = 0; i < 5; i++) if (L(sc[i]) && sc[i] === low) return DIRS[i].id;
    return 'base';
  }
  // 29.10 (аудит R1): если слабо только одно из двух утверждений — заголовок о нём, а не о другом
  var ARCH_ALT = {
    marketing: [2, 'Неясно, кому продаём'],          // «откуда клиенты» в порядке, слабо «кому продаём»
    finance: [4, 'Деньги семьи и бизнеса вместе'],   // прибыль посчитана, слабо «деньги отдельно»
    time: [7, 'Важное не доводится до конца'],
    people: [9, 'Сложные разговоры откладываются']
  };
  var ARCH_DIR = { model: 0, marketing: 1, finance: 2, time: 3, people: 4 };
  function archetype() {
    var r = calc(), key = archKey(r.sc), a = ARCH[key];
    var name = a[0], text = a[1].replace('{main}', r.perfect ? '' : DIRS[r.weak].name.toLowerCase());
    if (ARCH_DIR[key] != null) {
      var d = ARCH_DIR[key], gi = gapIdx(d), alt = ARCH_ALT[key];
      if (alt && gi.length === 1 && gi[0] === alt[0]) name = alt[1];
      if (gi.length) text = cap(gapText(d)) + '.';
    }
    if (key === 'no_profit' && gapIdx(2).length) text = 'Клиенты приходят, но в деньгах есть пробел: ' + gapText(2) + '.';
    if (key === 'no_profit' && gapIdx(2).length === 1 && gapIdx(2)[0] === 4) name = 'Продажи есть — деньги смешаны';
    if (key === 'no_clients' && gapIdx(1).length === 1 && gapIdx(1)[0] === 2) name = 'Деньги посчитаны — неясно, кому продаём';
    if (key === 'no_clients' && gapIdx(1).length) text = 'С цифрами порядок, но с клиентами есть пробел: ' + gapText(1) + '.';
    return [name, text];
  }

  function tk() { return st.tasks; }
  function discKeys() { return Object.keys(tk().disc || {}); }
  function t2bad() { return /качеств|профессионал|индивидуальн/i.test(tk().t2 || ''); }
  function t5state() {
    var t = tk(), rank = (t.t5rank || [0, 0, 0, 0, 0]).slice(0, 5);
    var filled = t.t5.filter(function (x) { return x.trim(); }).length;
    var left = [1, 2, 3, 4, 5].filter(function (n) { return rank.indexOf(n) < 0; });
    // Если без места осталась одна заполненная задача и один номер — ставим его сами
    var free = [0, 1, 2, 3, 4].filter(function (i) { return !rank[i] && (t.t5[i] || '').trim(); });
    if (left.length === 1 && free.length === 1) { rank = rank.slice(); rank[free[0]] = left[0]; left = []; }
    var ok = filled === 5 && left.length === 0;
    // В сообщение — все заполненные задачи: сначала по местам, потом без места
    var sorted = [1, 2, 3, 4, 5].map(function (n) { return t.t5[rank.indexOf(n)]; }).filter(function (x) { return x && x.trim(); });
    [0, 1, 2, 3, 4].forEach(function (i) { if (!rank[i] && (t.t5[i] || '').trim()) sorted.push(t.t5[i]); });
    var nRanked = [1, 2, 3, 4, 5].filter(function (n) { var i = rank.indexOf(n); return i >= 0 && (t.t5[i] || '').trim(); }).length;
    return { rank: rank, filled: filled, left: left, ok: ok, sorted: sorted, nRanked: nRanked };
  }
  function tasksDone() {
    var t = tk();
    return [!!t.t1.trim(), !!t.t2.trim() && !t2bad(), !!t.t3a.trim() && !!t.t3b.trim(),
      discKeys().length === 8 && !!t.t4.trim(), t5state().ok].filter(Boolean).length;
  }
  // Тип личности по 8 словам задания 4 (буква с наибольшим числом слов) — для куратора
  var STYLE_NAMES = { D: 'Решительный', I: 'Вдохновляющий', S: 'Надёжный', C: 'Точный' };
  function personality() {
    var keys = discKeys(); if (keys.length < 8) return '';
    var cnt = { D: 0, I: 0, S: 0, C: 0 };
    keys.forEach(function (k) { if (cnt[k[0]] != null) cnt[k[0]]++; });
    var top = Math.max(cnt.D, cnt.I, cnt.S, cnt.C);
    var lead = 'DISC'.split('').filter(function (l) { return cnt[l] === top; }).map(function (l) { return STYLE_NAMES[l]; });
    return lead.join(' + ') + ' (' + 'DISC'.split('').map(function (l) { return STYLE_NAMES[l].toLowerCase() + ' ' + cnt[l]; }).join(' · ') + ' из 8 слов)';
  }
  function chosenWords() { return WORDS.filter(function (k) { return tk().disc[k]; }).map(function (k) { return k.slice(2); }); }

  function summary() {
    var r = calc();
    var stageText = (labelOf(STAGES, st.stage) || '—').toLowerCase();
    var famText = labelOf(familyOpts(), st.family), painText = labelOf(painOpts(), st.pain);
    var syms = SYMS.filter(function (s) { return st.sym[s[0]]; }).map(function (s) { return s[1].toLowerCase(); }).join(', ') || 'не отмечены';
    return 'РАЗБОР' + (SEG ? '\nСтраница: «' + SEG.name + '»' : '') + '\nЭтап: ' + stageText +
      (famText ? '\n' + (SEG && SEG.famLabel || 'Семья в бизнесе') + ': ' + famText.toLowerCase() : '') +
      (painText ? '\n' + (SEG && SEG.painLabel || 'Что мешает (по словам человека)') + ': ' + painText.toLowerCase() : '') +
      '\nУровень: ' + levelText(levelScore()) + ' из 5 · ' + levelName(levelScore()) +
      '\nТип профиля: ' + archetype()[0] +
      '\nПрофиль: ' + DIRS.map(function (d, i) { return d.name + ' ' + r.sc[i]; }).join(' · ') +
      '\nГлавная точка: ' + (r.perfect ? 'не выделяется' : DIRS[r.weak].name) +
      '\nПроявления: ' + syms;
  }
  function chatText() {      // 13.10: заданий больше нет — в чат куратору уходит результат 10 вопросов
    return 'Здравствуйте! Отправляю результат онлайн-диагностики FBT на разбор.\n\n' + summary().replace(/^РАЗБОР\n/, '');
  }

  // Код результата для бота (запасной режим без сервера): diag_<этап><идея>_<5 баллов>_<проявления>_t<задания>
  function botCode() {
    var r = calc();
    var stage = STAGE_CODE[st.stage] || 'o', idea = '0';
    var syms = SYMS.map(function (s, i) { return st.sym[s[0]] ? String(i + 1) : ''; }).join('') || '0';
    return 'diag_' + stage + idea + '_' + r.sc.join('') + '_' + syms + '_t' + tasksDone();
  }
  // Полный результат для API бота (когда будет сервер)
  function payload(withTasks) {
    var t = tk(), p = {
      stage: STAGE_CODE[st.stage] || 'o',
      idea: '0',
      family: st.family || '',
      pain: st.pain || '',
      answers: st.answers.slice(),
      symptoms: SYMS.map(function (s, i) { return st.sym[s[0]] ? i + 1 : 0; }).filter(Boolean),
      source: FBT.src || 'site'
    };
    var token = FBT.store.get('fbt_token', '');
    if (token) p.token = token;
    if (withTasks) p.tasks = { t1: t.t1, t2: t.t2, t3a: t.t3a, t3b: t.t3b, t4: t.t4, disc: discKeys(), t5: t.t5, t5rank: t.t5rank };
    return p;
  }
  function pushToBot(withTasks, sent) {
    if (!C.botApi) return Promise.resolve(null);
    var p = payload(withTasks);
    if (sent) p.sent = true;            // человек уже открыл чат куратора — бот не просит «отправьте»
    return fetch(C.botApi.replace(/\/$/, '') + '/api/diagnostic', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p)
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  // 09.10: через общий FBT.event — с номером события, версией сайта и пометкой теста
  function event(name, data) { FBT.event(name, data); }

  // ── Радар ───────────────────────────────────────────────
  var U = [[0, -1], [0.9511, -0.309], [0.5878, 0.809], [-0.5878, 0.809], [-0.9511, -0.309]];
  var DIR_OF_AXIS = [0, 4, 3, 2, 1];
  var LBL = [[230, 30, 'middle'], [377, 150, 'start'], [318, 326, 'start'], [142, 326, 'end'], [83, 150, 'end']];
  function radarSVG(sc, weak, label) {
    var CX = 230, CY = 190, R = 140;
    function pt(a, s) { return [CX + U[a][0] * R * s / 5, CY + U[a][1] * R * s / 5]; }
    function f(p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }
    var h = '<svg viewBox="0 0 460 360" role="img" aria-label="' + label + '" font-family="Onest, sans-serif">';
    [5, 4, 3, 2, 1].forEach(function (s) {
      h += '<polygon points="' + [0, 1, 2, 3, 4].map(function (a) { return f(pt(a, s)); }).join(' ') + '" fill="none" stroke="' + (s === 5 ? '#7A5E49' : '#5E4636') + '" stroke-width="' + (s === 5 ? 1.2 : 1) + '"/>';
    });
    h += '<path d="' + [0, 1, 2, 3, 4].map(function (a) { var p = pt(a, 5); return 'M' + CX + ' ' + CY + ' L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + '" stroke="#5E4636" stroke-width="1"/>';
    if (sc.some(function (x) { return x > 0; })) {
      h += '<polygon points="' + [0, 1, 2, 3, 4].map(function (a) { return f(pt(a, sc[DIR_OF_AXIS[a]])); }).join(' ') + '" fill="#F2C46D" fill-opacity="0.2" stroke="#F2C46D" stroke-width="2.4" stroke-linejoin="round"/>';
    }
    [0, 1, 2, 3, 4].forEach(function (a) {
      var d = DIR_OF_AXIS[a];
      if (sc[d] > 0) { var p = pt(a, sc[d]); h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="7" fill="' + DIRS[d].color + '"/>'; }
    });
    if (weak != null) {
      var w = pt(DIRS[weak].axis, sc[weak]);
      h += '<circle cx="' + w[0].toFixed(1) + '" cy="' + w[1].toFixed(1) + '" r="15" fill="none" stroke="#F6A48E" stroke-width="1.8"/>';
      h += '<circle cx="' + w[0].toFixed(1) + '" cy="' + w[1].toFixed(1) + '" r="7" fill="#C4432D" stroke="#FFFFFF" stroke-width="2"/>';
    }
    [0, 1, 2, 3, 4].forEach(function (a) {
      var d = DIR_OF_AXIS[a], l = LBL[a], hi = weak === d;
      h += '<text x="' + l[0] + '" y="' + l[1] + '" text-anchor="' + l[2] + '" font-size="15" font-weight="' + (hi ? 700 : 600) + '" fill="' + (hi ? '#F6A48E' : '#FFF8EE') + '">' + DIRS[d].name + '</text>';
      if (hi) h += '<text x="' + l[0] + '" y="' + (l[1] + 18) + '" text-anchor="' + l[2] + '" font-size="12" font-weight="500" fill="#EADCCB">начать здесь</text>';
    });
    return h + '</svg>';
  }

  // ── Отрисовка ──────────────────────────────────────────
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // Статичные списки
  $('[data-dirs]').innerHTML = DIRS.map(function (d) { return '<span><i style="background:' + d.color + '"></i>' + d.name + '</span>'; }).join('');
  var demoSc = scoresOf(DEMO);
  $('[data-radar="example"]').innerHTML = radarSVG(demoSc, 2, 'Пример профиля: слабее всего финансы');

  function optButton(label, on, onPick) {
    var b = el('button', 'opt');
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.appendChild(el('span', 'radio')); b.appendChild(document.createTextNode(label));
    b.addEventListener('click', function (e) { buzz(); onPick(e); });
    return b;
  }

  // v5.1 (06.10): отклик на нажатие — вибрация. Android: navigator.vibrate; iPhone (iOS 18+): системный переключатель даёт лёгкий «тик».
  var hapt = null;
  function buzz() {
    try { if (navigator.vibrate) { navigator.vibrate(18); return; } } catch (e) {}
    try {
      if (!hapt) {
        hapt = document.createElement('label'); hapt.className = 'haptic-sw'; hapt.setAttribute('aria-hidden', 'true');
        var inp = document.createElement('input'); inp.type = 'checkbox'; inp.setAttribute('switch', ''); inp.tabIndex = -1;
        hapt.appendChild(inp); document.body.appendChild(hapt);
      }
      hapt.click();
    } catch (e) {}
  }

  // 07.10: 3 вопроса перед тестом — по одному на экран, ответ выбран → через 0,38 с следующий
  function renderStage() {
    var sq = Math.max(0, Math.min(st.sq || 0, 2));
    var opts = sq === 0 ? STAGES : sq === 1 ? familyOpts() : painOpts();
    var cur = sq === 0 ? st.stage : sq === 1 ? st.family : st.pain;
    $('[data-sq-n]').textContent = (sq + 1) + ' из 3';
    $('[data-sq-h]').textContent = sq === 2 && st.stage === 'none' && !(SEG && SEG.pains) ? 'Что для вас сейчас важнее всего?' : SQ_TITLES[sq];
    $('[data-sq-segs]').innerHTML = [0, 1, 2].map(function (i) {
      return '<span style="background:' + (i < sq ? '#C60000' : i === sq ? '#FF8585' : 'rgba(128,128,134,.35)') + '"></span>';
    }).join('');
    var box = $('[data-sq-opts]'); box.innerHTML = ''; box.removeAttribute('data-busy');
    opts.forEach(function (o) {
      var b = optButton(o[1], cur === o[0], function () {
        if (box.getAttribute('data-busy')) return;
        box.setAttribute('data-busy', '1');
        $$('[data-sq-opts] .opt').forEach(function (x) { x.setAttribute('aria-checked', 'false'); x.classList.remove('is-picked'); });
        b.setAttribute('aria-checked', 'true'); b.classList.add('is-picked');
        if (sq === 0) {
          if (st.stage !== o[0]) { st.family = null; st.pain = null; }
          st.stage = o[0];
        } else if (sq === 1) st.family = o[0]; else st.pain = o[0];
        save();
        setTimeout(function () {
          if (sq < 2) st.sq = sq + 1;
          else {
            st.step = 'q'; st.qi = 0;
            event('diag_profile', { stage: STAGE_CODE[st.stage], family: st.family, pain: st.pain });
          }
          render(); window.scrollTo(0, 0);
        }, 380);
      });
      box.appendChild(b);
    });
  }

  function renderQ() {
    var qi = Math.min(st.qi, 9), q = QS[qi], d = DIRS[q[0]];
    $('[data-q-n]').textContent = 'Вопрос ' + (qi + 1) + ' из 10';
    $('[data-q-dir] i').style.background = d.color;
    $('[data-q-dir] b').textContent = d.name;
    $('[data-q-text]').textContent = q[1];
    $('[data-segs]').innerHTML = QS.map(function (qq, i) {
      var bg = st.answers[i] != null ? '#C60000' : (i === qi ? '#FF8585' : 'rgba(128,128,134,.35)');
      return '<span style="background:' + bg + '"></span>';
    }).join('');
    var box = $('[data-q-opts]'); box.innerHTML = ''; box.removeAttribute('data-busy');
    // 27.10 (Александр): 5 ответов вместо 3 — точнее профиль. Баллы 5 · 4 · 3 · 2 · 1 (та же шкала в боте)
    [['Да', 5], ['Скорее да', 4], ['Частично', 3], ['Скорее нет', 2], ['Нет', 1]].forEach(function (o) {
      var on = st.answers[qi] === o[1];
      var b = el('button', 'qopt', o[0]);
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (box.getAttribute('data-busy')) return;          // уже выбрали — ждём перехода
        box.setAttribute('data-busy', '1'); buzz();
        $$('[data-q-opts] .qopt').forEach(function (x) { x.classList.remove('is-picked'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('is-picked'); b.setAttribute('aria-checked', 'true');
        st.answers[qi] = o[1];
        event('diag_progress', { answered: st.answers.filter(function (x) { return x != null; }).length });
        // короткая пауза: человек видит, что ответ выбран (красная кнопка), и только потом открывается следующий вопрос
        setTimeout(function () {
          if (qi < 9) { st.qi = qi + 1; } else { st.step = 'sym'; }
          render(); window.scrollTo(0, 0);
        }, 380);
      });
      box.appendChild(b);
    });
    $('[data-idea-note]').hidden = st.stage === 'one';
    var r = calc();
    $('[data-radar="live"]').innerHTML = radarSVG(r.sc, null, 'Ваш профиль строится');
  }

  function renderSym() {
    var box = $('[data-syms]'); box.innerHTML = '';
    SYMS.forEach(function (s) {
      var on = !!st.sym[s[0]], c = DIRS[s[2]].color;
      var b = el('button', 'sym');
      b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var dot = el('i'); dot.style.background = c;
      b.appendChild(dot); b.appendChild(document.createTextNode(s[1]));
      b.addEventListener('click', function () { buzz(); if (st.sym[s[0]]) delete st.sym[s[0]]; else st.sym[s[0]] = true; render(); });
      box.appendChild(b);
    });
  }

  function renderResult() {
    var r = calc(), main = DIRS[r.weak];
    $('[data-radar="result"]').innerHTML = radarSVG(r.sc, r.complete && !r.perfect ? r.weak : null,
      'Профиль бизнеса: ' + DIRS.map(function (d, i) { return d.name + ' ' + r.sc[i] + ' из 5'; }).join(', '));
    $('[data-bars]').innerHTML = DIRS.map(function (d, i) {
      var weak = i === r.weak && !r.perfect;
      return '<div class="brow' + (weak ? ' weak' : '') + '"><span class="bn">' + d.name + '</span><span class="bt"><i style="width:' + (r.sc[i] * 20) + '%;background:' + d.color + '"></i></span><span class="bs">' + r.sc[i] + '/5</span></div>';
    }).join('');
    $('[data-mp-dot]').style.background = main.color;
    FBT.text('mpName', main.name); FBT.text('mpStop', main.stop); FBT.text('mpWhy', whyOf(r.weak)); FBT.text('mpStep', main.step); FBT.text('mpCost', main.cost); FBT.text('mpFix', main.fix);
    // 29.10 (аудит R2): при равных баллах объясняем, почему предлагаем начать именно с этого направления
    FBT.text('mpOthers', 'Столько же баллов у направлений: ' + r.ties.filter(function (n) { return n !== main.name; }).join(', ') +
      '. Предлагаем начать с направления «' + main.name + '» — в программе FBT разбор идёт в таком порядке. Если сейчас важнее другое, напишите об этом куратору.');
    var chosen = SYMS.filter(function (s) { return st.sym[s[0]]; });
    $('[data-sym-chosen]').innerHTML = chosen.map(function (s) { return '<span class="chip"><i style="color:' + DIRS[s[2]].color + '"></i>' + s[1] + '</span>'; }).join('');
    $('[data-msg]').textContent = summary();
    var lv = levelScore(), arch = archetype();
    FBT.text('lvlN', levelText(lv)); FBT.text('lvlName', levelName(lv)); FBT.text('archName', arch[0]); FBT.text('archText', arch[1]);
    $$('[data-lvl] i').forEach(function (x, i) {        // 16.10: последняя полоска заполнена на дробную часть
      var f = Math.max(0, Math.min(1, lv - i));
      x.classList.toggle('on', f >= 1);
      x.style.background = f > 0 && f < 1 ? 'linear-gradient(90deg,#C60000 ' + Math.round(f * 100) + '%,rgba(128,128,134,.35) ' + Math.round(f * 100) + '%)' : '';
    });
    FBT.toggle({ notPerfect: !r.perfect, perfect: r.perfect, hasOthers: !r.perfect && r.ties.length > 1, hasSym: chosen.length > 0 });
  }

  // 13.10 (Александр): вторая часть диагностики (5 заданий) убрана с сайта и из бота
  function renderLight() { var m = $('[data-msg]'); if (m) m.textContent = summary(); }

  function render() {
    var steps = ['intro', 'stage', 'q', 'sym', 'result', 'sent'];
    if (st.step === 'tasks') st.step = 'result';            // старая ссылка #tasks
    if (steps.indexOf(st.step) < 0) st.step = 'intro';
    // Нельзя открыть результат без ответов
    var answered = st.answers.every(function (x) { return x != null; });
    if ((st.step === 'result' || st.step === 'sent') && !answered) st.step = st.stage ? 'q' : 'intro';
    $$('[data-screen]').forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== st.step; });
    if (st.step === 'stage') renderStage();
    if (st.step === 'q') renderQ();
    if (st.step === 'sym') renderSym();
    if (st.step === 'result' || st.step === 'sent') { renderResult(); if (FBT.medal) FBT.medal('kompas'); }
    FBT.text('pdfLabel', st.pdf ? 'Открыть бота с PDF ещё раз' : 'Получить PDF-разбор в боте');   // 29.10: клик ≠ доставка
    FBT.text('rcBadge', { intro: '10 вопросов · 5 минут', stage: 'перед тестом', q: 'вопрос ' + (Math.min(st.qi, 9) + 1) + ' из 10', sym: 'последний шаг',
      result: 'результат готов', sent: 'чат с куратором открыт' }[st.step]);
    // знакомы с ботом — результат уже у него, открываем чат без /start
    $$('[data-pdf]').forEach(function (a) { a.href = FBT.linked() ? FBT.bot('') : FBT.bot(botCode()); a.target = '_blank'; a.rel = 'noopener'; });
    save();
  }

  // ── События ─────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) {
      var to = go.getAttribute('data-go');
      if (to === 'stage' && st.step === 'intro') { event('diag_start'); st.sq = 0; }
      if (to === 'result' && !st.sent1) { st.sent1 = true; pushToBot(false).then(function (r) { if (r && r.pushed && FBT.pushNotice) setTimeout(FBT.pushNotice.report, 3000); }); }   // часть 1 — в бот (если есть сервер)
      st.step = to;
      if (location.hash === '#tasks') history.replaceState(null, '', location.pathname + location.search);
      render(); window.scrollTo(0, 0); return;
    }
    if (e.target.closest('[data-sq-back]')) { if ((st.sq || 0) > 0) st.sq--; else st.step = 'intro'; render(); window.scrollTo(0, 0); return; }
    if (e.target.closest('[data-q-back]')) { if (st.qi > 0) st.qi--; else { st.step = 'stage'; st.sq = 2; } render(); return; }
    if (e.target.closest('[data-sym-back]')) { st.step = 'q'; st.qi = 9; render(); return; }
    if (e.target.closest('[data-restart]')) {
      var keepTasks = st.tasks; st = fresh(); st.tasks = keepTasks; render(); window.scrollTo(0, 0); return;
    }
    if (e.target.closest('[data-pdf]')) { st.pdf = true; setTimeout(render, 50); return; }
    if (e.target.closest('[data-send]')) {
      if (FBT.medal) FBT.medal('pismo');
      event('diag_send');
      FBT.open(FBT.tg(C.curator, chatText()));
      st.step = 'sent'; render(); window.scrollTo(0, 0);
    }
  });

  render();
})();
