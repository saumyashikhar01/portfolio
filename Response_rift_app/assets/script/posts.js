
/* ══════════════════════════════════════════════════
   RENDERER: POSTS  (always-open cards + userId chip)
══════════════════════════════════════════════════ */
function renderPosts(posts) {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  posts.forEach(function (p, i) {
    var card = document.createElement('article');
    card.className = 'post-card';
    card.style.animationDelay = (i * 0.06) + 's';
    var col = COLORS[(p.userId || i) % COLORS.length];

    var likes = '';
    if (p.reactions !== undefined) {
      var rv = typeof p.reactions === 'object' ? p.reactions.likes : p.reactions;
      if (rv !== undefined)
        likes = '<span class="pc-stat"><i class="fas fa-heart"></i> ' + x(rv) + '</span>';
    }
    var views = p.views !== undefined
      ? '<span class="pc-stat"><i class="fas fa-eye"></i> ' + x(p.views) + '</span>' : '';

    var tags = '';
    if (p.tags && p.tags.length) {
      tags = '<div class="pc-tags">' +
        p.tags.map(function (t) { return '<span class="pc-tag">#' + x(t) + '</span>'; }).join('') +
      '</div>';
    }

    var userChip = p.userId !== undefined
      ? '<button class="click-user chip-user" ' +
          'data-id="' + x(p.userId) + '" ' +
          'data-fetch-endpoint="users" ' +
          'title="View user ' + x(p.userId) + ' detail" ' +
          'aria-label="Fetch user ' + x(p.userId) + '">' +
          '<i class="fas fa-user-circle" aria-hidden="true"></i>&nbsp;user&nbsp;' + x(p.userId) +
        '</button>'
      : '<span class="pc-uid">unknown user</span>';

    card.innerHTML =
      '<div class="pc-top">' +
        '<span class="pc-badge" style="background:rgba(' + hexToRgb(col) + ',0.12);color:#' + col + ';">' +
          '#' + x(p.id) +
        '</span>' +
        userChip +
      '</div>' +
      '<h3 class="pc-title">' + x(p.title) + '</h3>' +
      '<p class="pc-body">'   + x(p.body)  + '</p>' +
      tags +
      '<div class="pc-footer">' + likes + views + '</div>';

    cardsGrid.appendChild(card);
  });
}
