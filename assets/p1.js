/* Стр. 1 · Видеоурок: плеер, отсчёт до карты, состояния кнопок */
(function () {
  var C = FBT.cfg, V = C.video || {};
  var TOTAL = Math.max(60, Number(V.length) || 1800);
  var UNLOCK = Math.max(30, Math.min(TOTAL, Number(V.unlockAt) || 1770));
  var qs = new URLSearchParams(location.search);
  var demoSpeed = Math.max(1, Math.min(600, Number(qs.get('demo')) || 1));
  if (qs.has('reset')) { FBT.store.set('fbt_p1', {}); FBT.store.set('fbt_map', 0); }

  var saved = FBT.store.get('fbt_p1', {}) || {};
  var st = {
    pos: Math.max(0, Math.min(TOTAL, Number(saved.pos) || 0)),   // сколько досмотрено (сек)
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

  var lastSaved = '';
  function save() {
    var s = JSON.stringify({ pos: Math.round(st.pos), reached: st.reached, gotMap: st.gotMap });
    if (s !== lastSaved) { FBT.store.set('fbt_p1', JSON.parse(s)); lastSaved = s; }
  }

  function render() {
    if (st.pos >= UNLOCK) st.reached = true;
    var open = st.reached, got = open && st.gotMap;
    FBT.toggle({ locked: !open, unlocked: open && !got, got: got, notGot: !got, openAny: open });
    FBT.text('timeLeft', fmt(UNLOCK - st.pos));
    FBT.text('posLabel', fmt(st.pos));
    FBT.text('lenLabel', fmt(TOTAL));
    FBT.text('step2Badge', got ? 'Карта в боте' : 'Доступ открыт');
    el.played.style.width = (st.pos / TOTAL * 100).toFixed(2) + '%';
    el.marker.style.left = (UNLOCK / TOTAL * 100).toFixed(2) + '%';
    el.progress.style.width = (open ? 100 : Math.min(100, st.pos / UNLOCK * 100)).toFixed(1) + '%';
    el.player.classList.toggle('is-playing', st.playing);
    el.play.setAttribute('aria-label', st.playing ? 'Пауза' : 'Смотреть видео');
    if (el.step2) el.step2.className = open ? 'done' : '';
    save();
  }

  // Нажатие «Забрать карту в боте»: ссылка сама открывает бота, здесь отмечаем, что карта получена
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-getmap]');
    if (!a) return;
    st.gotMap = true; FBT.markMap(); render();
  });

  // ── Плеер ───────────────────────────────────────────────
  var type = V.type === 'youtube' && V.src ? 'youtube' : (V.type === 'file' && V.src ? 'file' : 'demo');

  if (type === 'demo') {
    document.querySelector('[data-demo-note]').hidden = false;
    setInterval(function () {
      if (!st.playing) return;
      st.pos = Math.min(TOTAL, st.pos + demoSpeed);
      if (st.pos >= TOTAL) st.playing = false;
      render();
    }, 1000);
    el.play.addEventListener('click', function () { st.playing = !st.playing && st.pos < TOTAL; render(); });
  }

  // Общая защита для настоящего видео: без перемотки вперёд дальше досмотренного, скорость до ×1,5
  function track(getTime, seek, getRate, setRate) {
    setInterval(function () {
      var t = getTime();
      if (t == null || isNaN(t)) return;
      if (t > st.pos + 3) { seek(st.pos); return; }            // перемотка вперёд — возвращаем
      if (t > st.pos) st.pos = Math.min(TOTAL, t);
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
    v.addEventListener('loadedmetadata', function () { if (st.pos > 5 && st.pos < TOTAL - 5) v.currentTime = st.pos; });
    v.addEventListener('play', function () { st.playing = true; });
    v.addEventListener('pause', function () { st.playing = false; });
    track(function () { return v.currentTime; }, function (t) { v.currentTime = t; },
      function () { return v.playbackRate; }, function (r) { v.playbackRate = r; });
  }

  if (type === 'youtube') {
    el.player.classList.add('is-real');
    var box = document.createElement('div');
    box.id = 'yt-player';
    el.stage.appendChild(box);
    var yt = null;
    window.onYouTubeIframeAPIReady = function () {
      yt = new YT.Player('yt-player', {
        videoId: V.src,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.floor(st.pos > 5 ? st.pos : 0) },
        events: {
          onReady: function () {
            track(function () { return yt.getCurrentTime(); }, function (t) { yt.seekTo(t, true); },
              function () { return yt.getPlaybackRate(); }, function (r) { yt.setPlaybackRate(r); });
          },
          onStateChange: function (e) { st.playing = e.data === 1; }
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
