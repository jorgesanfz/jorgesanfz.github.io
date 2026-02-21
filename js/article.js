(function () {
  var container = document.getElementById('article-container');
  if (!container) return;

  var prefix = document.documentElement.getAttribute('data-prefix') || '';
  var slug = new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    container.innerHTML = '<section class="articles-empty"><p>Falta el slug del articulo.</p></section>';
    return;
  }

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

      var entry = (articlesData.articles || []).find(function (item) {
        return item.slug === slug && !item.draft;
      });

      if (!entry) {
        var post = (postsData.posts || []).find(function (item) {
          return item.slug === slug && !item.draft;
        });

        if (post) {
          entry = {
            slug: post.slug,
            title: post.title,
            date: post.date,
            tags: post.tags || [],
            blocks: buildPostBlocks(post)
          };
        }
      }

      if (!entry) {
        container.innerHTML = '<section class="articles-empty"><p>Publicacion no encontrada.</p></section>';
        return;
      }

      renderArticle(entry);
      document.title = entry.title + ' - Jorge';
    })
    .catch(function (err) {
      container.innerHTML = '<section class="articles-empty"><p>No se pudo cargar la publicacion.</p></section>';
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

  function buildPostBlocks(post) {
    var blocks = [];

    if (post.image && post.image.src) {
      blocks.push({
        type: 'image',
        src: post.image.src,
        alt: post.image.alt || post.title || '',
        title: post.image.title || ''
      });
    }

    if (post.summary) {
      blocks.push({
        type: 'paragraph',
        text: post.summary
      });
    }

    (post.blocks || []).forEach(function (block) {
      blocks.push(block);
    });

    return blocks;
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
