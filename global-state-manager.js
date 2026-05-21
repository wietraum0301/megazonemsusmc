(function () {
  if (window.GlobalStateManager) {
    return;
  }

  function createStore(initialState) {
    var state = Object.assign({}, initialState || {});
    var listeners = [];

    function notify() {
      listeners.slice().forEach(function (listener) {
        listener(state);
      });
    }

    return {
      getState: function () {
        return state;
      },
      setState: function (patch) {
        var nextState = typeof patch === 'function' ? patch(state) : patch;
        state = Object.assign({}, state, nextState || {});
        notify();
        return state;
      },
      subscribe: function (listener) {
        listeners.push(listener);
        listener(state);

        return function () {
          listeners = listeners.filter(function (current) {
            return current !== listener;
          });
        };
      },
    };
  }

  window.GlobalStateManager = {
    createStore: createStore,
  };

  window.GlobalHeaderStore = createStore({
    activeDropdownIndex: null,
  });
})();