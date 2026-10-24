// Page filter. Hides blocks that don't contain every typed word, opens matching folds, and marks matches.
(function () {
  var search = document.querySelector('search');
  var input = document.getElementById('page-filter');
  var clearButton = document.querySelector('.filter-clear');
  var status = document.querySelector('.filter-status');
  var sectionEls = [].slice.call(document.querySelectorAll('main > section[id]:not(.hero)'));
  var contentsLinks = [].slice.call(document.querySelectorAll('.contents a[href^="#"]'));

  if (!search || !input || !clearButton || !status || !sectionEls.length) return;

  var sections = sectionEls.map(readSection);
  var hiddenEls = [];
  var marks = [];
  var savedFolds = null;
  var timer;

  function textOf(el) {
    return el.textContent.toLowerCase().replace(/\s+/g, ' ');
  }

  // A block is one thing that shows or hides as a unit: a paragraph, list item,
  // fold, code block, or a term with its description.
  function readSection(el) {
    var blocks = [];
    var lists = [];
    var pair = null;

    [].slice.call(el.children).forEach(function (child) {
      var tag = child.tagName;
      if (tag === 'P' && !child.classList.contains('fold-controls')) {
        blocks.push({ els: [child] });
      } else if (tag === 'DETAILS' || child.classList.contains('code-block')) {
        blocks.push({ els: [child], fold: tag === 'DETAILS' ? child : null });
      } else if (tag === 'UL' || tag === 'OL') {
        var items = [].slice.call(child.children).map(function (li) { return { els: [li] }; });
        blocks = blocks.concat(items);
        lists.push({ el: child, blocks: items });
      } else if (tag === 'DL') {
        var pairs = [];
        [].slice.call(child.children).forEach(function (node) {
          if (node.tagName === 'DT') {
            pair = { els: [node] };
            pairs.push(pair);
          } else if (pair) {
            pair.els.push(node);
          }
        });
        blocks = blocks.concat(pairs);
        lists.push({ el: child, blocks: pairs });
      }
    });

    blocks.forEach(function (block) {
      block.text = block.els.map(textOf).join(' ');
    });

    var heading = el.querySelector('h2');
    return { el: el, heading: heading, headingText: textOf(heading), blocks: blocks, lists: lists };
  }

  function hasAll(text, terms) {
    return terms.every(function (term) { return text.indexOf(term) !== -1; });
  }

  function hide(el) {
    el.hidden = true;
    hiddenEls.push(el);
  }

  function unhideAll() {
    hiddenEls.forEach(function (el) { el.hidden = false; });
    hiddenEls = [];
  }

  function removeMarks() {
    var parents = [];
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parents.push(parent);
    });
    parents.forEach(function (parent) { parent.normalize(); });
    marks = [];
  }

  function mergeRanges(ranges) {
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    ranges.forEach(function (range) {
      var last = merged[merged.length - 1];
      if (last && range[0] <= last[1]) {
        last[1] = Math.max(last[1], range[1]);
      } else {
        merged.push([range[0], range[1]]);
      }
    });
    return merged;
  }

  function highlight(root, terms) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var lower = text.toLowerCase();
      var ranges = [];
      if (lower.length !== text.length) return;
      terms.forEach(function (term) {
        var at = lower.indexOf(term);
        while (at !== -1) {
          ranges.push([at, at + term.length]);
          at = lower.indexOf(term, at + term.length);
        }
      });
      // Work from the end so earlier offsets stay valid as the node is split.
      mergeRanges(ranges).reverse().forEach(function (range) {
        node.splitText(range[1]);
        var middle = node.splitText(range[0]);
        var mark = document.createElement('mark');
        middle.parentNode.insertBefore(mark, middle);
        mark.appendChild(middle);
        marks.push(mark);
      });
    });
  }

  function announce(text) {
    status.textContent = text;
  }

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

  function tellOthers() {
    document.dispatchEvent(new CustomEvent('sentinel:filter'));
  }

  function clearFilter() {
    removeMarks();
    unhideAll();
    if (savedFolds) {
      savedFolds.forEach(function (wasOpen, fold) { fold.open = wasOpen; });
      savedFolds = null;
    }
    clearButton.hidden = true;
    announce('');
    tellOthers();
  }

  function applyFilter(query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    var results = 0;
    var sectionCount = 0;

    if (!terms.length) {
      clearFilter();
      return;
    }

    removeMarks();
    unhideAll();

    if (!savedFolds) {
      savedFolds = new Map();
      sections.forEach(function (section) {
        section.blocks.forEach(function (block) {
          if (block.fold) savedFolds.set(block.fold, block.fold.open);
        });
      });
    }

    sections.forEach(function (section) {
      var headingMatches = hasAll(section.headingText, terms);
      var matched = 0;

      section.blocks.forEach(function (block) {
        var matches = hasAll(block.text, terms);
        if (matches) matched += 1;
        if (matches || headingMatches) {
          if (block.fold) block.fold.open = true;
          block.els.forEach(function (el) { highlight(el, terms); });
        } else {
          block.els.forEach(hide);
        }
      });

      section.lists.forEach(function (list) {
        var anyShown = list.blocks.some(function (block) { return !block.els[0].hidden; });
        if (!anyShown) hide(list.el);
      });

      if (matched || headingMatches) {
        highlight(section.heading, terms);
        results += matched || 1;
        sectionCount += 1;
      } else {
        hide(section.el);
      }
    });

    contentsLinks.forEach(function (link) {
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (target && target.hidden) hide(link.parentNode);
    });

    clearButton.hidden = false;
    announce(results
      ? plural(results, 'result') + ' in ' + plural(sectionCount, 'section') + '.'
      : 'No results for "' + query.trim() + '".');
    tellOthers();
  }

  function reset() {
    input.value = '';
    clearFilter();
  }

  input.addEventListener('input', function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { applyFilter(input.value); }, 200);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault();
      reset();
    }
  });

  clearButton.addEventListener('click', function () {
    reset();
    input.focus();
  });

  // A link to a section the filter has hidden clears the filter first.
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href^="#"]');
    var target = link && document.getElementById(link.getAttribute('href').slice(1));
    if (target && target.hidden) reset();
  });

  search.hidden = false;
})();
