(function () {
  var container = document.getElementById('articles-container');
  if (!container) return;

  var prefix = document.documentElement.getAttribute('data-prefix') || '';

  Promise.all([
    fetch(prefix + 'data/articles.json').then(function (res) {
      if (!res.ok) throw new Error('Error al cargar articulos');
      return res.json();
    }),
    fetch(prefix + 'data/posts.json').then(function (res) {
      if (!res.ok) throw new Error('Error al cargar posts');
      return res.json();
    }).catch(function () {
      return { posts: [] };
    })
  ])
    .then(function (results) {
      var articlesData = results[0] || { articles: [] };
      var postsData = results[1] || { posts: [] };

      var items = [];

      (articlesData.articles || []).forEach(function (article) {
        if (article.draft) return;
        items.push({
          type: 'article',
          slug: article.slug,
          title: article.title,
          date: article.date,
          summary: article.summary,
          tags: article.tags || [],
          image: null
        });
      });

      (postsData.posts || []).forEach(function (post) {
        if (post.draft) return;
        items.push({
          type: 'post',
          slug: post.slug,
          title: post.title,
          date: post.date,
          summary: post.summary,
          tags: post.tags || [],
          image: post.image || null
        });
      });

      items.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

      if (items.length === 0) {
        container.innerHTML = '<div class="articles-empty"><p>Aun no hay publicaciones.</p></div>';
        return;
      }

      var html = items.map(function (item) {
        var tags = (item.tags || []).map(function (t) {
          return '<span class="tag">' + escapeHtml(t) + '</span>';
        }).join('');

        var media = item.image && item.image.src
          ? '<div class="article-card-media"><img src="' + escapeAttribute(item.image.src) + '" alt="' + escapeAttribute(item.image.alt || item.title || '') + '" loading="lazy"></div>'
          : '';

        return (
          '<a class="article-card" href="' + prefix + 'article.html?slug=' + encodeURIComponent(item.slug) + '">' +
            media +
            '<time datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + '</time>' +
            '<h2>' + escapeHtml(item.title) + '</h2>' +
            '<p>' + escapeHtml(item.summary || '') + '</p>' +
            (tags ? '<div class="tags">' + tags + '</div>' : '') +
          '</a>'
        );
      }).join('');

      container.innerHTML = '<div class="articles-grid">' + html + '</div>';
    })
    .catch(function (err) {
      container.innerHTML = '<div class="articles-empty"><p>No se pudieron cargar las publicaciones.</p></div>';
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

  function escapeAttribute(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
