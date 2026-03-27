
/* ══════════════════════════════════════════════════
   RENDERER: PHOTOS
══════════════════════════════════════════════════ */
function renderPhotos(photos) {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  photos.forEach(function (ph, i) {
    var card = document.createElement('div');
    card.className = 'photo-card';
    card.style.animationDelay = (i * 0.05) + 's';
    var thumb = ph.thumbnailUrl || ph.url
             || ('https://picsum.photos/seed/' + (ph.id || i) + '/300/200');
    var full  = ph.url || thumb;

    card.innerHTML =
      '<div class="photo-img-wrap">' +
        '<img src="' + x(thumb) + '" alt="' + x(ph.title) + '" loading="lazy">' +
        '<a class="photo-overlay" href="' + x(full) + '" target="_blank" rel="noopener">' +
          '<i class="fas fa-expand-alt"></i>' +
        '</a>' +
      '</div>' +
      '<div class="photo-meta">' +
        '<div class="photo-album">Album ' + x(ph.albumId || '—') + '</div>' +
        '<p class="photo-title">' + x(ph.title) + '</p>' +
      '</div>';

    cardsGrid.appendChild(card);
  });
}

