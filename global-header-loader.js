(function () {
  function getHeaderStore() {
    if (!window.GlobalStateManager) {
      return null;
    }

    if (!window.GlobalHeaderStore) {
      window.GlobalHeaderStore = window.GlobalStateManager.createStore({
        activeDropdownIndex: null,
      });
    }

    return window.GlobalHeaderStore;
  }

  function wireDropdowns(root) {
    var dropdowns = Array.prototype.slice.call(root.querySelectorAll('.nav-dropdown'));
    var nav = root.querySelector('nav');

    if (!dropdowns.length) {
      return;
    }

    var store = getHeaderStore();

    if (!store) {
      dropdowns.forEach(function (dropdown) {
        dropdown.addEventListener('mouseenter', function () {
          dropdowns.forEach(function (d) { d.classList.remove('active'); });
          dropdown.classList.add('active');
        });
        dropdown.addEventListener('mouseleave', function () {
          dropdown.classList.remove('active');
        });
      });
      return;
    }

    store.subscribe(function (state) {
      var isAnyDropdownActive = state.activeDropdownIndex !== null;

      if (nav) {
        nav.classList.toggle('nav-hover-active', isAnyDropdownActive);
      }

      dropdowns.forEach(function (dropdown, index) {
        var isActive = state.activeDropdownIndex === index;
        dropdown.classList.toggle('active', isActive);
        dropdown.classList.toggle('hover-active', isActive);
        var menu = dropdown.querySelector('.nav-dropdown-menu');
        if (menu) {
          try {
            menu.style.visibility = isActive ? 'visible' : 'hidden';
            menu.style.opacity = isActive ? '1' : '0';
            menu.style.transform = isActive ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(6px)';
          } catch (e) {}
        }
      });
    });

    dropdowns.forEach(function (dropdown, index) {
      var toggle = dropdown.querySelector('.nav-dropdown-toggle');

      if (toggle) {
        toggle.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();

          var nextIndex = store.getState().activeDropdownIndex === index ? null : index;
          store.setState({ activeDropdownIndex: nextIndex });

          var menu = dropdown.querySelector('.nav-dropdown-menu');
          if (menu) {
            try {
              var isActive = nextIndex === index;
              menu.style.visibility = isActive ? 'visible' : 'hidden';
              menu.style.opacity = isActive ? '1' : '0';
              menu.style.transform = isActive ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(6px)';
            } catch (e) {}
          }
        });
      }

      dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
      });
    });

    document.addEventListener('click', function () {
      if (store.getState().activeDropdownIndex !== null) {
        store.setState({ activeDropdownIndex: null });
      }
    });
  }

  function mountHeader() {
    var mountPoint = document.querySelector('[data-global-header]');
    if (!mountPoint) {
      return;
    }

    fetch('header.html', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Failed to load header.html');
        }
        return res.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var header = parsed.querySelector('nav');

        // Inject stylesheet links and style blocks from header.html into host page
        try {
          var parsedLinks = Array.prototype.slice.call(parsed.querySelectorAll('link[rel="stylesheet"]'));
          parsedLinks.forEach(function (l) {
            try {
              var href = l.href || l.getAttribute('href');
              if (!href) return;
              var exists = Array.prototype.slice.call(document.head.querySelectorAll('link[rel="stylesheet"]')).some(function (el) { return el.href === href; });
              if (!exists) {
                var nl = document.createElement('link'); nl.rel = 'stylesheet'; nl.href = href; document.head.appendChild(nl);
              }
            } catch (e) {}
          });

          var parsedStyles = Array.prototype.slice.call(parsed.querySelectorAll('style'));
          parsedStyles.forEach(function (s) {
            try {
              if (s.id && document.getElementById(s.id)) return;
              var ns = document.createElement('style'); if (s.id) ns.id = s.id; ns.appendChild(document.createTextNode(s.textContent || s.innerHTML || '')); document.head.appendChild(ns);
            } catch (e) {}
          });
        } catch (e) {}

        mountPoint.innerHTML = header ? header.outerHTML : html;
        // mounted nav left as-is; do not force visual overrides here
        // Inject hover CSS into document head so hover works when header is mounted
        try {
          if (!document.getElementById('global-header-hover-css')) {
            var css = '\n  .nav-dropdown:hover .nav-dropdown-menu { opacity: 1 !important; visibility: visible !important; transform: translateX(-50%) translateY(0) !important; pointer-events: auto !important; }\n  .nav-dropdown:hover .chevron { transform: rotate(180deg); }\n';
            var style = document.createElement('style');
            style.id = 'global-header-hover-css';
            style.appendChild(document.createTextNode(css));
            document.head.appendChild(style);
          }
          // no per-page nav override injected
        } catch (e) {}

        wireDropdowns(mountPoint);
        // Enforce icon colors on the mounted header to avoid host page CSS overrides
        try {
          (function enforceHeaderIconColors(){
            var mountedNav = mountPoint.querySelector('nav');
            if(!mountedNav) return;
            var dropdowns = Array.prototype.slice.call(mountedNav.querySelectorAll('.nav-dropdown')) || [];
            function setIconStyles(icon, bg, color){
              try{ icon.style.backgroundColor = bg; icon.style.color = color; icon.style.webkitTextFillColor = color; }catch(e){}
            }
            // Ensure 온라인 웨비나 (1st) and 다시보기 (4th) use primary blue unless item marked ended
            [0,3].forEach(function(idx){
              var d = dropdowns[idx]; if(!d) return;
              d.querySelectorAll('.dropdown-icon').forEach(function(icon){
                var a = icon.closest('a');
                if(a && a.classList && (a.classList.contains('is-ended') || a.classList.contains('is-pending'))) return;
                setIconStyles(icon, 'rgba(0,95,170,0.08)', '#005faa');
              });
            });
            // On-site (2nd) keep green accent except agent hackathon which stays ended/gray
            var onsite = dropdowns[1];
            if(onsite){
              onsite.querySelectorAll('.dropdown-icon').forEach(function(icon){
                var a = icon.closest('a');
                try{
                  if(a && a.href && a.href.indexOf('agenthackathon1.html') !== -1){
                    // mark ended and force gray
                    if(a.classList && !a.classList.contains('is-ended')) a.classList.add('is-ended');
                    setIconStyles(icon, '#e6e7eb', '#6b7280');
                  } else {
                    setIconStyles(icon, 'rgba(0,104,117,0.08)', '#006875');
                  }
                }catch(e){}
              });
            }
            // Reapply if header content changes later
            try{
              var obs = new MutationObserver(function(){ enforceHeaderIconColors(); });
              obs.observe(mountPoint, { childList: true, subtree: true });
            }catch(e){}
          })();

          // Also force orange styles for any dropdown items marked as "orange" (팝업 제안)
          try {
            dropdowns.forEach(function(dd){
              try {
                var orangeIcons = dd.querySelectorAll('.dropdown-item.orange .dropdown-icon') || [];
                Array.prototype.slice.call(orangeIcons).forEach(function(icon){
                  setIconStyles(icon, 'rgba(232,119,34,0.12)', '#E87722');
                });
              } catch (e) {}
            });
          } catch (e) {}

          // Inject persistent CSS rules to override any host styles that may force icons to black
          try {
            if (!document.getElementById('global-header-orange-css')) {
              var css = '\nheader[data-global-header] .nav-dropdown-menu .dropdown-item.orange .dropdown-icon { background-color: rgba(232,119,34,0.12) !important; color: #E87722 !important; }\nheader[data-global-header] .nav-dropdown-menu .dropdown-item.orange .dropdown-icon .material-symbols-outlined, header[data-global-header] .nav-dropdown-menu .dropdown-item.orange .dropdown-icon span { color: #E87722 !important; -webkit-text-fill-color: #E87722 !important; fill: #E87722 !important; }\n';
              var s = document.createElement('style');
              s.id = 'global-header-orange-css';
              s.appendChild(document.createTextNode(css));
              document.head.appendChild(s);
            }
          } catch (e) {}

          // Also ensure the 4th dropdown (다시보기) icons stay primary blue
          try {
            if (!document.getElementById('global-header-blue-css')) {
              var blueCss = '\nheader[data-global-header] .nav-dropdown:nth-of-type(4) .dropdown-icon { background-color: rgba(0,95,170,0.08) !important; color: #005faa !important; }\nheader[data-global-header] .nav-dropdown:nth-of-type(4) .dropdown-icon .material-symbols-outlined, header[data-global-header] .nav-dropdown:nth-of-type(4) .dropdown-icon span { color: #005faa !important; -webkit-text-fill-color: #005faa !important; fill: #005faa !important; }\n';
              var sb = document.createElement('style');
              sb.id = 'global-header-blue-css';
              sb.appendChild(document.createTextNode(blueCss));
              document.head.appendChild(sb);
            }
          } catch (e) {}
        } catch(e) {}
        // Remove any overly-broad header color rules that may have been
        // injected by host pages earlier and force white text across the
        // mounted header (breaks badges). Prefer removing the rule rather
        // than trying to override it with more !important rules.
        try {
          Array.from(document.styleSheets).forEach(function (ss) {
            var rules;
            try { rules = ss.cssRules; } catch (e) { return; }
            for (var i = rules.length - 1; i >= 0; i--) {
              var r = rules[i];
              try {
                if (r.selectorText && r.selectorText.indexOf('header[data-global-header] nav *') !== -1) {
                  ss.deleteRule(i);
                }
              } catch (e) {}
              // After mounting, detect nav background brightness and mark dark headers.
              try {
                var mountedNav = mountPoint.querySelector('nav');
                if (mountedNav) {
                  // mark brand link for easy styling
                  try {
                    var brand = mountedNav.querySelector('a');
                    if (brand) brand.classList.add('global-header-brand');
                  } catch (e) {}

                  // Prefer page-wide dark mode flags; otherwise compute background brightness
                  try {
                    var forcedDark = (document.documentElement && document.documentElement.classList && document.documentElement.classList.contains('dark')) ||
                      (document.body && document.body.classList && document.body.classList.contains('dark'));
                    if (forcedDark) {
                      mountedNav.classList.add('dark-header');
                    } else {
                      var cs = window.getComputedStyle(mountedNav);
                      var bg = cs.backgroundColor || cs.background;
                      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(bg);
                      if (m) {
                        var r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
                        var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                        if (luminance < 0.55) {
                          mountedNav.classList.add('dark-header');
                        }
                      }
                    }
                  } catch (e) {}

                  // Inject dark-header helper CSS if needed
                  try {
                    if (!document.getElementById('global-header-dark-css')) {
                      var css = '\n/* Dark header per-page helper styles */\n.dark-header .global-header-brand { color: #ffffff !important; }\n.dark-header .nav-dropdown:nth-of-type(-n+4) .nav-dropdown-toggle { color: #ffffff !important; background: transparent !important; border-color: rgba(255,255,255,0.06) !important; }\n.dark-header .nav-dropdown:nth-of-type(-n+4) .nav-dropdown-toggle .material-symbols-outlined { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }\n.dark-header .nav-dropdown-toggle { color: #ffffff !important; background: transparent !important; border-color: rgba(255,255,255,0.06) !important; }\n.dark-header .nav-dropdown-menu { background: rgba(255,255,255,0.95) !important; color: #101c2e !important; border-color: rgba(0,0,0,0.06) !important; box-shadow: 0 10px 30px rgba(2,8,23,0.08) !important; }\n';
                      var s = document.createElement('style');
                      s.id = 'global-header-dark-css';
                      s.appendChild(document.createTextNode(css));
                      document.head.appendChild(s);
                    }
                  } catch (e) {}
                }
              } catch (e) {}
            }
          });
        } catch (e) {}
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
