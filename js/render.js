// render.js — Carga nav, footer y contenido de pagina desde JSON
// Cada pagina HTML es un shell minimo con data-page="nombre"

(function () {
  var prefix = document.documentElement.getAttribute('data-prefix') || '';

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function loadJson(path) {
    return fetch(prefix + path).then(function (res) {
      if (!res.ok) throw new Error('Error cargando ' + path);
      return res.json();
    });
  }

  // --- Nav ---

  function renderNav(nav, activeLabel) {
    var header = document.getElementById('site-header');
    if (!header) return;

    var links = nav.map(function (item) {
      var cls = item.label === activeLabel ? ' class="active"' : '';
      return '<a href="' + prefix + item.href + '"' + cls + '>' + escapeHtml(item.label) + '</a>';
    }).join('\n        ');

    header.innerHTML =
      '<div class="container">' +
        '<a href="' + prefix + 'index.html" class="site-logo">Jorge</a>' +
        '<nav class="site-nav">' +
          links +
          '<button class="theme-toggle" aria-label="Cambiar tema">\uD83C\uDF19</button>' +
        '</nav>' +
      '</div>';
  }

  // --- Footer ---

  function renderFooter(links) {
    var footer = document.getElementById('site-footer');
    if (!footer) return;

    var linksHtml = links.map(function (link) {
      var href = (link.href.indexOf('http') === 0 || link.href.indexOf('mailto:') === 0)
        ? link.href
        : prefix + link.href;
      var attrs = link.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + href + '"' + attrs + '>' + escapeHtml(link.label) + '</a>';
    }).join('\n        ');

    footer.innerHTML =
      '<div class="container">' +
        '<div class="footer-links">' + linksHtml + '</div>' +
        '<p>&copy; ' + new Date().getFullYear() + ' Jorge</p>' +
      '</div>';
  }

  // --- Page renderers ---

  function renderHome(data) {
    var container = document.getElementById('page-content');
    if (!container) return;

    var intro = data.intro.map(function (p) {
      return '<p>' + escapeHtml(p) + '</p>';
    }).join('\n');

    var cards = data.cards.map(function (card) {
      var extra = card.variant === 'space' ? ' home-nav-card--space' : '';
      return '<a href="' + card.href + '" class="home-nav-card' + extra + '">' +
        '<h2>' + escapeHtml(card.title) + '</h2>' +
        '<p>' + escapeHtml(card.description) + '</p>' +
      '</a>';
    }).join('\n');

    container.innerHTML =
      '<section class="home-statement">' +
        '<p id="statement" class="statement-text">&nbsp;</p>' +
      '</section>' +
      '<section class="home-intro">' + intro + '</section>' +
      '<section class="home-nav">' + cards + '</section>';

    // Cargar statement
    loadJson('data/statements.json').then(function (statements) {
      var el = document.getElementById('statement');
      if (!el || !statements.length) return;
      var dayIndex = Math.floor(Date.now() / 86400000) % statements.length;
      el.textContent = statements[dayIndex];
      el.style.opacity = '1';
    }).catch(function () {});
  }

  function renderComo(data) {
    var container = document.getElementById('page-content');
    if (!container) return;

    var sections = data.sections.map(function (s) {
      return '<div class="como-section">' +
        '<h2>' + escapeHtml(s.title) + '</h2>' +
        '<p>' + s.body + '</p>' +
      '</div>';
    }).join('\n');

    container.innerHTML =
      '<section class="como-page">' +
        '<h1>' + escapeHtml(data.heading) + '</h1>' +
        '<p class="como-subtitle">' + escapeHtml(data.subtitle) + '</p>' +
        sections +
      '</section>';
  }

  function renderSpace(data) {
    var overlay = document.getElementById('space-overlay');
    if (!overlay) return;

    overlay.querySelector('h1').textContent = data.overlay.heading;
    overlay.querySelector('p').textContent = data.overlay.description;
    overlay.querySelector('button').textContent = data.overlay.button;

    var hud = document.querySelector('.hud');
    if (hud) hud.textContent = data.hud.controls;

    var back = document.querySelector('.hud-top a');
    if (back) back.innerHTML = '&larr; ' + escapeHtml(data.hud.back);
  }

  // --- Init ---

  var page = document.documentElement.getAttribute('data-page');
  if (!page) return;

  var navPromise = loadJson('data/nav.json');
  var footerPromise = loadJson('data/footer.json');

  // Render nav + footer on all pages that have the shell
  Promise.all([navPromise, footerPromise]).then(function (results) {
    var nav = results[0];
    var footerLinks = results[1];

    var activeMap = {
      home: 'Inicio',
      articles: 'Articulos',
      lab: 'Lab',
      space: 'Espacio'
    };

    renderNav(nav, activeMap[page] || null);
    renderFooter(footerLinks);

    // Init theme after nav is rendered (needs the toggle button)
    if (typeof window.initTheme === 'function') window.initTheme();
  }).catch(function (err) {
    console.error('Error cargando layout:', err);
  });

  // Render page-specific content
  if (page === 'home') {
    loadJson('data/home.json').then(renderHome).catch(console.error);
  } else if (page === 'como') {
    loadJson('data/como.json').then(renderComo).catch(console.error);
  } else if (page === 'space') {
    loadJson('data/space.json').then(renderSpace).catch(console.error);
  }
  // articles + lab already load their own JSON
})();
