(function () {
  var STORAGE_KEY = 'lr-demo-theme';
  var themeLink = document.getElementById('theme-stylesheet');

  function applyTheme(name) {
    themeLink.setAttribute('href', 'css/' + name + '.css');
    document.querySelectorAll('.theme-switcher button').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.theme === name);
    });
    localStorage.setItem(STORAGE_KEY, name);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved = localStorage.getItem(STORAGE_KEY) || 'theme-1';
    applyTheme(saved);

    document.querySelectorAll('.theme-switcher button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTheme(btn.dataset.theme);
      });
    });
  });
})();
