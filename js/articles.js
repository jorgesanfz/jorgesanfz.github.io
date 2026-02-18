(function () {
  var container = document.getElementById('articles-container');
  if (!container) return;

  // Determine the base path to data/articles.json relative to the current page
  var basePath = document.querySelector('meta[name="base-path"]');
  var prefix = basePath ? basePath.getAttribute('content') : '';
  var jsonUrl = prefix + 'data/articles.json';

  fetch(jsonUrl)
    .then(function (res) {
      if (!res.ok) throw new Error('Error al cargar articulos');
      return res.json();
    })
    .then(function (data) {
      var articles = data.articles
        .filter(function (a) { return !a.draft; })
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

      if (articles.length === 0) {
        container.innerHTML = '<div class="articles-empty"><p>Aun no hay articulos publicados.</p></div>';
        return;
      }

      var html = articles.map(function (article) {
        var tags = (article.tags || []).map(function (t) {
          return '<span class="tag">' + escapeHtml(t) + '</span>';
        }).join('');

        return (
          '<a class="article-card" href="' + prefix + 'articles/' + escapeHtml(article.slug) + '.html">' +
            '<time datetime="' + escapeHtml(article.date) + '">' + formatDate(article.date) + '</time>' +
            '<h2>' + escapeHtml(article.title) + '</h2>' +
            '<p>' + escapeHtml(article.summary) + '</p>' +
            (tags ? '<div class="tags">' + tags + '</div>' : '') +
          '</a>'
        );
      }).join('');

      container.innerHTML = '<div class="articles-grid">' + html + '</div>';
    })
    .catch(function (err) {
      container.innerHTML = '<div class="articles-empty"><p>No se pudieron cargar los articulos.</p></div>';
      console.error(err);
    });

  function formatDate(dateStr) {
    var months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    var parts = dateStr.split('-');
    var day = parseInt(parts[2], 10);
    var month = months[parseInt(parts[1], 10) - 1];
    var year = parts[0];
    return day + ' de ' + month + ', ' + year;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
