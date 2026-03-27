/* ══════════════════════════════════════════════════
   RENDERER: PRODUCTS TABLE
══════════════════════════════════════════════════ */
function renderProductsTable(items) {
  if (!tableBody) return;
  tableBody.innerHTML = items.map(function (p, i) {
    return '<tr>' +
      '<td class="td-id">' + x(p.id !== undefined ? p.id : i + 1) + '</td>' +
      '<td class="td-name">' +
        (p.thumbnail
          ? '<img src="' + x(p.thumbnail) + '" class="prod-thumb" alt="' + x(p.title) + '" loading="lazy">'
          : '') +
        x(p.title) +
      '</td>' +
      '<td><span class="badge-cat">' + x(p.category) + '</span></td>' +
      '<td class="td-price">$' + x(p.price) + '</td>' +
      '<td class="td-stock">' + stockBadge(p.stock) + '</td>' +
      '<td>' + renderStars(p.rating) + ' <span class="rating-num">' + x(p.rating) + '</span></td>' +
    '</tr>';
  }).join('');
}

function stockBadge(stock) {
  if (stock === undefined || stock === null) return '—';
  var n = parseInt(stock, 10);
  var cls = n > 10 ? 'stock-ok' : n > 0 ? 'stock-low' : 'stock-out';
  return '<span class="badge-stock ' + cls + '">' + x(stock) + '</span>';
}
