'use strict';

/* ══════════════════════════════════════════════════
   script.js  —  Shared across all pages
   Set endpoint via:  <body data-endpoint="posts">
   Set per-page via:  <body data-perpage="8">
   Set scroll target: <body data-scroll-target="cards-section">
   Set table cols:    <body data-table-cols="6">

   Supported endpoints:
     users    → cards (expand) + table
     posts    → cards (always open, no expand)
     photos   → image cards
     reviews  → table
     products → table

   ── Changes made for users.html ───────────────────
   [1] SCROLL_TARGET var  — reads data-scroll-target
       from <body> so users.html can send goTo() to
       #cards-section instead of the old #main-section.

   [2] filterVisible()    — now filters BOTH cardsGrid
       and tableBody with the same query so the two
       views stay perfectly in sync on users.html.

   [3] TABLE_COLS var     — reads data-table-cols from
       <body>; setLoading / showError use it for the
       colspan attribute instead of the old hardcoded 6.

   [4] renderUsers() cards — added tabindex="0",
       role="button", aria-expanded and Enter/Space
       keyboard support so cards are fully accessible.

   [5] renderUsers() table — name cell now contains a
       .click-user chip (chip-table-user) so table rows
       trigger fetchById just like post cards do.

   [6] renderUsers() expand panel — added city and
       company name rows so the detail panel is richer.

   [7] renderPagination() — added aria-label + aria-
       current to page number buttons.
══════════════════════════════════════════════════ */

var BASE_URL = 'https://responserift.dev/api/';
var ENDPOINT = document.body.dataset.endpoint || 'users';
var API_URL  = BASE_URL + ENDPOINT;
var PER_PAGE = document.body.dataset.perpage
               ? parseInt(document.body.dataset.perpage, 10) : 6;

/* [1] Scroll target — default 'main-section' unchanged for
       posts/photos/reviews/products pages.
       users.html sets:  data-scroll-target="cards-section"  */
var SCROLL_TARGET = document.body.dataset.scrollTarget || 'main-section';

/* [3] Table colspan — default 6 unchanged for all existing pages.
       Any page can override with:  data-table-cols="N"           */
var TABLE_COLS = document.body.dataset.tableCols
                 ? parseInt(document.body.dataset.tableCols, 10) : 6;

var allItems    = [];
var currentPage = 1;
var totalPages  = 1;

/* ── DOM refs ── */
var cardsGrid   = document.getElementById('cardsGrid');
var tableBody   = document.getElementById('tableBody');
var prevBtn     = document.getElementById('prevBtn');
var nextBtn     = document.getElementById('nextBtn');
var pagPages    = document.getElementById('pagPages');
var pageInfo    = document.getElementById('pageInfo');
var pageInd     = document.getElementById('pageIndicator');
var totalCount  = document.getElementById('totalCount');
var searchInput = document.getElementById('searchInput');
var endpointTag = document.getElementById('endpointTag');

if (endpointTag) endpointTag.textContent = ENDPOINT;

/* ── BOOT ── */
loadAll();
attachDelegatedListeners();

if (prevBtn)     prevBtn.addEventListener('click', function () { goTo(currentPage - 1); });
if (nextBtn)     nextBtn.addEventListener('click', function () { goTo(currentPage + 1); });
if (searchInput) searchInput.addEventListener('input', function () {
  filterVisible(this.value.trim().toLowerCase());
});

/* ══════════════════════════════════════════════════
   FETCH ALL  —  once per page load, no params
══════════════════════════════════════════════════ */
function loadAll() {
  setLoading(true);

  fetch(API_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (json) {
      var items = extractArray(json);
      if (!items || !items.length) {
        showError('API returned no data for "' + ENDPOINT + '".');
        return;
      }
      allItems   = items;
      totalPages = Math.ceil(allItems.length / PER_PAGE);
      if (totalCount) totalCount.textContent = allItems.length;
      goTo(1);
    })
    .catch(function (err) {
      console.error('Fetch failed:', err);
      showError('Could not reach ' + API_URL + '. (' + err.message + ')');
    });
}

