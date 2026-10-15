/* 15.10 v5.34 · Типографика: короткие слова («а», «и», «в», «не»…) не висят в конце строки,
   тире не переносится в начало строки. Работает на всех страницах. */
(function () {
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|CODE|PRE|SVG|TEXT|TITLE)$/i;
  var SHORT = /(^|[\s(«"„])([А-Яа-яЁёA-Za-z]{1,2})[ \t\n]+(?=\S)/g;
  var DASH = /[ \t\n]+([—–])(?=\s)/g;
  function fix(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        for (var p = n.parentNode; p && p !== root.parentNode; p = p.parentNode) {
          if (p.nodeType === 1 && SKIP.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        }
        return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (t) {
      var v = t.nodeValue, nv = v.replace(SHORT, '$1$2 ').replace(SHORT, '$1$2 ').replace(DASH, ' $1');
      if (nv !== v) t.nodeValue = nv;
    });
  }
  function run() { try { fix(document.body); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.addEventListener('load', function () { setTimeout(run, 300); });
})();
