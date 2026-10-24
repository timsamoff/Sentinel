// Open all / Close all: each button row acts on the folds in its own section.
(function () {
  var rows = [].slice.call(document.querySelectorAll('.fold-controls'));

  rows.forEach(function (controls) {
    var folds = [].slice.call(controls.closest('section').querySelectorAll('details'));
    if (!folds.length) return;

    controls.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-fold-action]');
      if (!button) return;
      var open = button.getAttribute('data-fold-action') === 'open';
      folds.forEach(function (fold) { fold.open = open; });
    });

    controls.hidden = false;
  });
})();
