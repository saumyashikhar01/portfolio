'use strict';

/* ══════════════════════════════════════════════════
   script.js  —  Shared across all pages
   Set endpoint via:  <body data-endpoint="posts">
   Set per-page via:  <body data-perpage="8">

   Supported endpoints:
     users    → cards (expand) + table
     posts    → cards (always open, no expand)
     photos   → image cards
     reviews  → table
     products → table
══════════════════════════════════════════════════ */

var BASE_URL = 'https://responserift.dev/api/';
var ENDPOINT = document.body.dataset.endpoint || 'users';
var API_URL  = BASE_URL + ENDPOINT;
var PER_PAGE = document.body.dataset.perpage ? parseInt(document.body.dataset.perpage, 10) : 6;

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

if (prevBtn)     prevBtn.addEventListener('click',  function () { goTo(currentPage - 1); });
if (nextBtn)     nextBtn.addEventListener('click',  function () { goTo(currentPage + 1); });
if (searchInput) searchInput.addEventListener('input', function () {
  filterVisible(this.value.trim().toLowerCase());
});

/* ══════════════════════════════════════════════════
   FETCH  —  once per page load, no params
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
  /* last resort: first array value in the object */
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
    case 'posts':    renderPosts(slice);    break;
    case 'photos':   renderPhotos(slice);   break;
    case 'reviews':  renderReviewsTable(slice);  break;
    case 'products': renderProductsTable(slice); break;
    default:         renderUsers(slice);    break;
  }

  renderPagination();

  if (pageInd)  pageInd.textContent  = p + ' / ' + totalPages;
  if (pageInfo) {
    var e = Math.min(start + PER_PAGE, allItems.length);
    pageInfo.textContent = 'Showing ' + (start + 1) + '–' + e + ' of ' + allItems.length;
  }

  if (p > 1) {
    var sec = document.getElementById('main-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ══════════════════════════════════════════════════
   RENDERER: USERS  (cards + table, expand on click)
══════════════════════════════════════════════════ */
var COLORS = ['7c6ff7','a78bfa','10b981','f59e0b','ef4444','6366f1','ec4899','14b8a6'];

function renderUsers(users) {
  if (cardsGrid) {
    cardsGrid.innerHTML = '';
    users.forEach(function (u, i) {
      var card = document.createElement('div');
      card.className = 'user-card';
      card.style.animationDelay = (i * 0.06) + 's';
      var av = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'User') +
               '&background=' + COLORS[i % COLORS.length] + '&color=fff&size=80';
      card.innerHTML =
        '<div class="uc-header">' +
          '<div class="uc-avatar"><img src="' + av + '" alt="' + x(u.name) + '" loading="lazy"></div>' +
          '<div class="uc-top-text">' +
            '<div class="uc-name">' + x(u.name) + '</div>' +
            '<div class="uc-username">@' + x(u.username) + '</div>' +
          '</div>' +
          '<i class="fas fa-chevron-down uc-chevron"></i>' +
        '</div>' +
        '<div class="uc-info">' +
          ucrow('envelope', u.email) +
          ucrow('phone', u.phone) +
          ucrow('globe', u.website) +
          ucrow('map-marker-alt', addrStr(u.address)) +
        '</div>';
      card.addEventListener('click', function () {
        var isOpen = card.classList.contains('expanded');
        document.querySelectorAll('.user-card.expanded')
          .forEach(function (c) { c.classList.remove('expanded'); });
        if (!isOpen) card.classList.add('expanded');
      });
      cardsGrid.appendChild(card);
    });
  }

  if (tableBody) {
    tableBody.innerHTML = users.map(function (u, i) {
      return '<tr>' +
        '<td class="td-id">'    + x(u.id !== undefined ? u.id : i + 1) + '</td>' +
        '<td class="td-name">'  + x(u.name) + '</td>' +
        '<td><span class="badge-user">@' + x(u.username) + '</span></td>' +
        '<td><a href="mailto:' + x(u.email) + '" class="link-accent">' + x(u.email) + '</a></td>' +
        '<td>' + x(u.phone) + '</td>' +
        '<td><a href="http://' + x(u.website) + '" target="_blank" class="link-accent">' + x(u.website) + '</a></td>' +
      '</tr>';
    }).join('');
  }
}

/* ══════════════════════════════════════════════════
   RENDERER: POSTS  (always-open cards)
══════════════════════════════════════════════════ */
function renderPosts(posts) {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  posts.forEach(function (p, i) {
    var card = document.createElement('article');
    card.className = 'post-card';
    card.style.animationDelay = (i * 0.06) + 's';
    var col = COLORS[(p.userId || i) % COLORS.length];

    /* reactions can be number or {likes, dislikes} */
    var likes = '';
    if (p.reactions !== undefined) {
      var rv = typeof p.reactions === 'object' ? p.reactions.likes : p.reactions;
      if (rv !== undefined) likes = '<span class="pc-stat"><i class="fas fa-heart"></i> ' + x(rv) + '</span>';
    }
    var views = p.views !== undefined
      ? '<span class="pc-stat"><i class="fas fa-eye"></i> ' + x(p.views) + '</span>' : '';

    var tags = '';
    if (p.tags && p.tags.length) {
      tags = '<div class="pc-tags">' +
        p.tags.map(function (t) { return '<span class="pc-tag">#' + x(t) + '</span>'; }).join('') +
      '</div>';
    }

    card.innerHTML =
      '<div class="pc-top">' +
        '<span class="pc-badge" style="background:rgba(' + hexToRgb(col) + ',0.12);color:#' + col + ';">#' + x(p.id) + '</span>' +
        '<span class="pc-uid">by user&nbsp;' + x(p.userId) + '</span>' +
      '</div>' +
      '<h3 class="pc-title">' + x(p.title) + '</h3>' +
      '<p class="pc-body">'   + x(p.body)  + '</p>' +
      tags +
      '<div class="pc-footer">' + likes + views + '</div>';

    cardsGrid.appendChild(card);
  });
}

/* ══════════════════════════════════════════════════
   RENDERER: PHOTOS  (image cards)
══════════════════════════════════════════════════ */
function renderPhotos(photos) {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';

  photos.forEach(function (ph, i) {
    var card = document.createElement('div');
    card.className = 'photo-card';
    card.style.animationDelay = (i * 0.05) + 's';
    var thumb = ph.thumbnailUrl || ph.url || ('https://picsum.photos/seed/' + (ph.id || i) + '/300/200');
    var full  = ph.url || thumb;

    card.innerHTML =
      '<div class="photo-img-wrap">' +
        '<img src="' + x(thumb) + '" alt="' + x(ph.title) + '" loading="lazy">' +
        '<a class="photo-overlay" href="' + x(full) + '" target="_blank" rel="noopener" title="View full size">' +
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
        (p.thumbnail ? '<img src="' + x(p.thumbnail) + '" class="prod-thumb" alt="' + x(p.title) + '" loading="lazy">' : '') +
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
      '<td class="td-id">' + x(r.id !== undefined ? r.id : i + 1) + '</td>' +
      '<td class="td-name">' + x(r.reviewerName) + '</td>' +
      '<td><a href="mailto:' + x(r.reviewerEmail) + '" class="link-accent">' + x(r.reviewerEmail) + '</a></td>' +
      '<td class="td-comment">' + x(r.comment) + '</td>' +
      '<td>' + renderStars(r.rating) + ' <span class="rating-num">' + x(r.rating) + '</span></td>' +
      '<td class="td-date">' + x(r.date ? r.date.slice(0, 10) : '—') + '</td>' +
    '</tr>';
  }).join('');
}

/* ══════════════════════════════════════════════════
   PAGINATION UI
══════════════════════════════════════════════════ */
function renderPagination() {
  var p     = currentPage;
  var total = totalPages;
  if (prevBtn) prevBtn.disabled = (p <= 1);
  if (nextBtn) nextBtn.disabled = (p >= total);
  if (!pagPages) return;
  pagPages.innerHTML = '';

  var visible = {};
  visible[1] = true;
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
    btn.addEventListener('click', (function (pg) { return function () { goTo(pg); }; })(n));
    pagPages.appendChild(btn);
    last = n;
  });
}

