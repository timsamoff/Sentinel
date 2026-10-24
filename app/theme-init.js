// Runs in <head> before first paint: applies a saved theme so the page never flashes the wrong one.
try {
  var savedTheme = localStorage.getItem('sentinel-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
} catch (e) {}
