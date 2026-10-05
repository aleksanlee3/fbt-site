/*
  FBT Online — тихая фоновая музыка (все страницы, кроме урока).
  Браузеры не дают включить звук, пока человек не коснулся экрана, поэтому музыка
  начинается с первого нажатия / касания и плавно нарастает до тихой громкости.
  Кнопка 🔇 слева внизу; если человек выключил музыку — она больше не включается (запоминаем).
  Пока играет видеоотзыв или вкладка свёрнута — музыка на паузе.
  Настройки — config.js → music: { src, volume } ; выключить совсем — music: false
*/
(function () {
  var C = window.FBT_CONFIG || {};
  var M = C.music;
  if (M === false) return;
  M = M || {};
  var SRC = M.src || 'assets/audio/fon-1.mp3';
  // Сравнить треки: ?track=1 (грустнее) или ?track=2 (теплее) — выбор держится до закрытия вкладки
  try {
    var tq = (location.search.match(/[?&]track=(\d)/) || [])[1];
    if (tq) sessionStorage.setItem('fbt_music_track', tq);
    var tr = sessionStorage.getItem('fbt_music_track');
    if (tr) SRC = 'assets/audio/fon-' + tr + '.mp3';
  } catch (e) {}
  var VOL = M.volume != null ? M.volume : 0.18;
  var KEY = 'fbt_music_off', POS = 'fbt_music_pos';

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  var audio = new Audio(SRC);
  audio.loop = true; audio.preload = 'auto'; audio.setAttribute('playsinline', '');
  var ctx = null, gain = null, started = false, off = get(KEY) === '1', want = !off;

  // На iPhone громкость <audio> не меняется — делаем её через Web Audio
  function setupGain() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      gain = ctx.createGain(); gain.gain.value = 0;
      ctx.createMediaElementSource(audio).connect(gain); gain.connect(ctx.destination);
    } catch (e) { ctx = null; gain = null; }
  }
  function fade(to, ms) {
    if (gain && ctx) {
      var t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(to, t + ms / 1000);
    } else {
      audio.volume = Math.max(0, Math.min(1, to));
    }
  }

  function play() {
    if (!want || blocked()) return;
    setupGain();
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    if (!started) { var p = parseFloat(sget(POS) || '0'); if (p > 0) try { audio.currentTime = p; } catch (e) {} }
    if (!gain) audio.volume = 0;
    var pr = audio.play();
    var go = function () {
      if (!want) return;
      var again = started;
      started = true; unbind(); fade(VOL, again ? 1500 : 2500); render();
    };
    var ok = function () {
      if (ctx && ctx.state !== 'running') {           // звук ещё не разрешён — включится, как только браузер позволит
        try { ctx.resume().then(function () { if (ctx.state === 'running') go(); }).catch(function () {}); } catch (e) {}
        return;
      }
      go();
    };
    if (pr && pr.then) pr.then(ok).catch(function () { render(); }); else ok();
  }
  function pause(ms) {
    fade(0, ms || 400);
    setTimeout(function () { if (!want || blocked() || document.hidden) audio.pause(); render(); }, (ms || 400) + 50);
  }

  // Видеоотзыв или открытое видео — музыку не включаем
  function blocked() {
    if (document.querySelector('.rv.is-on, .rv-modal')) return true;
    var F = window.FBT; return !!(F && F.lessonAudible && F.lessonAudible());   // урок Любы идёт со звуком
  }

  // Запуск: сразу при открытии (если браузер разрешает — например, человек уже касался сайта),
  // иначе — с первого касания экрана. Пробуем на каждом касании, пока музыка не заиграет.
  var EVENTS = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
  function first(e) {
    if (started) return;
    var t = e && e.target;                                       // касание по видео урока — это запуск урока, не музыки
    if (t && t.closest && t.closest('.player')) return;
    play();
  }
  function unbind() { EVENTS.forEach(function (e) { document.removeEventListener(e, first, true); window.removeEventListener(e, first, true); }); }
  if (want) {
    EVENTS.forEach(function (e) { window.addEventListener(e, first, { capture: true, passive: true }); });
    play();                                                        // попытка сразу при открытии
    window.addEventListener('load', function () { if (!started) play(); });
    window.addEventListener('pageshow', function () { if (!started) play(); });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (started) { audio.pause(); } }
    else if (started && want && !blocked()) play();
  });
  window.addEventListener('pagehide', function () { if (!audio.paused) sset(POS, String(audio.currentTime)); });
  setInterval(function () {
    if (!audio.paused) sset(POS, String(audio.currentTime));
    if (!started || !want) return;
    if (blocked() && !audio.paused) pause(300);
    else if (!blocked() && audio.paused && !document.hidden) play();
  }, 400);

  // ── Кнопка звука ──
  var btn;
  var ICON_ON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';
  function render() {
    if (!btn) return;
    var on = want && !audio.paused;
    btn.innerHTML = on ? ICON_ON : ICON_OFF;
    btn.setAttribute('aria-label', on ? 'Выключить музыку' : 'Включить музыку');
    btn.classList.toggle('is-on', on);
  }
  function build() {
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'mus-btn';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (want && !audio.paused) { want = false; set(KEY, '1'); pause(300); }
      else { want = true; set(KEY, null); play(); }
      render();
    });
    document.body.appendChild(btn);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
