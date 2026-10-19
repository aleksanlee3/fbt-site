/* 19.10 (Александр): бесплатный закрытый бизнес-разбор с Любой — каждую среду в 12:00 по Ташкенту.
   Считает ближайшую встречу и показывает таймер в блоке [data-rz-timer] (главная и «После запуска»).
   Настройки — config.js → razbor. Также даёт FBT.razbor.next() и FBT.razbor.label() для окна артефактов. */
(function () {
  var C = (window.FBT_CONFIG && window.FBT_CONFIG.razbor) || {};
  var WD = C.weekday == null ? 3 : C.weekday, H = C.hour == null ? 12 : C.hour, MI = C.minute || 0;
  var TZ = 5 * 3600e3;                                     // Ташкент, UTC+5, без перехода на летнее время
  var MON = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var DAY = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  var SKIP = C.skip || [];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function next(now) {
    now = now || Date.now();
    var t = new Date(now + TZ);                            // «ташкентское» время в UTC-полях
    var d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), H, MI));
    var add = (WD - d.getUTCDay() + 7) % 7;
    d.setUTCDate(d.getUTCDate() + add);
    for (var i = 0; i < 60; i++) {
      var key = d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
      if (d.getTime() - TZ > now && SKIP.indexOf(key) < 0) break;
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return new Date(d.getTime() - TZ);                     // настоящий момент начала
  }
  function label(at) {
    var t = new Date(at.getTime() + TZ);
    return DAY[t.getUTCDay()] + ', ' + t.getUTCDate() + ' ' + MON[t.getUTCMonth()] + ', ' + pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes());
  }
  var api = { next: next, label: label, seats: C.seats || 7 };
  if (window.FBT) window.FBT.razbor = api; else window.FBT_RAZBOR = api;

  function run() {
    var boxes = document.querySelectorAll('[data-rz-timer]'); if (!boxes.length) return;
    var at = next();
    function q(b, k) { return b.querySelector('[data-rz-' + k + ']'); }
    function tick() {
      var ms = at.getTime() - Date.now();
      if (ms <= 0) { at = next(); ms = at.getTime() - Date.now(); }
      var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sc = s % 60;
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        q(b, 'date').textContent = label(at);
        q(b, 'd').textContent = d; q(b, 'h').textContent = pad(h); q(b, 'm').textContent = pad(m); q(b, 's').textContent = pad(sc);
        var di = q(b, 'd').nextElementSibling; if (di) di.textContent = d % 10 === 1 && d % 100 !== 11 ? 'день' : (d % 10 >= 2 && d % 10 <= 4 && (d % 100 < 10 || d % 100 >= 20) ? 'дня' : 'дней');
      }
    }
    tick(); setInterval(tick, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
