// Open all / Close all for the folds in "What to expect".
(function () {
  var controls = document.querySelector('.fold-controls');
  var folds = [].slice.call(document.querySelectorAll('#what-to-expect details'));

  if (!controls || !folds.length) return;

  controls.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-fold-action]');
    if (!button) return;
    var open = button.getAttribute('data-fold-action') === 'open';
    folds.forEach(function (fold) { fold.open = open; });
  });

  controls.hidden = false;
})();
