/* 14.10 (v5.30) · Шапка уезжает вверх при прокрутке, закреплён только маршрут.
   Есть маршрут (.route) → у .topbar отрицательный top на высоту всего, что над маршрутом:
   логотип, «О программе» и тема прокручиваются вместе со страницей, полоса «Вы на этапе N из 3» остаётся.
   Нет маршрута (программа, семья, политика) → шапка просто прокручивается со страницей. */
(function () {
  function fit() {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    var route = bar.querySelector('.route');
    if (!route) { bar.classList.add('topbar--free'); return; }
    bar.classList.add('topbar--route');
    var off = route.getBoundingClientRect().top - bar.getBoundingClientRect().top;
    bar.style.setProperty('--hdr-h', Math.round(off) + 'px');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit); else fit();
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
})();
