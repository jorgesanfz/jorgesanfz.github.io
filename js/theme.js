// Se llama desde render.js despues de montar el nav
window.initTheme = function () {
  var toggle = document.querySelector('.theme-toggle');

  function readSavedTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }

  function getTheme() {
    var saved = readSavedTheme();
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) saveTheme(theme);
    if (toggle) {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      toggle.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    }
  }

  setTheme(getTheme(), false);

  if (toggle && toggle.dataset.themeBound !== '1') {
    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(current === 'dark' ? 'light' : 'dark', true);
    });
    toggle.dataset.themeBound = '1';
  }

  if (!window.__themeMediaBound) {
    var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var onThemeChange = function (e) {
      if (!readSavedTheme()) {
        setTheme(e.matches ? 'dark' : 'light', false);
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(onThemeChange);
    }

    window.__themeMediaBound = true;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initTheme);
} else {
  window.initTheme();
}
