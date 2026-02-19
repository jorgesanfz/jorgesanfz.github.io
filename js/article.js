(function () {
  var container = document.getElementById('article-container');
  if (!container) return;

  var prefix = document.documentElement.getAttribute('data-prefix') || '';
  var slug = new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    container.innerHTML = '<section class="articles-empty"><p>Falta el slug del articulo.</p></section>';
    return;
  }

  fetch(prefix + 'data/articles.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Error al cargar articulos');
      return res.json();
    })
    .then(function (data) {
      var article = (data.articles || []).find(function (item) {
        return item.slug === slug && !item.draft;
      });

      if (!article) {
        container.innerHTML = '<section class="articles-empty"><p>Articulo no encontrado.</p></section>';
        return;
      }

      renderArticle(article);
      document.title = article.title + ' - Jorge';
    })
    .catch(function (err) {
      container.innerHTML = '<section class="articles-empty"><p>No se pudo cargar el articulo.</p></section>';
      console.error(err);
    });

  function renderArticle(article) {
    var tags = (article.tags || []).map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag) + '</span>';
    }).join('');

    var html =
      '<article class="article-content">' +
        '<header class="article-header">' +
          '<time datetime="' + escapeHtml(article.date) + '">' + formatDate(article.date) + '</time>' +
          '<h1>' + escapeHtml(article.title) + '</h1>' +
          (tags ? '<div class="tags">' + tags + '</div>' : '') +
        '</header>' +
        '<div class="prose" id="article-prose"></div>' +
      '</article>' +
      '<nav class="article-nav"><a href="' + prefix + 'articles.html">&larr; Volver a articulos</a></nav>';

    container.innerHTML = html;

    var prose = document.getElementById('article-prose');
    (article.blocks || []).forEach(function (block) {
      var node = renderBlock(block);
      if (node) prose.appendChild(node);
    });
  }

  function renderBlock(block) {
    if (!block || !block.type) return null;

    if (block.type === 'paragraph') {
      var p = document.createElement('p');
      p.textContent = block.text || '';
      return p;
    }

    if (block.type === 'heading') {
      var level = Math.min(6, Math.max(2, parseInt(block.level, 10) || 2));
      var h = document.createElement('h' + level);
      h.textContent = block.text || '';
      return h;
    }

    if (block.type === 'blockquote') {
      var quote = document.createElement('blockquote');
      var pQuote = document.createElement('p');
      pQuote.textContent = block.text || '';
      quote.appendChild(pQuote);
      return quote;
    }

    if (block.type === 'list') {
      var list = document.createElement(block.ordered ? 'ol' : 'ul');
      (block.items || []).forEach(function (itemText) {
        var li = document.createElement('li');
        li.textContent = itemText || '';
        list.appendChild(li);
      });
      return list;
    }

    if (block.type === 'code') {
      var pre = document.createElement('pre');
      var code = document.createElement('code');
      if (block.language) code.className = 'language-' + block.language;
      code.textContent = block.code || '';
      pre.appendChild(code);
      return pre;
    }

    if (block.type === 'image' && block.src) {
      var img = document.createElement('img');
      img.src = block.src;
      img.alt = block.alt || '';
      if (block.title) img.title = block.title;
      return img;
    }

    if (block.type === 'hr') {
      return document.createElement('hr');
    }

    return null;
  }

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
