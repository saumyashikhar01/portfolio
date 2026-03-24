

// ── THEME ─────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const html        = document.documentElement;

const savedTheme = localStorage.getItem('unme-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle?.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('unme-theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ── NAVBAR SHADOW ──────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) nav.style.boxShadow = window.scrollY > 8 ? '0 4px 32px rgba(0,0,0,0.35)' : 'none';
}, { passive: true });

// ── DATA ───────────────────────────────────────
let allUsers     = [];
const ROWS_PAGE  = 5;
let currentPage  = 1;

const AVATAR_COLORS = ['7c6ff7','a78bfa','10b981','f59e0b','ef4444','6366f1','ec4899','14b8a6'];
function avatarUrl(name, i) {
  return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=' + AVATAR_COLORS[i%AVATAR_COLORS.length] + '&color=fff&size=80';
}
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── FETCH ──────────────────────────────────────
const cardsGrid = document.getElementById('userCardsGrid');
const tableBody = document.getElementById('tableBody');

if (cardsGrid || tableBody) {
  fetch('https://jsonplaceholder.typicode.com/users')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => { allUsers = data; onData(); })
    .catch(() => { allUsers = mockUsers(10); onData(); });
}

function onData() {
  if (cardsGrid) renderCards(allUsers.slice(0, 5));
  if (tableBody) { renderTable(currentPage); renderPagination(); }
  const countEl = document.getElementById('dataCount');
  if (countEl) countEl.textContent = allUsers.length + ' users';
}

// ── CARDS ──────────────────────────────────────
function renderCards(users) {
  if (!cardsGrid) return;
  cardsGrid.innerHTML = '';
  users.forEach(function(u, i) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.style.animationDelay = (i * 0.08) + 's';
    card.innerHTML =
      '<div class="uc-avatar"><img src="' + avatarUrl(u.name, i) + '" alt="' + esc(u.name) + '" loading="lazy"></div>' +
      '<div><div class="uc-name">' + esc(u.name) + '</div><div class="uc-username">@' + esc(u.username) + '</div></div>' +
      '<div class="uc-info">' +
        '<div class="uc-row"><i class="fas fa-envelope"></i><span>' + esc(u.email) + '</span></div>' +
        '<div class="uc-row"><i class="fas fa-phone"></i><span>' + esc(u.phone) + '</span></div>' +
        '<div class="uc-row"><i class="fas fa-globe"></i><span>' + esc(u.website) + '</span></div>' +
        '<div class="uc-row"><i class="fas fa-map-marker-alt"></i><span>' + esc(u.address.street) + ', ' + esc(u.address.city) + ' ' + esc(u.address.zipcode) + '</span></div>' +
      '</div>';
    cardsGrid.appendChild(card);
  });
}

// ── TABLE ──────────────────────────────────────
function renderTable(page) {
  if (!tableBody) return;
  const start = (page - 1) * ROWS_PAGE;
  const slice = allUsers.slice(start, start + ROWS_PAGE);
  tableBody.innerHTML = slice.map(function(u) {
    return '<tr><td>' + u.id + '</td><td style="font-weight:600">' + esc(u.name) + '</td>' +
      '<td style="color:var(--accent)">@' + esc(u.username) + '</td>' +
      '<td>' + esc(u.email) + '</td><td>' + esc(u.phone) + '</td><td>' + esc(u.website) + '</td>' +
      '<td>' + esc(u.address.street) + '</td><td>' + esc(u.address.city) + '</td><td>' + esc(u.address.zipcode) + '</td></tr>';
  }).join('');
}

// ── PAGINATION ─────────────────────────────────
function renderPagination() {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  const total = Math.ceil(allUsers.length / ROWS_PAGE);
  pag.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const li = document.createElement('li');
    li.className = i === currentPage ? 'active' : '';
    li.innerHTML = '<a href="#" onclick="changePage(' + i + ');return false;">' + i + '</a>';
    pag.appendChild(li);
  }
}

function changePage(p) {
  currentPage = p;
  renderTable(p);
  renderPagination();
  var target = document.querySelector('#user-data') || document.querySelector('.table-section');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── MOCK FALLBACK ──────────────────────────────
function mockUsers(n) {
  var names  = ['Alice Carter','Bob Smith','Clara Lee','David Kim','Emma Wilson','Fiona Chen','George Patel','Hannah Brown','Ivan Moore','Julia Davis'];
  var cities = ['New York','San Francisco','London','Berlin','Tokyo','Sydney','Mumbai','Toronto','Seoul','Paris'];
  return Array.from({length:n},function(_,i){return{
    id:i+1, name:names[i]||('User '+(i+1)),
    username:(names[i]||('user'+i)).split(' ')[0].toLowerCase()+i,
    email:'user'+(i+1)+'@unme.io', phone:'+1 555-'+String(1000+i).padStart(4,'0'),
    website:'unme-'+(i+1)+'.io',
    address:{street:(100+i)+' Main St',city:cities[i%cities.length],zipcode:String(10000+i*111)}
  };});
}