/* pull array out of whatever the API wraps it in */
function extractArray(json) {
  if (Array.isArray(json))           return json;
  if (Array.isArray(json.results))   return json.results;
  if (Array.isArray(json.data))      return json.data;
  if (Array.isArray(json[ENDPOINT])) return json[ENDPOINT];
  var keys = Object.keys(json);
  for (var i = 0; i < keys.length; i++) {
    if (Array.isArray(json[keys[i]])) return json[keys[i]];
  }
  return null;
}

/* ══════════════════════════════════════════════════
   NAVIGATE
══════════════════════════════════════════════════ */
function goTo(p) {
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  var start = (p - 1) * PER_PAGE;
  var slice = allItems.slice(start, start + PER_PAGE);

  /* clear search on page change */
  if (searchInput) searchInput.value = '';

  switch (ENDPOINT) {
    case 'posts':    renderPosts(slice);         break;
    case 'photos':   renderPhotos(slice);        break;
    case 'reviews':  renderReviewsTable(slice);  break;
    case 'products': renderProductsTable(slice); break;
    default:         renderUsers(slice);         break;
  }

  renderPagination();

  if (pageInd)  pageInd.textContent = p + ' / ' + totalPages;
  if (pageInfo) {
    var e = Math.min(start + PER_PAGE, allItems.length);
    pageInfo.textContent = 'Showing ' + (start + 1) + '–' + e + ' of ' + allItems.length;
  }

  /* [1] Use SCROLL_TARGET instead of hardcoded 'main-section'.
         Guard p > 1 so the initial load never hijacks scroll.    */
  if (p > 1) {
    var sec = document.getElementById(SCROLL_TARGET);
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ══════════════════════════════════════════════════
   RENDERER: USERS  — cards + table
   [4] Keyboard a11y on cards
   [5] .click-user chip on table name cell
   [6] Company + city in expand panel
══════════════════════════════════════════════════ */
var COLORS = ['7c6ff7','a78bfa','10b981','f59e0b','ef4444','6366f1','ec4899','14b8a6'];

function renderUsers(users) {

  /* ─── CARDS ─── */
  if (cardsGrid) {
    cardsGrid.innerHTML = '';

    users.forEach(function (u, i) {
      var card = document.createElement('div');
      card.className = 'user-card';
      card.style.animationDelay = (i * 0.06) + 's';

      /* [4] Make card keyboard-reachable and screen-reader friendly */
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-expanded', 'false');
      card.setAttribute('aria-label', 'View details for ' + (u.name || 'user'));

      var av = 'https://ui-avatars.com/api/?name='
             + encodeURIComponent(u.name || 'User')
             + '&background=' + COLORS[i % COLORS.length]
             + '&color=fff&size=80';

      /* [6] City + company added after existing four rows */
      card.innerHTML =
        '<div class="uc-header">' +
          '<div class="uc-avatar">' +
            '<img src="' + av + '" alt="' + x(u.name) + '" loading="lazy">' +
          '</div>' +
          '<div class="uc-top-text">' +
            '<div class="uc-name">' + x(u.name) + '</div>' +
            '<div class="uc-username">@' + x(u.username) + '</div>' +
          '</div>' +
          '<i class="fas fa-chevron-down uc-chevron" aria-hidden="true"></i>' +
        '</div>' +
        '<div class="uc-info" role="region" aria-label="Details for ' + x(u.name) + '">' +
          ucrow('envelope',       u.email) +
          ucrow('phone',          u.phone) +
          ucrow('globe',          u.website) +
          ucrow('map-marker-alt', addrStr(u.address)) +
          ucrow('city',           u.address && u.address.city) +
          ucrow('building',       u.company && u.company.name) +
        '</div>';

      /* Shared toggle — used by both click and keydown */
      function toggleCard() {
        var isOpen = card.classList.contains('expanded');
        document.querySelectorAll('.user-card.expanded').forEach(function (c) {
          c.classList.remove('expanded');
          c.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          card.classList.add('expanded');
          card.setAttribute('aria-expanded', 'true');
        }
      }

      card.addEventListener('click', toggleCard);

      /* [4] Enter / Space expand — prevents page-scroll on Space */
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCard();
        }
      });

      cardsGrid.appendChild(card);
    });
  }

  /* ─── TABLE ─── */
  if (tableBody) {
    tableBody.innerHTML = users.map(function (u, i) {
      var uid = u.id !== undefined ? u.id : i + 1;

      /* [5] Name cell: .click-user button triggers fetchById.
             class "chip-table-user" is for CSS styling only —
             the delegation listener targets .click-user.        */
      var nameCell =
        '<td class="td-name">' +
          '<button class="click-user chip-table-user" ' +
                  'data-id="' + x(uid) + '" ' +
                  'data-fetch-endpoint="users" ' +
                  'title="View full profile" ' +
                  'aria-label="Fetch profile for ' + x(u.name) + '">' +
            '<i class="fas fa-user-circle" aria-hidden="true"></i>&nbsp;' + x(u.name) +
          '</button>' +
        '</td>';

      return '<tr>' +
        '<td class="td-id">' + x(uid) + '</td>' +
        nameCell +
        '<td><span class="badge-user">@' + x(u.username) + '</span></td>' +
        '<td>' +
          '<a href="mailto:' + x(u.email) + '" class="link-accent">' + x(u.email) + '</a>' +
        '</td>' +
        '<td>' + x(u.phone) + '</td>' +
        '<td>' +
          '<a href="http://' + x(u.website) + '" target="_blank" rel="noopener" class="link-accent">' +
            x(u.website) +
          '</a>' +
        '</td>' +
      '</tr>';
    }).join('');
  }
}

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

