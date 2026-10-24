// Marks the section in view with aria-current="location" in the header nav and the contents list.
(function () {
  var sections = [].slice.call(document.querySelectorAll('main > section[id]'));
  var links = [].slice.call(document.querySelectorAll('header nav a[href^="#"], .contents a[href^="#"]'));
  var header = document.querySelector('header');
  var panel = document.querySelector('.contents');
  var lastId;
  var queued = false;

  if (!sections.length || !links.length) return;

  function isShown(section) {
    return section.getClientRects().length > 0;
  }

  // The section whose top has passed a line a quarter of the way down the viewport.
  function findActiveId() {
    var shown = sections.filter(isShown);
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    var stickyHeader = header && window.getComputedStyle(header).position === 'sticky';
    var line = (stickyHeader ? header.offsetHeight : 0) + window.innerHeight * 0.25;
    var id = null;

    if (!shown.length) return null;
    if (atBottom) return shown[shown.length - 1].id;
    shown.forEach(function (section) {
      if (section.getBoundingClientRect().top <= line) id = section.id;
    });
    return id;
  }

  // Keeps the current link visible when the sticky contents panel scrolls on its own.
  function keepInView() {
    var current = panel && panel.querySelector('[aria-current]');
    if (!current || panel.scrollHeight <= panel.clientHeight) return;
    if (current.offsetTop < panel.scrollTop) {
      panel.scrollTop = current.offsetTop - 8;
    } else if (current.offsetTop + current.offsetHeight > panel.scrollTop + panel.clientHeight) {
      panel.scrollTop = current.offsetTop + current.offsetHeight - panel.clientHeight + 8;
    }
  }

  function update() {
    var id = findActiveId();
    queued = false;
    if (id === lastId) return;
    lastId = id;
    links.forEach(function (link) {
      if (id && link.getAttribute('href') === '#' + id) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    keepInView();
  }

  function queueUpdate() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
  document.addEventListener('sentinel:filter', queueUpdate);
  // Folds opening or closing moves everything below them. Toggle events don't bubble, so listen in capture.
  document.addEventListener('toggle', queueUpdate, true);
  update();
})();
