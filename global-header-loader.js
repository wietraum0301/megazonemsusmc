(function () {
  // 즉시 실행: 페이지 로드 직후 기존 nav 제거
  function removeExistingNavs() {
    var navs = document.querySelectorAll('nav');
    navs.forEach(function(nav) {
      if (nav.parentNode) {
        nav.parentNode.removeChild(nav);
      }
    });
  }

  // 페이지 로드 전에 nav 제거 시도
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      removeExistingNavs();
    });
  } else {
    removeExistingNavs();
  }

  // 100ms 후 다시 한번 확인 (CSS로 show/hide된 nav 등 대비)
  setTimeout(removeExistingNavs, 100);
  
  // MutationObserver: nav가 추가되면 즉시 제거
  if (window.MutationObserver) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.tagName === 'NAV') {
              if (node.parentNode) {
                node.parentNode.removeChild(node);
              }
            }
            // 자식 노드 중 nav가 있으면 제거
            if (node.querySelectorAll) {
              var childNavs = node.querySelectorAll('nav');
              childNavs.forEach(function(nav) {
                if (nav.parentNode) {
                  nav.parentNode.removeChild(nav);
                }
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  // 주기적 확인 (500ms마다)
  var navCheckInterval = setInterval(removeExistingNavs, 500);
  
  // 10초 후 주기적 확인 중지
  setTimeout(function() {
    clearInterval(navCheckInterval);
  }, 10000);
  
  var HEADER_FILE = 'header-nav.html';
  var HEADER_CSS_FILE = 'global-header.css';
  var REDUX_UMD_URL = 'https://unpkg.com/redux@4.2.1/dist/redux.min.js';
  var MAX_RETRIES = 3;

  var ACTIONS = {
    START_LOADING: 'GLOBAL_HEADER/START_LOADING',
    LOAD_SUCCESS: 'GLOBAL_HEADER/LOAD_SUCCESS',
    LOAD_ERROR: 'GLOBAL_HEADER/LOAD_ERROR',
    SET_ACTIVE_MENU: 'GLOBAL_HEADER/SET_ACTIVE_MENU'
  };

  var INITIAL_STATE = {
    loaded: false,
    loading: false,
    retries: 0,
    activeMenuId: null,
    error: null
  };

  function reducer(state, action) {
    if (!state) {
      return INITIAL_STATE;
    }

    switch (action.type) {
      case ACTIONS.START_LOADING:
        return {
          loaded: false,
          loading: true,
          retries: action.retries,
          activeMenuId: state.activeMenuId,
          error: null
        };
      case ACTIONS.LOAD_SUCCESS:
        return {
          loaded: true,
          loading: false,
          retries: 0,
          activeMenuId: null,
          error: null
        };
      case ACTIONS.LOAD_ERROR:
        return {
          loaded: false,
          loading: false,
          retries: action.retries,
          activeMenuId: state.activeMenuId,
          error: action.error
        };
      case ACTIONS.SET_ACTIVE_MENU:
        return {
          loaded: state.loaded,
          loading: state.loading,
          retries: state.retries,
          activeMenuId: action.menuId,
          error: state.error
        };
      default:
        return state;
    }
  }

  function createFallbackStore(reducerFn, preloadedState) {
    var state = preloadedState;
    var listeners = [];

    function dispatch(action) {
      state = reducerFn(state, action || {});
      listeners.slice().forEach(function (listener) {
        listener();
      });
      return action;
    }

    function getState() {
      return state;
    }

    function subscribe(listener) {
      listeners.push(listener);
      return function unsubscribe() {
        listeners = listeners.filter(function (entry) {
          return entry !== listener;
        });
      };
    }

    dispatch({ type: '@@INIT' });

    return {
      dispatch: dispatch,
      getState: getState,
      subscribe: subscribe
    };
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', function () {
          resolve();
        });
        existing.addEventListener('error', function () {
          reject(new Error('Failed to load script: ' + src));
        });
        if (existing.dataset.loaded === 'true') {
          resolve();
        }
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = function () {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = function () {
        reject(new Error('Failed to load script: ' + src));
      };
      document.head.appendChild(script);
    });
  }

  function createStoreWithRedux() {
    if (!window.Redux || typeof window.Redux.createStore !== 'function') {
      return null;
    }
    return window.Redux.createStore(reducer, INITIAL_STATE);
  }

  function ensureStore() {
    if (window.__GLOBAL_HEADER_STORE__) {
      return Promise.resolve(window.__GLOBAL_HEADER_STORE__);
    }

    return loadScript(REDUX_UMD_URL)
      .catch(function () {
        return null;
      })
      .then(function () {
        var store = createStoreWithRedux();
        if (!store) {
          store = createFallbackStore(reducer, INITIAL_STATE);
        }
        window.__GLOBAL_HEADER_STORE__ = store;
        return store;
      });
  }

  function ensureStyles() {
    if (!document.querySelector('link[href="' + HEADER_CSS_FILE + '"]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = HEADER_CSS_FILE;
      css.onerror = function () {
        console.warn('[global-header-loader] global-header.css failed to load');
      };
      document.head.appendChild(css);
    }

    if (!document.querySelector('link[href*="Material+Symbols+Outlined"]')) {
      var icons = document.createElement('link');
      icons.rel = 'stylesheet';
      icons.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      document.head.appendChild(icons);
    }
  }

  function ensureMountPoint() {
    var mountPoint = document.querySelector('[data-global-header]');
    if (mountPoint) {
      return mountPoint;
    }

    mountPoint = document.createElement('div');
    mountPoint.setAttribute('data-global-header', '');

    // 기존의 모든 nav 태그 제거 (페이지 로컬 네비게이션)
    var existingNavs = document.querySelectorAll('nav');
    existingNavs.forEach(function(nav) {
      if (nav.parentNode) {
        nav.parentNode.removeChild(nav);
      }
    });

    // body의 맨 앞에 마운트 포인트 추가
    document.body.insertBefore(mountPoint, document.body.firstChild);
    return mountPoint;
  }

  function extractNavMarkup(rawHtml) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(rawHtml, 'text/html');
    var nav = doc.querySelector('nav');

    if (nav) {
      return nav.outerHTML;
    }

    return rawHtml;
  }

  function syncDropdownActiveState(root, state) {
    var dropdowns = root.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(function (dropdown) {
      var dropdownId = dropdown.getAttribute('data-header-menu-id');
      if (dropdownId && state.activeMenuId === dropdownId) {
        dropdown.classList.add('active');
      } else {
        dropdown.classList.remove('active');
      }
    });
  }

  function wireDropdowns(root, store) {
    var dropdowns = root.querySelectorAll('.nav-dropdown');
    if (dropdowns.length === 0) {
      return;
    }

    dropdowns.forEach(function (dropdown, index) {
      var button = dropdown.querySelector('.nav-dropdown-toggle');
      var label = button ? button.textContent.trim() : 'menu-' + (index + 1);
      var menuId = 'menu:' + label;

      dropdown.setAttribute('data-header-menu-id', menuId);

      dropdown.addEventListener('mouseenter', function () {
        store.dispatch({
          type: ACTIONS.SET_ACTIVE_MENU,
          menuId: menuId
        });
      });

      dropdown.addEventListener('mouseleave', function () {
        store.dispatch({
          type: ACTIONS.SET_ACTIVE_MENU,
          menuId: null
        });
      });
    });

    document.addEventListener('click', function (event) {
      if (!root.contains(event.target)) {
        store.dispatch({
          type: ACTIONS.SET_ACTIVE_MENU,
          menuId: null
        });
      }
    });

    store.subscribe(function () {
      syncDropdownActiveState(root, store.getState());
    });

    syncDropdownActiveState(root, store.getState());
  }

  function mountHeader(store, attempt) {
    var state = store.getState();
    if (state.loaded || state.loading) {
      return;
    }

    var safeAttempt = attempt || 1;
    var mountPoint = ensureMountPoint();

    store.dispatch({ type: ACTIONS.START_LOADING, retries: safeAttempt - 1 });
    ensureStyles();

    fetch(HEADER_FILE + '?t=' + Date.now(), {
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ': Failed to load ' + HEADER_FILE);
        }
        return res.text();
      })
      .then(function (html) {
        if (!html || html.trim().length === 0) {
          throw new Error('Empty response from ' + HEADER_FILE);
        }

        mountPoint.innerHTML = extractNavMarkup(html);
        wireDropdowns(mountPoint, store);

        store.dispatch({ type: ACTIONS.LOAD_SUCCESS });
        document.body.classList.add('global-header-ready');
      })
      .catch(function (error) {
        store.dispatch({
          type: ACTIONS.LOAD_ERROR,
          retries: safeAttempt,
          error: error.message
        });

        if (safeAttempt < MAX_RETRIES) {
          setTimeout(function () {
            mountHeader(store, safeAttempt + 1);
          }, safeAttempt * 500);
          return;
        }

        console.error('[global-header-loader] Failed to mount global header:', error);
      });
  }

  function init() {
    if (window.location.pathname.endsWith('/' + HEADER_FILE) || window.location.pathname.endsWith(HEADER_FILE)) {
      return;
    }

    // Wait for global state store to be ready
    var storeCheckInterval = setInterval(function() {
      if (window.GlobalState && window.GlobalState.getStore()) {
        clearInterval(storeCheckInterval);
        
        ensureStore().then(function (store) {
          window.GlobalHeader = {
            actions: ACTIONS,
            dispatch: function (action) {
              return store.dispatch(action);
            },
            getState: function () {
              return store.getState();
            },
            subscribe: function (listener) {
              return store.subscribe(listener);
            },
            mount: function () {
              return mountHeader(store, 1);
            }
          };

          // Sync with global state
          store.subscribe(function() {
            var state = store.getState();
            window.GlobalState.setState({
              headerLoaded: state.loaded,
              activeMenuId: state.activeMenuId,
              error: state.error,
              loading: state.loading
            });
          });

          mountHeader(store, 1);
        });
      }
    }, 100);

    // Timeout after 3 seconds if global state never initializes
    setTimeout(function() {
      clearInterval(storeCheckInterval);
      if (!window.GlobalHeader) {
        ensureStore().then(function (store) {
          window.GlobalHeader = {
            actions: ACTIONS,
            dispatch: function (action) {
              return store.dispatch(action);
            },
            getState: function () {
              return store.getState();
            },
            subscribe: function (listener) {
              return store.subscribe(listener);
            },
            mount: function () {
              return mountHeader(store, 1);
            }
          };

          mountHeader(store, 1);
        });
      }
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    return;
  }

  init();
})();
