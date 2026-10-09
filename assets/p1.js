/* Стр. 1 · Видеоурок: плеер, поэтапная длительность, отсчёт до карты, состояния кнопок */
(function () {
  var C = FBT.cfg, V = C.video || {};
  var qs = new URLSearchParams(location.search);
  // Тестовый режим: 30 секунд вместо урока. Включается в config.js (testMode) или адресом ?test
  var TEST = !!C.testMode || !!C.videoTest || qs.has('test');
  var realLen = Math.max(60, Number(V.length) || 1800);                // уточняется у плеера
  var UNLOCK_CFG = Math.max(30, Number(V.unlockAt) || 1770);
  var STAGES = (V.stages || [180, 600]).map(Number).filter(function (s) { return s > 0; }).sort(function (a, b) { return a - b; });
  var demoSpeed = Math.max(1, Math.min(600, Number(qs.get('demo')) || 1));
  if (qs.has('reset')) { FBT.store.set('fbt_p1', {}); FBT.store.set('fbt_map', 0); }

  function TOTAL() { return TEST ? 30 : realLen; }
  function UNLOCK() { return TEST ? 30 : Math.min(TOTAL(), UNLOCK_CFG); }
  // Сколько длится видео «для зрителя»: 3:00 → 10:00 → настоящая длина
  function shownLen() {
    if (TEST) return 30;
    for (var i = 0; i < STAGES.length; i++) if (st.pos < STAGES[i] && STAGES[i] < realLen) return STAGES[i];
    return realLen;
  }

  var saved = FBT.store.get('fbt_p1', {}) || {};
  var st = {
    pos: Math.max(0, Number(saved.pos) || 0),   // докуда дошёл ползунок (сек)
    played: Math.max(0, Number(saved.pl) || 0), // 09.10: сколько секунд реально проиграно (всего, с пересмотрами)
    reached: !!saved.reached,
    gotMap: !!saved.gotMap || FBT.gotMap(),
    playing: false
  };

  var el = {
    player: document.querySelector('.player'),
    stage: document.querySelector('[data-player-stage]'),
    play: document.querySelector('[data-play]'),
    played: document.querySelector('[data-played]'),
    marker: document.querySelector('[data-marker]'),
    progress: document.querySelector('[data-progress]'),
    step2: document.querySelector('[data-step2]')
  };

  function fmt(sec) { sec = Math.max(0, Math.round(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }

  // ── События для бота (когда будет сервер): минута просмотра и момент открытия карты ──
  // 09.10: в каждом событии видео — played: секунды, которые реально проигрались (не позиция ползунка).
  // Так в Notion видно разницу между «дошёл до конца» и «смотрел 30 секунд».
  function event(name, data) { data = data || {}; data.played = Math.round(st.played); FBT.event(name, data); }
  var lastMin = Math.floor(st.pos / 60), lastPlayedMin = Math.floor(st.played / 60);
  function report() {
    var m = Math.floor(st.pos / 60), pm = Math.floor(st.played / 60);
    if (m > lastMin || pm > lastPlayedMin) {
      lastMin = Math.max(lastMin, m); lastPlayedMin = Math.max(lastPlayedMin, pm);
      event('video_progress', { minute: m, sec: Math.round(st.pos), duration: Math.round(TOTAL()) });
    }
  }
  window.addEventListener('pagehide', function () { event('video_leave', { sec: Math.round(st.pos), minute: Math.floor(st.pos / 60), duration: Math.round(TOTAL()) }); });
  var ended = false;
  function videoEnd() {            // 09.10: ролик доиграл до последней секунды
    if (ended) return;
    ended = true;
    event('video_end', { sec: Math.round(st.pos), duration: Math.round(TOTAL()) });
  }

  var lastSaved = '';
  function save() {
    var s = JSON.stringify({ pos: Math.round(st.pos), pl: Math.round(st.played), reached: st.reached, gotMap: st.gotMap });
    if (s !== lastSaved) { FBT.store.set('fbt_p1', JSON.parse(s)); lastSaved = s; }
  }

  function render() {
    if (st.pos >= UNLOCK() && !st.reached) { st.reached = true; event('video_unlock', { sec: Math.round(st.pos), duration: Math.round(TOTAL()) }); if (FBT.medal) FBT.medal('shag'); }
    if (st.pos >= 60 && FBT.albumShow) FBT.albumShow();   // альбом на стр. 1 — только после минуты урока (30.09)
    var open = st.reached, got = open && st.gotMap;
    var len = shownLen(), finalStage = len >= TOTAL();
    FBT.toggle({ locked: !open, unlocked: open && !got, got: got, notGot: !got, openAny: open });
    if (open) { var c2 = document.querySelector('[data-watch-cue]'); if (c2) c2.classList.add('is-off'); }  // урок досмотрен — стрелка не нужна
    // До последнего этапа «осталось» считаем от показанной длины — не выдаём настоящую
    FBT.text('timeLeft', fmt(finalStage ? UNLOCK() - st.pos : len - st.pos));
    FBT.text('posLabel', fmt(st.pos));
    FBT.text('lenLabel', fmt(len));
    FBT.text('step2Badge', got ? 'Карта в боте' : 'Доступ открыт');
    el.played.style.width = Math.min(100, st.pos / len * 100).toFixed(2) + '%';
    el.marker.style.left = (UNLOCK() / TOTAL() * 100).toFixed(2) + '%';
    el.marker.hidden = !finalStage;
    el.progress.style.width = (open ? 100 : Math.min(100, st.pos / (finalStage ? UNLOCK() : len) * 100)).toFixed(1) + '%';
    el.player.classList.toggle('is-playing', st.playing);
    var cue = document.querySelector('[data-watch-cue]');
    if (cue && st.playing && !el.player.classList.contains('is-yt')) cue.classList.add('is-off');  // демо/файл: начали смотреть — стрелка не нужна
    el.play.setAttribute('aria-label', st.playing ? 'Пауза' : 'Смотреть видео');
    if (el.step2) el.step2.className = open ? 'done' : '';
    report();
    save();
  }

  // Нажатие «Забрать карту в боте»: человека не уводим с сайта — карту присылает бот, здесь сразу диагностика.
  // Связи с ботом нет (пришёл с рекламы, кода нет) — открываем Telegram: иначе карту доставить нечем.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-getmap]');
    if (!a) return;
    if (FBT.linked && FBT.linked()) e.preventDefault();   // карту отправит бот, событие шлёт fbt.js
    st.gotMap = true; FBT.markMap(); render();
  });

  // ── Плеер ───────────────────────────────────────────────
  var type = V.type === 'youtube' && V.src ? 'youtube' : (V.type === 'file' && V.src ? 'file' : 'demo');
  if (TEST) type = 'demo';
  // Фоновая музыка (assets/music.js) замолкает, пока урок идёт со звуком, и возвращается на паузе
  var lessonMuted = false;
  FBT.lessonAudible = function () { return !!st.playing && !lessonMuted; };
  st.pos = Math.min(st.pos, TOTAL());

  if (type === 'demo') {
    var note = document.querySelector('[data-demo-note]');
    note.hidden = false;
    if (TEST) note.innerHTML = '<b class="acc">Тестовый режим:</b> видео длится 30 секунд, карта и кнопки открываются в конце. Сбросить прогресс — добавьте к адресу <span class="mono">?reset</span>.';
    setInterval(function () {
      if (!st.playing) return;
      st.pos = Math.min(TOTAL(), st.pos + demoSpeed);
      st.played += 1;                                          // реальная секунда (при ?demo=N ползунок бежит быстрее)
      if (st.pos >= TOTAL()) { st.playing = false; videoEnd(); }
      render();
    }, 1000);
    el.play.addEventListener('click', function () { st.playing = !st.playing && st.pos < TOTAL(); render(); });
  }

  // Общая защита для настоящего видео: без перемотки вперёд дальше досмотренного, скорость до ×1,5
  var lastT = null;
  function track(getTime, seek, getRate, setRate) {
    setInterval(function () {
      var t = getTime();
      if (t == null || isNaN(t)) return;
      if (t > st.pos + 3) { seek(st.pos); lastT = st.pos; return; }   // перемотка вперёд — возвращаем
      // 09.10: реально проиграно — только плавный ход вперёд во время воспроизведения (шаг 0,5 с, скорость до ×1,5)
      if (st.playing && lastT != null && t > lastT && t - lastT <= 2) st.played += t - lastT;
      lastT = t;
      if (t > st.pos) st.pos = Math.min(TOTAL(), t);
      var r = getRate && getRate();
      if (r && r > 1.5) setRate(1.5);
      render();
    }, 500);
  }

  if (type === 'file') {
    el.player.classList.add('is-real');
    var v = document.createElement('video');
    v.src = V.src; v.controls = true; v.playsInline = true; v.preload = 'metadata';
    if (V.poster) v.poster = V.poster;
    el.stage.appendChild(v);
    v.addEventListener('loadedmetadata', function () {
      if (v.duration && isFinite(v.duration)) realLen = v.duration;
      if (st.pos > 5 && st.pos < TOTAL() - 5) v.currentTime = st.pos;
    });
    v.addEventListener('play', function () { st.playing = true; });
    v.addEventListener('pause', function () { st.playing = false; });
    v.addEventListener('ended', function () { st.playing = false; videoEnd(); render(); });
    track(function () { return v.currentTime; }, function (t) { v.currentTime = t; },
      function () { return v.playbackRate; }, function (r) { v.playbackRate = r; });
  }

  if (type === 'youtube') {
    // Плеер YouTube без его кнопок: время, полоска, звук и скорость — наши.
    // Поверх видео — «щит»: клики идут в наш плеер, меню и ролики YouTube не видны.
    el.player.classList.add('is-yt');
    var box = document.createElement('div');
    box.id = 'yt-player';
    el.stage.insertBefore(box, el.stage.firstChild);
    var shield = document.createElement('div');
    shield.className = 'yt-shield';
    el.stage.insertBefore(shield, box.nextSibling);

    var bar = document.createElement('div');
    bar.className = 'yt-ctrl';
    bar.innerHTML =
      '<button type="button" class="yt-sound" data-yt-sound hidden><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>Включить звук</button>' +
      '<span class="yt-sp"></span>' +
      '<button type="button" class="yt-btn mono" data-yt-rate aria-label="Скорость">1×</button>' +
      '<button type="button" class="yt-btn yt-fs" data-yt-fs aria-label="Во весь экран"><svg class="fs-in" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg><svg class="fs-out" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>';
    el.stage.appendChild(bar);
    var soundBtn = bar.querySelector('[data-yt-sound]'), rateBtn = bar.querySelector('[data-yt-rate]'), fsBtn = bar.querySelector('[data-yt-fs]');

    var yt = null, ready = false, muted = true, RATES = [1, 1.25, 1.5], rateI = 0;
    lessonMuted = true;
    function setMuted(m) {
      muted = m; lessonMuted = m;
      if (ready) { if (m) yt.mute(); else { yt.unMute(); yt.setVolume(100); } }
      soundBtn.hidden = !m;
      document.documentElement.classList.toggle('lesson-sound', !m);  // звук включён — стрелку «Смотрите это видео» убираем
    }
    // Время и кнопки скорости появляются только при наведении мышью или касании — 2,5 сек
    var uiTimer = null;
    function showUI() {
      el.player.classList.add('ui-on');
      clearTimeout(uiTimer);
      uiTimer = setTimeout(function () { el.player.classList.remove('ui-on'); }, 2500);
    }
    el.player.addEventListener('mousemove', showUI);
    var lastTouch = 0, hiddenAtTouch = false;
    shield.addEventListener('touchstart', function () { lastTouch = Date.now(); hiddenAtTouch = !el.player.classList.contains('ui-on'); }, { passive: true });
    var pendingPlay = false;
    function toggle() {
      if (!ready) { pendingPlay = true; showUI(); return; }
      var touch = Date.now() - lastTouch < 800, wasHidden = touch ? hiddenAtTouch : !el.player.classList.contains('ui-on');
      showUI();
      if (muted) { setMuted(false); if (!st.playing) yt.playVideo(); return; }  // первое касание — включить звук
      if (touch && wasHidden && st.playing) return;                            // касание на телефоне сначала показывает время
      if (st.playing) yt.pauseVideo(); else yt.playVideo();
    }
    shield.addEventListener('click', toggle);
    el.play.addEventListener('click', function () {
      if (!ready) { pendingPlay = true; showUI(); return; }
      setMuted(false);
      if (st.pos >= TOTAL() - 1) { st.pos = 0; yt.seekTo(0, true); }       // досмотрели — смотреть снова
      yt.playVideo();
    });
    // Если браузер не дал запустить видео само — запускаем при первом касании или клике на странице
    function firstGesture(e) {
      document.removeEventListener('pointerdown', firstGesture, true);
      document.removeEventListener('keydown', firstGesture, true);
      if (!ready || st.playing || st.pos >= TOTAL() - 5) return;
      if (e && e.target && e.target.closest && e.target.closest('a, .player')) return;  // ссылки и сам плеер — своя логика
      setMuted(false); yt.playVideo();
    }
    document.addEventListener('pointerdown', firstGesture, true);
    document.addEventListener('keydown', firstGesture, true);
    soundBtn.addEventListener('click', function (e) { e.stopPropagation(); setMuted(false); if (ready && !st.playing) yt.playVideo(); });
    rateBtn.addEventListener('click', function () {
      rateI = (rateI + 1) % RATES.length;
      rateBtn.textContent = String(RATES[rateI]).replace('.', ',') + '×';
      if (ready) yt.setPlaybackRate(RATES[rateI]);
    });
    // Во весь экран: настоящий полноэкранный режим, а где его нет (iPhone) — плеер на весь экран страницы
    var fsTarget = el.player;
    function nativeFs() { return document.fullscreenElement || document.webkitFullscreenElement; }
    function fsOn() { return !!nativeFs() || el.player.classList.contains('is-fs'); }
    function fsIcon() { fsBtn.classList.toggle('on', fsOn()); fsBtn.setAttribute('aria-label', fsOn() ? 'Выйти из полноэкранного режима' : 'Во весь экран'); }
    function pseudoFs(on) {
      el.player.classList.toggle('is-fs', on);
      document.documentElement.classList.toggle('fs-lock', on);
      fsIcon();
    }
    fsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (nativeFs()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (el.player.classList.contains('is-fs')) { pseudoFs(false); return; }
      var req = fsTarget.requestFullscreen || fsTarget.webkitRequestFullscreen;
      if (req) {
        try {
          var r = req.call(fsTarget);
          if (r && r.catch) r.catch(function () { pseudoFs(true); });
          try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(function () {}); } catch (x) {}
        } catch (x) { pseudoFs(true); }
      } else pseudoFs(true);
    });
    document.addEventListener('fullscreenchange', fsIcon);
    document.addEventListener('webkitfullscreenchange', fsIcon);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.player.classList.contains('is-fs')) pseudoFs(false); });

    window.onYouTubeIframeAPIReady = function () {
      yt = new YT.Player('yt-player', {
        videoId: V.src,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { origin: location.origin, controls: 0, disablekb: 1, fs: 0, rel: 0, iv_load_policy: 3, playsinline: 1, modestbranding: 1,
                      autoplay: 1, mute: 1, start: Math.floor(st.pos > 5 && st.pos < TOTAL() - 5 ? st.pos : 0) },
        events: {
          onReady: function () {
            ready = true;
            var d = yt.getDuration();
            if (d && d > 60) realLen = d;
            setMuted(true);
            if (pendingPlay || st.pos < TOTAL() - 5) yt.playVideo();       // учитываем клик во время загрузки; автозапуск без звука
            pendingPlay = false;
            track(function () { return yt.getCurrentTime(); }, function (t) { yt.seekTo(t, true); },
              function () { return yt.getPlaybackRate(); }, function (r) { yt.setPlaybackRate(r); });
            render();
          },
          onStateChange: function (e) {
            st.playing = e.data === 1;
            if (e.data === 1) { var d = yt.getDuration(); if (d && d > 60) realLen = d; }
            if (e.data === 0) { st.pos = TOTAL(); videoEnd(); }
            el.player.classList.toggle('yt-started', e.data === 1 || e.data === 3 || el.player.classList.contains('yt-started'));
            render();
          }
        }
      });
    };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }

  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
