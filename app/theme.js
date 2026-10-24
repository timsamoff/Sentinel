// Icon-only light/dark toggle. With no saved choice the page follows the system setting.
(function () {
  var KEY = 'sentinel-theme';
  var root = document.documentElement;
  var button = document.querySelector('.theme-toggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  if (!button) return;

  function currentTheme() {
    return root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
  }

  function syncButton() {
    button.setAttribute('aria-pressed', String(currentTheme() === 'dark'));
  }

  button.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    syncButton();
  });

  systemDark.addEventListener('change', syncButton);

  button.hidden = false;
  syncButton();
})();