/* ══════════════════════════════════════════════════
   EVENT DELEGATION
   Handles .click-user on BOTH post cards and user
   table rows (chip-table-user).
══════════════════════════════════════════════════ */
function attachDelegatedListeners() {
  document.addEventListener('click', function (e) {

    /* .click-user — works on any page, any element */
    var chip = e.target.closest('.click-user');
    if (chip) {
      e.stopPropagation();
      var id = chip.dataset.id;
      var ep = chip.dataset.fetchEndpoint || ENDPOINT;
      if (!id) return;
      fetchById(id, ep);
      return;
    }

    /* Modal close */
    if (e.target.id === 'modalClose' || e.target.id === 'detailModal') {
      closeModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && getModal()) closeModal();
  });
}

/* ══════════════════════════════════════════════════
   FETCH BY ID
══════════════════════════════════════════════════ */
function fetchById(id, endpoint) {
  var ep  = (endpoint && endpoint.trim()) ? endpoint.trim() : ENDPOINT;
  var url = BASE_URL + ep + '/' + encodeURIComponent(id);

  console.log('[fetchById] GET', url);

  showModalLoading(ep, id);

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
      return res.json();
    })
    .then(function (data) {
      console.log('[fetchById] response:', data);
      populateModal(ep, data);
    })
    .catch(function (err) {
      console.error('[fetchById] error:', err);
      populateModalError(err.message);
    });
}

/* ══════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════ */
function getModal() { return document.getElementById('detailModal'); }

function ensureModal() {
  if (getModal()) return;
  var el = document.createElement('div');
  el.id        = 'detailModal';
  el.className = 'modal-backdrop';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'modalTitle');
  el.innerHTML =
    '<div class="modal-box">' +
      '<div class="modal-header">' +
        '<h2 class="modal-title" id="modalTitle">Detail</h2>' +
        '<button class="modal-close-btn" id="modalClose" aria-label="Close">' +
          '<i class="fas fa-times"></i>' +
        '</button>' +
      '</div>' +
      '<div class="modal-body" id="modalBody"></div>' +
    '</div>';
  document.body.appendChild(el);
  requestAnimationFrame(function () { el.classList.add('modal-open'); });
}

function openModal() {
  ensureModal();
  requestAnimationFrame(function () { getModal().classList.add('modal-open'); });
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  var m = getModal();
  if (!m) return;
  m.classList.remove('modal-open');
  document.body.style.overflow = '';
  m.addEventListener('transitionend', function handler() {
    m.removeEventListener('transitionend', handler);
    if (m.parentNode) m.parentNode.removeChild(m);
  });
}

function showModalLoading(ep, id) {
  ensureModal();
  var title = document.getElementById('modalTitle');
  var body  = document.getElementById('modalBody');
  if (title) title.textContent = ep.charAt(0).toUpperCase() + ep.slice(1) + ' #' + id;
  if (body)  body.innerHTML =
    '<div class="modal-loading">' +
      '<div class="spinner"></div>' +
      '<span>Fetching ' + x(ep) + ' ' + x(id) + '…</span>' +
    '</div>';
  openModal();
}

