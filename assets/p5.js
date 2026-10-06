/* Стр. 5 · «Бизнес, который работает на семью»: «Отправить эту страницу семье» (Telegram) и копирование ссылки. */
(function () {
  var url = (window.FBT_SHARE_URL || window.location.href.split('#')[0]).split('?')[0];
  var text = 'Посмотри: как создать устойчивый семейный бизнес — чтобы он работал на семью, а не забирал её время. Давай обсудим — может, пойдём на FBT вместе?';
  var tg = document.querySelector('[data-share-tg]');
  var copy = document.querySelector('[data-share-copy]');
  var note = document.querySelector('[data-share-note]');
  if (tg) tg.href = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  if (copy) copy.addEventListener('click', function () {
    function done(ok) { if (note) note.textContent = ok ? 'Ссылка скопирована — отправьте её в семейный чат.' : 'Ссылка: ' + url; }
    try {
      navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
    } catch (e) { done(false); }
  });
})();
