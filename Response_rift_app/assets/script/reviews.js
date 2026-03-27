
/* ══════════════════════════════════════════════════
   RENDERER: REVIEWS TABLE
══════════════════════════════════════════════════ */
function renderReviewsTable(items) {
  if (!tableBody) return;
  tableBody.innerHTML = items.map(function (r, i) {
    return '<tr>' +
      '<td class="td-id">'      + x(r.id !== undefined ? r.id : i + 1) + '</td>' +
      '<td class="td-name">'    + x(r.reviewerName) + '</td>' +
      '<td><a href="mailto:' + x(r.reviewerEmail) + '" class="link-accent">'
                               + x(r.reviewerEmail) + '</a></td>' +
      '<td class="td-comment">' + x(r.comment) + '</td>' +
      '<td>' + renderStars(r.rating) + ' <span class="rating-num">' + x(r.rating) + '</span></td>' +
      '<td class="td-date">'    + x(r.date ? r.date.slice(0, 10) : '—') + '</td>' +
    '</tr>';
  }).join('');
}