/* ══════════════════════════════════════════════════
   SEARCH FILTER  (client-side, current page only)
══════════════════════════════════════════════════ */
function filterVisible(q) {
  if (tableBody) {
    Array.from(tableBody.rows).forEach(function (tr) {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
  if (cardsGrid) {
    Array.from(cardsGrid.children).forEach(function (card) {
      card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
}

/* ══════════════════════════════════════════════════
   STATE HELPERS
══════════════════════════════════════════════════ */
function setLoading(on) {
  if (tableBody && on) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="table-loading">' +
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
      '<tr><td colspan="6" class="table-loading" style="color:#ef4444;">' +
        '<i class="fas fa-exclamation-circle"></i>&nbsp;' + x(msg) +
      '</td></tr>';
  }
  if (cardsGrid) {
    cardsGrid.innerHTML =
      '<p class="error-msg"><i class="fas fa-exclamation-circle"></i>&nbsp;' + x(msg) + '</p>';
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
  for (var i = 0; i < full; i++) h += '<i class="fas fa-star star-full"></i>';
  if (half)                       h += '<i class="fas fa-star-half-alt star-half"></i>';
  for (var j = 0; j < emp;  j++) h += '<i class="far fa-star star-empty"></i>';
  return '<span class="stars">' + h + '</span>';
}

function ucrow(icon, val) {
  if (!val) return '';
  return '<div class="uc-row"><i class="fas fa-' + icon + '"></i><span>' + x(val) + '</span></div>';
}

function addrStr(a) {
  if (!a) return '';
  return [a.street, a.city, a.zipcode].filter(Boolean).join(', ');
}

function hexToRgb(hex) {
  var r = parseInt(hex.slice(0, 2), 16);
  var g = parseInt(hex.slice(2, 4), 16);
  var b = parseInt(hex.slice(4, 6), 16);
  return r + ',' + g + ',' + b;
}

function x(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}