function populateModal(ep, data) {
  var body = document.getElementById('modalBody');
  if (!body) return;
  switch (ep) {
    case 'users':    body.innerHTML = buildUserDetail(data);    break;
    case 'posts':    body.innerHTML = buildPostDetail(data);    break;
    case 'products': body.innerHTML = buildProductDetail(data); break;
    default:         body.innerHTML = buildGenericDetail(data); break;
  }
}

function populateModalError(msg) {
  var body = document.getElementById('modalBody');
  if (body) body.innerHTML =
    '<div class="modal-error">' +
      '<i class="fas fa-exclamation-triangle"></i>' +
      '<p>' + x(msg) + '</p>' +
    '</div>';
}

/* ── Modal content builders ── */
function buildUserDetail(u) {
  var col = COLORS[(u.id || 0) % COLORS.length];
  var av  = 'https://ui-avatars.com/api/?name='
          + encodeURIComponent(u.name || 'User')
          + '&background=' + col + '&color=fff&size=100';
  return (
    '<div class="md-user">' +
      '<div class="md-avatar"><img src="' + av + '" alt="' + x(u.name) + '"></div>' +
      '<div class="md-user-info">' +
        '<div class="md-name">'      + x(u.name)     + '</div>' +
        '<div class="md-username">@' + x(u.username) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="md-grid">' +
      mdField('envelope',       'Email',       u.email) +
      mdField('phone',          'Phone',       u.phone) +
      mdField('globe',          'Website',     u.website) +
      mdField('map-marker-alt', 'Address',     addrStr(u.address)) +
      mdField('city',           'City',        u.address && u.address.city) +
      mdField('building',       'Company',     u.company && u.company.name) +
      mdField('comment-alt',    'Catchphrase', u.company && u.company.catchPhrase) +
    '</div>'
  );
}

function buildPostDetail(p) {
  var tags = (p.tags && p.tags.length)
    ? '<div class="md-tags">' +
        p.tags.map(function (t) { return '<span class="pc-tag">#' + x(t) + '</span>'; }).join('') +
      '</div>'
    : '';
  return (
    '<div class="md-post">' +
      '<h3 class="md-post-title">' + x(p.title) + '</h3>' +
      '<p class="md-post-body">'   + x(p.body)  + '</p>' +
      tags +
    '</div>'
  );
}

function buildProductDetail(p) {
  return (
    (p.thumbnail ? '<img class="md-prod-img" src="' + x(p.thumbnail) + '" alt="' + x(p.title) + '">' : '') +
    '<div class="md-grid">' +
      mdField('tag',         'Title',    p.title) +
      mdField('list',        'Category', p.category) +
      mdField('dollar-sign', 'Price',   '$' + p.price) +
      mdField('box',         'Stock',    p.stock) +
      mdField('star',        'Rating',   p.rating) +
      mdField('align-left',  'Desc',     p.description) +
    '</div>'
  );
}

function buildGenericDetail(data) {
  var rows = Object.keys(data).map(function (k) {
    var val = data[k];
    if (val !== null && typeof val === 'object') val = JSON.stringify(val);
    return mdField('circle', k, val);
  });
  return '<div class="md-grid">' + rows.join('') + '</div>';
}

function mdField(icon, label, value) {
  if (value === undefined || value === null || value === '') return '';
  return (
    '<div class="md-field">' +
      '<span class="md-label">' +
        '<i class="fas fa-' + icon + '" aria-hidden="true"></i> ' + x(label) +
      '</span>' +
      '<span class="md-value">' + x(value) + '</span>' +
    '</div>'
  );
}

