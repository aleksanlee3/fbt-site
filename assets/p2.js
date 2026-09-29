/* Стр. 2 · Карта действий: интерактивные остановки, состояние «карта получена» */
(function () {
  var qs = new URLSearchParams(location.search);
  if (qs.has('reset')) { FBT.store.set('fbt_p2', {}); FBT.store.set('fbt_map', 0); }
  var saved = FBT.store.get('fbt_p2', {}) || {};
  var st = { got: FBT.gotMap() || !!saved.gotMap, stop: typeof saved.stop === 'number' ? saved.stop : 0 };

  var DATA = [
    { n: '1', name: 'Идея', title: 'Идея', q: 'Кому вы полезны?', d: [70, 80], m: [37, 42],
      todo: 'Сформулируете идею одной фразой: мы помогаем КОМУ решить КАКУЮ ПРОБЛЕМУ с помощью ЧЕГО. И сделаете быстрый SWOT — по одному ответу на каждый вопрос.',
      ex: 'Готовим ужины для занятых родителей, чтобы вечером не тратить час на готовку. Доставляем набор на семью.',
      doneLabel: 'Готово, когда', done: 'можете объяснить бизнес за одну минуту.' },
    { n: '2', name: 'Бизнес-модель', title: 'Бизнес-модель', q: 'За что вам платят?', d: [290, 80], m: [160, 42],
      todo: 'Опишете бизнес-модель в четырёх ответах: что и за сколько, как купят и получат, что нужно внутри и на что уходят деньги.',
      ex: 'Набор ужина за 150 000 сум → заказ в мессенджере → готовка и доставка → 90 000 сум расходов на заказ.',
      doneLabel: 'Готово, когда', done: 'можете объяснить бизнес за одну минуту.' },
    { n: '3', name: 'Проверка рынка', title: 'Проверка рынка', q: 'Есть ли спрос?', d: [510, 80], m: [283, 42],
      todo: 'Проведёте 10 разговоров с будущими покупателями о реальном опыте, посмотрите на 5 конкурентов и предложите маленький тест.',
      ex: 'Из 10 собеседников 6 жалуются на нехватку времени. Трое заказали пробный ужин.',
      doneLabel: 'Готово, когда', done: 'есть повторяющаяся проблема и факты спроса.' },
    { n: '4', name: 'Маркетинг', title: 'Маркетинг', q: 'Как придёт клиент?', d: [510, 240], m: [283, 132],
      todo: 'Соберёте путь клиента: что обещаем → где о нас узнают → как купить. И запустите один тест на ближайшие 7 дней.',
      ex: 'Считайте путь клиента: увидели → спросили → заказали → купили повторно.',
      doneLabel: 'Готово, когда', done: 'есть один тест с бюджетом, сроком и числом заказов.' },
    { n: '5', name: 'Финансы', title: 'Финансы', q: 'Что остаётся?', d: [290, 240], m: [160, 132],
      todo: 'Посчитаете, сколько остаётся с одного заказа и сколько заказов нужно, чтобы выйти в ноль.',
      ex: '150 000 − 90 000 = 60 000 сум с заказа. При постоянных расходах 6 млн сум: 6 000 000 ÷ 60 000 = 100 заказов.',
      doneLabel: 'Готово, когда', done: 'знаете свои расходы и сколько нужно продать до нуля.' },
    { n: '6', name: 'Время', title: 'Время', q: 'На что ваш фокус?', d: [170, 400], m: [93, 222],
      todo: 'Разложите задачи недели по четырём клеткам: сделать, запланировать, передать или упростить, убрать.',
      ex: 'Сорванная доставка — сделать. Расчёт цены — запланировать. Бесконечная смена логотипа — убрать.',
      doneLabel: 'Готово, когда', done: 'три приоритета стоят в календаре, роли распределены.' },
    { n: '7', name: 'Люди', title: 'Люди', q: 'Кто за что отвечает?', d: [370, 400], m: [205, 222],
      todo: 'Дадите каждой роли владельца: кто делает, какой результат нужен и когда проверяете. В семейном бизнесе — кто принимает спорное решение.',
      ex: 'Один отвечает за кухню и качество, другой — за заказы и доставку. По пятницам вместе проверяют сроки, жалобы и прибыль.',
      doneLabel: 'Готово, когда', done: 'три приоритета стоят в календаре, роли распределены.' },
    { n: '90', name: '90 дней', title: 'План на 90 дней', q: 'Что изменится через 90 дней?', d: [540, 400], m: [300, 222], final: true,
      todo: 'Выберете три результата с цифрой, сроком, ответственным и бюджетом и разложите их на 30, 60 и 90 дней.',
      ex: '30 дней — проверить главное предположение. 60 — улучшить то, что сработало. 90 — сравнить результат с целью.',
      doneLabel: 'Первое действие —', done: 'в ближайшие 48 часов.' }
  ];
  var LAYOUT = {
    d: { w: 620, h: 500, path: 'M70 80 H510 A80 80 0 0 1 510 240 H130 A80 80 0 0 0 130 400 H540', sw: 30, dash: '7 9', dw: 2, size: 44, fin: 56, font: 15 },
    m: { w: 350, h: 280, path: 'M37 42 H283 A45 45 0 0 1 283 132 H70 A45 45 0 0 0 70 222 H300', sw: 20, dash: '5 7', dw: 1.5, size: 34, fin: 42, font: 13 }
  };

  var box = document.querySelector('[data-stops-map]');
  var svg = box.querySelector('[data-stops-svg]');
  var mq = window.matchMedia('(max-width: 640px)');
  var btns = [], lbls = [];

  DATA.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'stop-btn' + (s.final ? ' final' : ''); b.textContent = s.n;
    b.setAttribute('aria-label', s.final ? 'Финиш: план на 90 дней' : 'Остановка ' + s.n + ': ' + s.name);
    b.addEventListener('click', function () { st.stop = i; render(); });
    var l = document.createElement('div');
    l.className = 'stop-lbl';
    l.innerHTML = '<b></b><span></span>';
    l.firstChild.textContent = s.name; l.lastChild.textContent = s.final ? 'Ваш план' : s.q;
    box.appendChild(b); box.appendChild(l);
    btns.push(b); lbls.push(l);
  });

  function layout() {
    var L = mq.matches ? LAYOUT.m : LAYOUT.d, key = mq.matches ? 'm' : 'd';
    svg.setAttribute('viewBox', '0 0 ' + L.w + ' ' + L.h);
    var p1 = svg.querySelector('[data-p1]'), p2 = svg.querySelector('[data-p2]');
    p1.setAttribute('d', L.path); p1.setAttribute('stroke-width', L.sw);
    p2.setAttribute('d', L.path); p2.setAttribute('stroke-width', L.dw); p2.setAttribute('stroke-dasharray', L.dash);
    DATA.forEach(function (s, i) {
      var xy = s[key], size = s.final ? L.fin : L.size;
      var b = btns[i], l = lbls[i];
      b.style.left = (xy[0] / L.w * 100) + '%'; b.style.top = (xy[1] / L.h * 100) + '%';
      b.style.width = b.style.height = size + 'px'; b.style.fontSize = (s.final ? L.font + 1 : L.font) + 'px';
      var half = (key === 'm' ? 45 : 70);
      var lx = Math.max(half + 4, Math.min(L.w - half - 4, xy[0]));
      l.style.left = (lx / L.w * 100) + '%';
      l.style.top = ((xy[1] + size / 2 + (key === 'm' ? 6 : 10)) / L.h * 100) + '%';
    });
  }

  function set(key, val) { var el = document.querySelector('[data-cur="' + key + '"]'); if (el) el.textContent = val; }

  function render() {
    var sel = Math.max(0, Math.min(DATA.length - 1, st.stop)), c = DATA[sel];
    btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === sel ? 'true' : 'false'); lbls[i].classList.toggle('on', i === sel); });
    set('label', c.final ? 'ФИНИШ · 90 ДНЕЙ' : 'ОСТАНОВКА ' + String(c.n).padStart(2, '0') + ' / 07');
    set('title', c.title); set('q', c.q); set('todo', c.todo); set('ex', c.ex);
    set('doneLabel', c.doneLabel); set('done', c.done); set('pos', (sel + 1) + ' / ' + DATA.length);
    document.querySelector('[data-prev]').disabled = sel === 0;
    document.querySelector('[data-next]').disabled = sel === DATA.length - 1;
    FBT.toggle({ got: st.got, notGot: !st.got });
    var rc = document.querySelector('[data-rc2]');
    if (rc) rc.className = st.got ? 'done' : 'now';
    FBT.store.set('fbt_p2', { gotMap: st.got, stop: sel });
  }

  document.querySelector('[data-prev]').addEventListener('click', function () { st.stop--; render(); });
  document.querySelector('[data-next]').addEventListener('click', function () { st.stop++; render(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-getmap]')) { st.got = true; FBT.markMap(); render(); }
  });
  (mq.addEventListener ? mq.addEventListener('change', layout) : mq.addListener(layout));
  layout(); render();
})();
