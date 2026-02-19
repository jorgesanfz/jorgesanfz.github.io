// Se llama desde render.js despues de montar el nav
window.initTheme = function () {
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  function getTheme() {
    var saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    toggle.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }

  setTheme(getTheme());

  toggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
};
