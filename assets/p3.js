/* Стр. 3 · Онлайн-диагностика «Швейцарский компас»: 10 вопросов, профиль, главная точка, задания, отправка куратору */
(function () {
  var C = FBT.cfg;
  var qs = new URLSearchParams(location.search);
  if (qs.has('reset')) FBT.store.set('fbt_diag', null);

  var DIRS = [
    { id: 'model', name: 'Бизнес-модель', color: '#F0625F', axis: 0, stop: 'Остановка 2 · Бизнес-модель',
      why: 'Пока сложно одной фразой сказать, кто ваш клиент и на чём бизнес зарабатывает. Без этого шаги в маркетинге и финансах дают случайный результат.',
      step: 'Закончите фразу «Я зарабатываю деньги, когда…»: кто платит, за что и когда.',
      cost: 'Пока модель неясна, деньги на рекламу и новые продукты уходят наугад — и часто не возвращаются.',
      fix: 'Это решаемо: остановка 2 на карте действий и модуль «Бизнес-модель» в программе FBT.' },
    { id: 'marketing', name: 'Маркетинг', color: '#F5C451', axis: 4, stop: 'Остановка 4 · Маркетинг',
      why: 'Клиенты приходят нерегулярно, и непонятно, какой способ привлечения можно повторить.',
      step: 'Опишите клиента, который уже купил, и канал, через который он к вам пришёл.',
      cost: 'Каждый месяц начинается с нуля: продажи зависят от случая и сарафана, их нельзя спланировать.',
      fix: 'Это решаемо: остановка 4 на карте действий и модуль «Маркетинг» в программе FBT.' },
    { id: 'finance', name: 'Финансы', color: '#2BB5A0', axis: 3, stop: 'Остановка 5 · Финансы',
      why: 'Нет ясности, сколько бизнес реально зарабатывает, а деньги семьи и бизнеса могут смешиваться.',
      step: 'Посчитайте, сколько остаётся с одного заказа и сколько заказов нужно, чтобы выйти в ноль.',
      cost: 'Пока неясно, сколько остаётся с заказа, рост оборота может приносить не прибыль, а кассовые разрывы.',
      fix: 'Это решаемо: остановка 5 на карте действий и модуль «Финансы» в программе FBT.' },
    { id: 'time', name: 'Время', color: '#8B6CF6', axis: 2, stop: 'Остановка 6 · Время',
      why: 'Текучка забирает почти всё время, и на развитие бизнеса его не остаётся.',
      step: 'Выпишите задачи недели и разложите их: сделать, запланировать, передать, убрать.',
      cost: 'Бизнес растёт ровно настолько, насколько хватает ваших часов, — а их уже не хватает, в том числе на семью.',
      fix: 'Это решаемо: остановка 6 на карте действий и модуль «Время» в программе FBT.' },
    { id: 'people', name: 'Лидерство', color: '#4FA3E3', axis: 1, stop: 'Остановка 7 · Люди',
      why: 'Роли и ответственность размыты, а сложные вопросы трудно обсуждать спокойно.',
      step: 'Дайте каждой роли владельца: кто делает, какой результат нужен и когда проверяете.',
      cost: 'Все решения возвращаются к вам, а напряжение в команде копится и тормозит рост.',
      fix: 'Это решаемо: остановка 7 на карте действий и модуль «Люди» в программе FBT.' }
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
  var SYMS = [['s1', 'Мало клиентов', 1], ['s2', 'Продажи скачут', 1], ['s3', 'Неясно, кому продаём', 1], ['s4', 'Не понимаем прибыль', 2],
    ['s5', 'Деньги смешаны', 2], ['s6', 'Все перегружены', 3], ['s7', 'Задачи зависают', 3], ['s8', 'Роли пересекаются', 4], ['s9', 'Часто спорим', 4]];
  var STAGES = [['one', 'У меня уже есть один бизнес'], ['many', 'У меня несколько бизнесов'], ['none', 'Бизнеса пока нет, но планирую']];
  var IDEAS = [['clear', 'Есть понятная идея'], ['doubt', 'Есть идея, но сомневаюсь'], ['noidea', 'Идеи пока нет']];
  // Слова для задания 4. Ключ «буква:слово» нужен боту для PDF; человеку буквы и названия стилей не показываем.
  var WORDS = ['I:общительный', 'C:аналитичный', 'D:решительный', 'S:терпеливый', 'C:точный', 'S:надёжный',
    'D:прямой', 'I:вдохновляющий', 'S:командный игрок', 'D:соревновательный', 'C:любит правила', 'I:оптимистичный',
    'D:нетерпеливый', 'I:эмоциональный', 'S:избегает конфликтов', 'C:осторожный', 'S:лояльный', 'I:любит внимание',
    'C:критичный', 'D:требовательный', 'C:системный', 'D:нацелен на результат', 'S:спокойный', 'I:убедительный'];
  var DEMO = [5, 3, 3, 3, 3, 1, 3, 5, 5, 3];

  // ── Состояние (сохраняется в браузере) ─────────────────
  function fresh() {
    return { step: 'intro', qi: 0, answers: [null, null, null, null, null, null, null, null, null, null], stage: null, idea: null, sym: {},
      tasks: { t1: '', t2: '', t3a: '', t3b: '', t4: '', disc: {}, t5: ['', '', '', '', ''], t5rank: [0, 0, 0, 0, 0] },
      pdf: false, sent1: false, sent2: false };
  }
  var st = Object.assign(fresh(), FBT.store.get('fbt_diag', null) || {});
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
  function tk() { return st.tasks; }
  function discKeys() { return Object.keys(tk().disc || {}); }
  function t2bad() { return /качеств|профессионал|индивидуальн/i.test(tk().t2 || ''); }
  function t5state() {
    var t = tk(), rank = (t.t5rank || [0, 0, 0, 0, 0]).slice(0, 5);
    var filled = t.t5.filter(function (x) { return x.trim(); }).length;
    var left = [1, 2, 3, 4, 5].filter(function (n) { return rank.indexOf(n) < 0; });
    var ok = filled === 5 && left.length === 0;
    var sorted = [1, 2, 3, 4, 5].map(function (n) { return t.t5[rank.indexOf(n)]; }).filter(function (x) { return x && x.trim(); });
    return { rank: rank, filled: filled, left: left, ok: ok, sorted: sorted };
  }
  function tasksDone() {
    var t = tk();
    return [!!t.t1.trim(), !!t.t2.trim() && !t2bad(), !!t.t3a.trim() && !!t.t3b.trim(),
      discKeys().length === 8 && !!t.t4.trim(), t5state().ok].filter(Boolean).length;
  }
  function chosenWords() { return WORDS.filter(function (k) { return tk().disc[k]; }).map(function (k) { return k.slice(2); }); }

  function summary() {
    var r = calc();
    var stageText = { one: 'у меня уже есть один бизнес', many: 'у меня несколько бизнесов', none: 'бизнеса пока нет, но планирую' }[st.stage] || '—';
    var ideaText = { clear: 'есть понятная идея', doubt: 'есть идея, но сомневаюсь', noidea: 'идеи пока нет' }[st.idea];
    var syms = SYMS.filter(function (s) { return st.sym[s[0]]; }).map(function (s) { return s[1].toLowerCase(); }).join(', ') || 'не отмечены';
    return 'РАЗБОР\nЭтап: ' + stageText + (ideaText ? ' (' + ideaText + ')' : '') +
      '\nПрофиль: ' + DIRS.map(function (d, i) { return d.name + ' ' + r.sc[i]; }).join(' · ') +
      '\nГлавная точка: ' + (r.perfect ? 'не выделяется' : DIRS[r.weak].name) +
      '\nПроявления: ' + syms +
      '\nЗадания: ' + tasksDone() + ' из 5';
  }
  function chatText() {
    var t = tk(), lines = [], words = chosenWords(), s5 = t5state().sorted;
    if (t.t1.trim()) lines.push('1. Бизнес-модель: ' + t.t1.trim());
    if (t.t2.trim()) lines.push('2. Почему выбирают нас: ' + t.t2.trim());
    if (t.t3a.trim() || t.t3b.trim()) lines.push('3. Сложнее всего с: ' + t.t3a.trim() + (t.t3b.trim() ? ' — ' + t.t3b.trim() : ''));
    if (words.length || t.t4.trim()) lines.push('4. Слова о себе: ' + (words.join(', ') || '—') + (t.t4.trim() ? '\nРабота с людьми: ' + t.t4.trim() : ''));
    if (s5.length) lines.push('5. Задачи по важности: ' + s5.map(function (x, k) { return (k + 1) + ') ' + x.trim(); }).join('; '));
    return 'Здравствуйте! Отправляю результат онлайн-диагностики FBT на разбор.\n\n' + summary().replace(/^РАЗБОР\n/, '') +
      (lines.length ? '\n\n' + lines.join('\n') : '');
  }

  // Код результата для бота (запасной режим без сервера): diag_<этап><идея>_<5 баллов>_<проявления>_t<задания>
  function botCode() {
    var r = calc();
    var stage = { one: 'o', many: 'm', none: 'n' }[st.stage] || 'o';
    var idea = st.stage === 'none' ? ({ clear: 'c', doubt: 'd', noidea: 'x' }[st.idea] || '0') : '0';
    var syms = SYMS.map(function (s, i) { return st.sym[s[0]] ? String(i + 1) : ''; }).join('') || '0';
    return 'diag_' + stage + idea + '_' + r.sc.join('') + '_' + syms + '_t' + tasksDone();
  }
  // Полный результат для API бота (когда будет сервер)
  function payload(withTasks) {
    var t = tk(), p = {
      stage: { one: 'o', many: 'm', none: 'n' }[st.stage] || 'o',
      idea: st.stage === 'none' ? ({ clear: 'c', doubt: 'd', noidea: 'x' }[st.idea] || '0') : '0',
      answers: st.answers.slice(),
      symptoms: SYMS.map(function (s, i) { return st.sym[s[0]] ? i + 1 : 0; }).filter(Boolean),
      source: FBT.src || 'site'
    };
    var token = FBT.store.get('fbt_token', '');
    if (token) p.token = token;
    if (withTasks) p.tasks = { t1: t.t1, t2: t.t2, t3a: t.t3a, t3b: t.t3b, t4: t.t4, disc: discKeys(), t5: t.t5, t5rank: t.t5rank };
    return p;
  }
  function pushToBot(withTasks) {
    if (!C.botApi) return Promise.resolve(null);
    return fetch(C.botApi.replace(/\/$/, '') + '/api/diagnostic', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(withTasks))
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function event(name, data) {
    var token = FBT.store.get('fbt_token', '');
    if (!C.botApi || !token) return;
    try {
      fetch(C.botApi.replace(/\/$/, '') + '/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, event: name, data: data || {} }), keepalive: true });
    } catch (e) { /* без сервера — просто пропускаем */ }
  }

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
      h += '<polygon points="' + [0, 1, 2, 3, 4].map(function (a) { return f(pt(a, s)); }).join(' ') + '" fill="none" stroke="' + (s === 5 ? '#3E5E55' : '#2F4A44') + '" stroke-width="' + (s === 5 ? 1.2 : 1) + '"/>';
    });
    h += '<path d="' + [0, 1, 2, 3, 4].map(function (a) { var p = pt(a, 5); return 'M' + CX + ' ' + CY + ' L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + '" stroke="#2F4A44" stroke-width="1"/>';
    if (sc.some(function (x) { return x > 0; })) {
      h += '<polygon points="' + [0, 1, 2, 3, 4].map(function (a) { return f(pt(a, sc[DIR_OF_AXIS[a]])); }).join(' ') + '" fill="#CDEB78" fill-opacity="0.2" stroke="#CDEB78" stroke-width="2.4" stroke-linejoin="round"/>';
    }
    [0, 1, 2, 3, 4].forEach(function (a) {
      var d = DIR_OF_AXIS[a];
      if (sc[d] > 0) { var p = pt(a, sc[d]); h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="7" fill="' + DIRS[d].color + '"/>'; }
    });
    if (weak != null) {
      var w = pt(DIRS[weak].axis, sc[weak]);
      h += '<circle cx="' + w[0].toFixed(1) + '" cy="' + w[1].toFixed(1) + '" r="15" fill="none" stroke="#E48680" stroke-width="1.8"/>';
      h += '<circle cx="' + w[0].toFixed(1) + '" cy="' + w[1].toFixed(1) + '" r="7" fill="#D2352B" stroke="#FFFFFF" stroke-width="2"/>';
    }
    [0, 1, 2, 3, 4].forEach(function (a) {
      var d = DIR_OF_AXIS[a], l = LBL[a], hi = weak === d;
      h += '<text x="' + l[0] + '" y="' + l[1] + '" text-anchor="' + l[2] + '" font-size="15" font-weight="' + (hi ? 700 : 600) + '" fill="' + (hi ? '#E48680' : '#FFFFFF') + '">' + DIRS[d].name + '</text>';
      if (hi) h += '<text x="' + l[0] + '" y="' + (l[1] + 18) + '" text-anchor="' + l[2] + '" font-size="12" font-weight="500" fill="#C9D8D2">начать здесь</text>';
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
    b.addEventListener('click', onPick);
    return b;
  }

  function renderStage() {
    var box = $('[data-stages]'); box.innerHTML = '';
    STAGES.forEach(function (o) {
      box.appendChild(optButton(o[1], st.stage === o[0], function () { st.stage = o[0]; if (o[0] !== 'none') st.idea = null; render(); }));
    });
    var ib = $('[data-ideas]'); ib.innerHTML = '';
    IDEAS.forEach(function (o) { ib.appendChild(optButton(o[1], st.idea === o[0], function () { st.idea = o[0]; render(); })); });
    $('[data-idea-wrap]').hidden = st.stage !== 'none';
    $('[data-stage-next]').disabled = !(st.stage && (st.stage !== 'none' || st.idea));
  }

  function renderQ() {
    var qi = Math.min(st.qi, 9), q = QS[qi], d = DIRS[q[0]];
    $('[data-q-n]').textContent = 'Вопрос ' + (qi + 1) + ' из 10';
    $('[data-q-dir] i').style.background = d.color;
    $('[data-q-dir] b').textContent = d.name;
    $('[data-q-text]').textContent = q[1];
    $('[data-segs]').innerHTML = QS.map(function (qq, i) {
      var bg = st.answers[i] != null ? DIRS[qq[0]].color : (i === qi ? '#6E6E78' : '#2A2A2F');
      return '<span style="background:' + bg + '"></span>';
    }).join('');
    var box = $('[data-q-opts]'); box.innerHTML = '';
    [['Нет', 1], ['Частично', 3], ['Да', 5]].forEach(function (o) {
      var on = st.answers[qi] === o[1];
      var b = el('button', 'qopt', o[0]);
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', on ? 'true' : 'false');
      if (on) { b.style.background = d.color; b.style.borderColor = d.color; b.style.color = '#111113'; }
      b.addEventListener('click', function () {
        st.answers[qi] = o[1];
        event('diag_progress', { answered: st.answers.filter(function (x) { return x != null; }).length });
        if (qi < 9) { st.qi = qi + 1; } else { st.step = 'sym'; }
        render(); window.scrollTo(0, 0);
      });
      box.appendChild(b);
    });
    $('[data-idea-note]').hidden = st.stage !== 'none';
    var r = calc();
    $('[data-radar="live"]').innerHTML = radarSVG(r.sc, null, 'Ваш профиль строится');
  }

  function renderSym() {
    var box = $('[data-syms]'); box.innerHTML = '';
    SYMS.forEach(function (s) {
      var on = !!st.sym[s[0]], c = DIRS[s[2]].color;
      var b = el('button', 'sym');
      b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var dot = el('i'); dot.style.background = on ? '#111113' : c;
      b.appendChild(dot); b.appendChild(document.createTextNode(s[1]));
      if (on) { b.style.background = c; b.style.borderColor = c; b.style.color = '#111113'; }
      b.addEventListener('click', function () { if (st.sym[s[0]]) delete st.sym[s[0]]; else st.sym[s[0]] = true; render(); });
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
    FBT.text('mpName', main.name); FBT.text('mpStop', main.stop); FBT.text('mpWhy', main.why); FBT.text('mpStep', main.step); FBT.text('mpCost', main.cost); FBT.text('mpFix', main.fix);
    FBT.text('mpOthers', 'На том же уровне: ' + r.ties.filter(function (n) { return n !== main.name; }).join(', ') + '.');
    var chosen = SYMS.filter(function (s) { return st.sym[s[0]]; });
    $('[data-sym-chosen]').innerHTML = chosen.map(function (s) { return '<span class="chip"><i style="color:' + DIRS[s[2]].color + '"></i>' + s[1] + '</span>'; }).join('');
    $('[data-msg]').textContent = summary();
    FBT.toggle({ notPerfect: !r.perfect, perfect: r.perfect, hasOthers: !r.perfect && r.ties.length > 1, hasSym: chosen.length > 0, noVideo: !FBT.sawVideo() });
  }

  function renderTasks() {
    var t = tk();
    $$('[data-t]').forEach(function (inp) { var k = inp.getAttribute('data-t'); if (document.activeElement !== inp) inp.value = t[k] || ''; });
    $('#t2').classList.toggle('warn', t2bad());
    $('[data-t2bad]').hidden = !t2bad();
    var n = discKeys().length;
    var cnt = $('[data-disc-count]'); cnt.textContent = 'Выбрано ' + n + ' из 8'; cnt.style.color = n === 8 ? 'var(--ok)' : 'var(--muted-2)';
    var box = $('[data-words]'); box.innerHTML = '';
    WORDS.forEach(function (key) {
      var on = !!t.disc[key], full = n >= 8 && !on;
      var b = el('button', 'word' + (full ? ' full' : ''), key.slice(2));
      b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (t.disc[key]) delete t.disc[key]; else if (Object.keys(t.disc).length < 8) t.disc[key] = true;
        render();
      });
      box.appendChild(b);
    });
    var s5 = t5state(), rows = $('[data-t5]');
    if (!rows.children.length) {
      [0, 1, 2, 3, 4].forEach(function (i) {
        var row = el('div', 't5row');
        row.innerHTML = '<label class="sr-only" for="t5-' + (i + 1) + '">Задача ' + (i + 1) + '</label>' +
          '<input class="input" id="t5-' + (i + 1) + '" type="text" placeholder="Задача" data-t5i="' + i + '">' +
          '<div class="ranks" role="group" aria-label="Важность задачи ' + (i + 1) + '"></div>';
        rows.appendChild(row);
        row.querySelector('input').addEventListener('input', function (e) { t.t5[i] = e.target.value; save(); renderLight(); });
      });
    }
    [0, 1, 2, 3, 4].forEach(function (i) {
      var row = rows.children[i], inp = row.querySelector('input');
      if (document.activeElement !== inp) inp.value = t.t5[i] || '';
      inp.style.borderColor = s5.rank[i] === 1 ? '#2BB5A0' : '';
      var rk = row.querySelector('.ranks'); rk.innerHTML = '';
      [1, 2, 3, 4, 5].forEach(function (nn) {
        var on = s5.rank[i] === nn, taken = !on && s5.rank.indexOf(nn) >= 0;
        var b = el('button', 'rank' + (on ? ' on' : '') + (taken ? ' taken' : ''), String(nn));
        b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.setAttribute('aria-label', 'Важность ' + nn + (nn === 1 ? ' — самая важная' : nn === 5 ? ' — наименее важная' : ''));
        b.addEventListener('click', function () {
          var arr = s5.rank.slice();
          if (arr[i] === nn) arr[i] = 0; else { var j = arr.indexOf(nn); if (j >= 0) arr[j] = arr[i]; arr[i] = nn; }
          t.t5rank = arr; render();
        });
        rk.appendChild(b);
      });
    });
    var hint = $('[data-t5hint]');
    hint.textContent = s5.ok ? 'Готово: самая важная задача — «' + t.t5[s5.rank.indexOf(1)].trim() + '».'
      : s5.filled < 5 ? 'Заполнено задач: ' + s5.filled + ' из 5.' : 'Осталось поставить: ' + s5.left.join(', ') + '.';
    hint.style.color = s5.ok ? 'var(--ok)' : 'var(--dim)';
  }

  // Лёгкое обновление без перерисовки полей ввода
  function renderLight() {
    FBT.text('tasksDone', String(tasksDone()));
    $('#t2').classList.toggle('warn', t2bad());
    $('[data-t2bad]').hidden = !t2bad();
    var s5 = t5state(), hint = $('[data-t5hint]');
    if (hint) {
      hint.textContent = s5.ok ? 'Готово: самая важная задача — «' + tk().t5[s5.rank.indexOf(1)].trim() + '».'
        : s5.filled < 5 ? 'Заполнено задач: ' + s5.filled + ' из 5.' : 'Осталось поставить: ' + s5.left.join(', ') + '.';
      hint.style.color = s5.ok ? 'var(--ok)' : 'var(--dim)';
    }
    var m = $('[data-msg]'); if (m) m.textContent = summary();
  }

  function render() {
    var steps = ['intro', 'stage', 'q', 'sym', 'result', 'tasks', 'sent'];
    if (steps.indexOf(st.step) < 0) st.step = 'intro';
    // Нельзя открыть результат без ответов
    var answered = st.answers.every(function (x) { return x != null; });
    if ((st.step === 'result' || st.step === 'tasks' || st.step === 'sent') && !answered) st.step = st.stage ? 'q' : 'intro';
    $$('[data-screen]').forEach(function (s) { s.hidden = s.getAttribute('data-screen') !== st.step; });
    if (st.step === 'stage') renderStage();
    if (st.step === 'q') renderQ();
    if (st.step === 'sym') renderSym();
    if (st.step === 'result' || st.step === 'sent') { renderResult(); if (FBT.medal) FBT.medal('kompas'); }
    if (FBT.medal && tasksDone() === 5) FBT.medal('tetrad');
    if (st.step === 'tasks') renderTasks();
    FBT.text('tasksDone', String(tasksDone()));
    FBT.text('pdfLabel', st.pdf ? 'PDF-разбор — в боте ✓' : 'Получить PDF-разбор в боте');
    FBT.text('rcBadge', { intro: '10 вопросов · 5 минут', stage: 'перед тестом', q: 'вопрос ' + (Math.min(st.qi, 9) + 1) + ' из 10', sym: 'последний шаг',
      result: 'результат готов', tasks: 'задания · ' + tasksDone() + ' из 5', sent: 'отправлено куратору' }[st.step]);
    $$('[data-pdf]').forEach(function (a) { a.href = FBT.bot(botCode()); a.target = '_blank'; a.rel = 'noopener'; });
    save();
  }

  // ── События ─────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) {
      var to = go.getAttribute('data-go');
      if (to === 'stage' && st.step === 'intro') event('diag_start');
      if (to === 'result' && !st.sent1) { st.sent1 = true; pushToBot(false); }   // часть 1 — в бот (если есть сервер)
      st.step = to;
      if (to !== 'tasks' && location.hash === '#tasks') history.replaceState(null, '', location.pathname + location.search);
      render(); window.scrollTo(0, 0); return;
    }
    if (e.target.closest('[data-stage-next]')) { st.step = 'q'; st.qi = 0; render(); window.scrollTo(0, 0); return; }
    if (e.target.closest('[data-q-back]')) { if (st.qi > 0) st.qi--; else st.step = 'stage'; render(); return; }
    if (e.target.closest('[data-sym-back]')) { st.step = 'q'; st.qi = 9; render(); return; }
    if (e.target.closest('[data-restart]')) {
      var keepTasks = st.tasks; st = fresh(); st.tasks = keepTasks; render(); window.scrollTo(0, 0); return;
    }
    if (e.target.closest('[data-pdf]')) { st.pdf = true; setTimeout(render, 50); return; }
    if (e.target.closest('[data-send]')) {
      event('diag_send');
      if (FBT.medal) FBT.medal('pismo');
      if (tasksDone() > 0 && !st.sent2) { st.sent2 = true; pushToBot(true); }  // часть 2 — в бот (если есть сервер)
      FBT.open(FBT.tg(C.curator, chatText()));
      st.step = 'sent'; render(); window.scrollTo(0, 0);
    }
  });
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-t');
    if (!k) return;
    tk()[k] = e.target.value; save(); renderLight();
  });
  window.addEventListener('hashchange', function () { if (location.hash === '#tasks') { st.step = 'tasks'; render(); } });

  render();
})();
