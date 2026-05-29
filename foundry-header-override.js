(function () {
  var targetUrl = 'https://events.teams.microsoft.com/event/ee997a1a-951f-4ae4-868b-0a0f885c6c67@97f42f55-f1db-4804-b1eb-08db083efd4f';
  var timer = null;

  function applyLink() {
    var link = document.querySelector('header[data-global-header] a.gradient-primary');
    if (link) {
      link.href = targetUrl;
      return true;
    }
    return false;
  }

  function start() {
    if (applyLink()) {
      return;
    }

    timer = window.setInterval(function () {
      if (applyLink() && timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }, 50);

    window.addEventListener('load', function () {
      applyLink();
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