/* ══════════════════════════════════════════════════
   PAGINATION UI
   [7] aria-label + aria-current on page buttons
══════════════════════════════════════════════════ */
function renderPagination() {
  var p     = currentPage;
  var total = totalPages;
  if (prevBtn) prevBtn.disabled = (p <= 1);
  if (nextBtn) nextBtn.disabled = (p >= total);
  if (!pagPages) return;
  pagPages.innerHTML = '';

  var visible = {};
  visible[1]     = true;
  visible[total] = true;
  for (var i = p - 2; i <= p + 2; i++) {
    if (i >= 1 && i <= total) visible[i] = true;
  }

  var nums = Object.keys(visible).map(Number).sort(function (a, b) { return a - b; });
  var last = 0;
  nums.forEach(function (n) {
    if (last && n - last > 1) {
      var dots = document.createElement('span');
      dots.className   = 'pag-dots';
      dots.textContent = '…';
      pagPages.appendChild(dots);
    }
    var btn = document.createElement('button');
    btn.className   = 'pag-num' + (n === p ? ' active' : '');
    btn.textContent = n;
    /* [7] Accessibility */
    btn.setAttribute('aria-label', 'Page ' + n);
    if (n === p) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', (function (pg) { return function () { goTo(pg); }; })(n));
    pagPages.appendChild(btn);
    last = n;
  });
}

/* ══════════════════════════════════════════════════
   SEARCH FILTER
   [2] Filters BOTH cardsGrid and tableBody together
       so users.html dual-view stays in sync.
       Skips .card-skeleton elements (no text match).
══════════════════════════════════════════════════ */
function filterVisible(q) {
  /* table rows */
  if (tableBody) {
    Array.from(tableBody.rows).forEach(function (tr) {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
  /* cards — skip skeletons */
  if (cardsGrid) {
    Array.from(cardsGrid.children).forEach(function (card) {
      if (card.classList.contains('card-skeleton')) return;
      card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
}

/* ══════════════════════════════════════════════════
   STATE HELPERS
   [3] TABLE_COLS drives colspan — no longer hardcoded
══════════════════════════════════════════════════ */
function setLoading(on) {
  if (tableBody && on) {
    tableBody.innerHTML =
      '<tr><td colspan="' + TABLE_COLS + '" class="table-loading">' +
        '<div class="spinner"></div> Loading ' + ENDPOINT + '…' +
      '</td></tr>';
  }
  if (cardsGrid && on) {
    cardsGrid.innerHTML = '<div class="card-skeleton"></div>'.repeat(PER_PAGE);
  }
  if (prevBtn) prevBtn.disabled = on;
  if (nextBtn) nextBtn.disabled = on;
}

function showError(msg) {
  if (tableBody) {
    tableBody.innerHTML =
      '<tr><td colspan="' + TABLE_COLS + '" class="table-loading" style="color:#ef4444;">' +
        '<i class="fas fa-exclamation-circle" aria-hidden="true"></i>&nbsp;' + x(msg) +
      '</td></tr>';
  }
  if (cardsGrid) {
    cardsGrid.innerHTML =
      '<p class="error-msg">' +
        '<i class="fas fa-exclamation-circle" aria-hidden="true"></i>&nbsp;' + x(msg) +
      '</p>';
  }
  if (pageInfo) pageInfo.textContent = 'Error';
}

/* ══════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════ */
function renderStars(rating) {
  var n    = parseFloat(rating) || 0;
  var full = Math.floor(n);
  var half = (n - full) >= 0.5;
  var emp  = 5 - full - (half ? 1 : 0);
  var h    = '';
  for (var i = 0; i < full; i++) h += '<i class="fas fa-star star-full" aria-hidden="true"></i>';
  if (half)                       h += '<i class="fas fa-star-half-alt star-half" aria-hidden="true"></i>';
  for (var j = 0; j < emp;  j++) h += '<i class="far fa-star star-empty" aria-hidden="true"></i>';
  return '<span class="stars" role="img" aria-label="' + rating + ' out of 5 stars">' + h + '</span>';
}

function ucrow(icon, val) {
  if (!val) return '';
  return (
    '<div class="uc-row">' +
      '<i class="fas fa-' + icon + '" aria-hidden="true"></i>' +
      '<span>' + x(val) + '</span>' +
    '</div>'
  );
}

function addrStr(a) {
  if (!a) return '';
  return [a.street, a.city, a.zipcode].filter(Boolean).join(', ');
}

function hexToRgb(hex) {
  return parseInt(hex.slice(0,2),16) + ',' +
         parseInt(hex.slice(2,4),16) + ',' +
         parseInt(hex.slice(4,6),16);
}

/* XSS-safe stringify */
function x(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}