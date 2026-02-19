(function () {
  var container = document.getElementById('lab-container');
  if (!container) return;

  var prefix = document.documentElement.getAttribute('data-prefix') || '';

  fetch(prefix + 'data/lab.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Error al cargar lab');
      return res.json();
    })
    .then(function (data) {
      var entries = data.entries
        .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

      if (entries.length === 0) {
        container.innerHTML = '<div class="lab-empty"><p>Nada por aqui todavia.</p></div>';
        return;
      }

      var html = entries.map(function (entry) {
        var tagClass = 'lab-tag--' + entry.tag;
        return (
          '<div class="lab-entry">' +
            '<div class="lab-entry-header">' +
              '<time datetime="' + escapeHtml(entry.date) + '">' + formatDate(entry.date) + '</time>' +
              '<span class="lab-tag ' + tagClass + '">' + escapeHtml(entry.tag) + '</span>' +
            '</div>' +
            '<div class="lab-entry-body">' +
              '<p>' + escapeHtml(entry.text) + '</p>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      container.innerHTML = '<div class="lab-entries">' + html + '</div>';
    })
    .catch(function (err) {
      container.innerHTML = '<div class="lab-empty"><p>No se pudo cargar el lab.</p></div>';
      console.error(err);
    });

  function formatDate(dateStr) {
    var months = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];
    var parts = dateStr.split('-');
    var day = parseInt(parts[2], 10);
    var month = months[parseInt(parts[1], 10) - 1];
    return day + ' ' + month + ' ' + parts[0];
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
