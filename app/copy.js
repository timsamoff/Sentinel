// Copy buttons for the install commands. Each shows a check mark and a "Copied" note, or a plain failure note.
(function () {
  // Older browsers and non-secure pages have no clipboard API.
  function legacyCopy(text) {
    var area = document.createElement('textarea');
    var ok = false;
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.appendChild(area);
    area.select();
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(area);
    return ok;
  }

  function setUp(block) {
    var button = block.querySelector('.copy-button');
    var source = button && document.getElementById(button.getAttribute('data-copy-target'));
    var status = block.querySelector('.copy-status');
    var timer;

    if (!button || !source || !status) return;

    function say(message, copied, ms) {
      window.clearTimeout(timer);
      status.textContent = message;
      if (copied) {
        button.setAttribute('data-copied', '');
      } else {
        button.removeAttribute('data-copied');
      }
      timer = window.setTimeout(function () {
        status.textContent = '';
        button.removeAttribute('data-copied');
      }, ms);
    }

    function copiedOk() {
      say('Copied', true, 2000);
    }

    function copyFailed() {
      say('Copy failed. Select the command and copy it by hand.', false, 5000);
    }

    function copyWithFallback(text) {
      if (legacyCopy(text)) {
        copiedOk();
      } else {
        copyFailed();
      }
    }

    button.addEventListener('click', function () {
      var text = source.textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(copiedOk, function () { copyWithFallback(text); });
      } else {
        copyWithFallback(text);
      }
    });

    button.hidden = false;
  }

  [].slice.call(document.querySelectorAll('.code-block')).forEach(setUp);
})();
