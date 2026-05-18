/**
 * Global State Management Store
 * Uses Zustand via CDN for robust state management
 * Fallback to Redux if Zustand is not available
 */

(function() {
  // Zustand CDN URL
  const ZUSTAND_CDN = 'https://cdn.jsdelivr.net/npm/zustand@4.4.0/dist/umd.js';
  const REDUX_CDN = 'https://unpkg.com/redux@4.2.1/dist/redux.min.js';

  // Load Zustand from CDN
  function loadZustand() {
    return new Promise((resolve, reject) => {
      if (window.zustand) {
        resolve(window.zustand);
        return;
      }

      const script = document.createElement('script');
      script.src = ZUSTAND_CDN;
      script.onload = () => {
        resolve(window.zustand);
      };
      script.onerror = () => {
        console.warn('[GlobalStateStore] Zustand CDN failed, falling back to Redux');
        reject(new Error('Zustand failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  // Load Redux from CDN
  function loadRedux() {
    return new Promise((resolve, reject) => {
      if (window.Redux) {
        resolve(window.Redux);
        return;
      }

      const script = document.createElement('script');
      script.src = REDUX_CDN;
      script.onload = () => {
        resolve(window.Redux);
      };
      script.onerror = () => {
        console.warn('[GlobalStateStore] Redux CDN failed, using fallback store');
        reject(new Error('Redux failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  // Fallback store (no external library)
  class FallbackStore {
    constructor(initialState = {}) {
      this.state = initialState;
      this.listeners = [];
      this.reducers = {};
    }

    setState(updates) {
      this.state = { ...this.state, ...updates };
      this.listeners.forEach(listener => listener(this.state));
    }

    getState() {
      return this.state;
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    registerReducer(key, reducer) {
      this.reducers[key] = reducer;
    }

    dispatch(action) {
      for (const key in this.reducers) {
        this.state[key] = this.reducers[key](this.state[key], action);
      }
      this.listeners.forEach(listener => listener(this.state));
      return action;
    }
  }

  // Initialize store
  function initStore() {
    const initialState = {
      headerLoaded: false,
      activeMenuId: null,
      navigationItems: [],
      userPreferences: {
        theme: 'light',
        language: 'ko'
      },
      error: null,
      loading: false
    };

    // Try Zustand first
    loadZustand()
      .then(zustand => {
        const create = zustand.default;
        
        window.__GLOBAL_STATE_STORE__ = create((set, get) => ({
          ...initialState,
          
          // Header actions
          setHeaderLoaded: (loaded) => set({ headerLoaded: loaded }),
          setActiveMenu: (menuId) => set({ activeMenuId: menuId }),
          clearActiveMenu: () => set({ activeMenuId: null }),
          
          // Navigation actions
          setNavigationItems: (items) => set({ navigationItems: items }),
          
          // User preference actions
          setTheme: (theme) => set(state => ({
            userPreferences: { ...state.userPreferences, theme }
          })),
          setLanguage: (language) => set(state => ({
            userPreferences: { ...state.userPreferences, language }
          })),
          
          // Error handling
          setError: (error) => set({ error }),
          clearError: () => set({ error: null }),
          
          // Loading state
          setLoading: (loading) => set({ loading })
        }));

        document.body.classList.add('zustand-store-ready');
        console.log('[GlobalStateStore] Zustand store initialized');
      })
      .catch(() => {
        // Fallback to Redux
        loadRedux()
          .then(Redux => {
            const reducer = (state = initialState, action) => {
              switch (action.type) {
                case 'SET_HEADER_LOADED':
                  return { ...state, headerLoaded: action.payload };
                case 'SET_ACTIVE_MENU':
                  return { ...state, activeMenuId: action.payload };
                case 'CLEAR_ACTIVE_MENU':
                  return { ...state, activeMenuId: null };
                case 'SET_NAVIGATION_ITEMS':
                  return { ...state, navigationItems: action.payload };
                case 'SET_THEME':
                  return { 
                    ...state, 
                    userPreferences: { ...state.userPreferences, theme: action.payload }
                  };
                case 'SET_LANGUAGE':
                  return {
                    ...state,
                    userPreferences: { ...state.userPreferences, language: action.payload }
                  };
                case 'SET_ERROR':
                  return { ...state, error: action.payload };
                case 'CLEAR_ERROR':
                  return { ...state, error: null };
                case 'SET_LOADING':
                  return { ...state, loading: action.payload };
                default:
                  return state;
              }
            };

            window.__GLOBAL_STATE_STORE__ = Redux.createStore(reducer, initialState);
            document.body.classList.add('redux-store-ready');
            console.log('[GlobalStateStore] Redux store initialized');
          })
          .catch(() => {
            // Last resort: fallback store
            window.__GLOBAL_STATE_STORE__ = new FallbackStore(initialState);
            document.body.classList.add('fallback-store-ready');
            console.log('[GlobalStateStore] Fallback store initialized');
          });
      });
  }

  // API for global state access
  window.GlobalState = {
    getStore() {
      return window.__GLOBAL_STATE_STORE__;
    },

    getState() {
      const store = window.__GLOBAL_STATE_STORE__;
      if (store) {
        if (typeof store.getState === 'function') {
          return store.getState();
        }
        return store.state || store;
      }
      return null;
    },

    setState(updates) {
      const store = window.__GLOBAL_STATE_STORE__;
      if (store && typeof store.setState === 'function') {
        store.setState(updates);
      }
    },

    subscribe(listener) {
      const store = window.__GLOBAL_STATE_STORE__;
      if (store && typeof store.subscribe === 'function') {
        return store.subscribe(listener);
      }
    },

    dispatch(action) {
      const store = window.__GLOBAL_STATE_STORE__;
      if (store && typeof store.dispatch === 'function') {
        return store.dispatch(action);
      }
      if (store && typeof store.setState === 'function') {
        // Zustand-style
        if (typeof action === 'function') {
          action(store.setState, store.getState);
        }
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStore);
  } else {
    initStore();
  }
})();
