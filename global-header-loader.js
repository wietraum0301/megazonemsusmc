(function () {
  function ensureStyles() {
    if (!document.querySelector('link[href="global-header.css"]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'global-header.css';
      document.head.appendChild(css);
    }

    if (!document.querySelector('link[href*="Material+Symbols+Outlined"]')) {
      var icons = document.createElement('link');
      icons.rel = 'stylesheet';
      icons.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      document.head.appendChild(icons);
    }
  }

  function wireDropdowns(root) {
    var dropdowns = root.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(function (dropdown) {
      dropdown.addEventListener('mouseenter', function () {
        dropdowns.forEach(function (d) { d.classList.remove('active'); });
        dropdown.classList.add('active');
      });
      dropdown.addEventListener('mouseleave', function () {
        dropdown.classList.remove('active');
      });
    });
  }

  function mountHeader() {
    var mountPoint = document.querySelector('[data-global-header]');
    if (!mountPoint) {
      return;
    }

    ensureStyles();

    fetch('global-header.html', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Failed to load global-header.html');
        }
        return res.text();
      })
      .then(function (html) {
        mountPoint.innerHTML = html;
        wireDropdowns(mountPoint);
      })
      .catch(function (err) {
        console.error('[global-header-loader]', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHeader);
  } else {
    mountHeader();
  }
})();
