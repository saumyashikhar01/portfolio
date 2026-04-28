'use strict';

// ===== CONSTANTS =====
const COLS         = 9;   // cells per row — fixed, never changes
const INITIAL_ROWS = 3;
const LOG_MAX      = 20;  // max entries kept in the sys-log

// ===== CACHED DOM REFS =====
// Populated once at DOMContentLoaded — zero getElementById calls after that.
let dom = {};

// ===== GAME STATE =====
const state = {
  rows:         INITIAL_ROWS,
  cells:        [],   // flat array — index = rowIndex * COLS + colIndex
  selected:     null,
  score:        0,
  matches:      0,
  eliminated:   0,
  level:        1,
  sessionStart: Date.now(),
};

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────

/** Random integer 1–9 */
const randDigit = () => Math.floor(Math.random() * 9) + 1;

/** Zero-pad a number to `len` digits */
const pad = (n, len = 2) => String(n).padStart(len, '0');

/** Format elapsed seconds → "MM:SS" */
const formatTime = secs => `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;

// ─────────────────────────────────────────────
// CLOCK + SESSION TIMER
// Single interval drives both displays — no duplicates.
// ─────────────────────────────────────────────

function tickClock() {
  // Wall-clock in navbar
  const now = new Date();
  dom.clock.textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Elapsed session time
  const elapsed = Math.floor((Date.now() - state.sessionStart) / 1000);
  const formatted = formatTime(elapsed);

  // Status-bar session counter
  dom.sbSession.textContent = formatted;

  // Session timer overlay inside the SESSION ANALYSIS card
  dom.sessionTimer.textContent = `SESSION: ${formatted}`;
}

// ─────────────────────────────────────────────
// PARALLAX + CURSOR
// ─────────────────────────────────────────────

function initParallax() {
  const layer = dom.parallaxLayer;
  const dot   = dom.cursorDot;

  document.addEventListener('mousemove', ({ clientX: x, clientY: y }) => {
    const px = x / window.innerWidth  - 0.5;
    const py = y / window.innerHeight - 0.5;
    layer.style.transform = `translate(${px * -20}px, ${py * -15}px)`;
    dot.style.left = x + 'px';
    dot.style.top  = y + 'px';
  });

  window.addEventListener('scroll', () => {
    layer.style.transform = `translateY(${window.scrollY * 0.3}px)`;
  }, { passive: true });
}

// ─────────────────────────────────────────────
// BOARD / ROW CREATION
// ─────────────────────────────────────────────

/**
 * Build one DOM row of COLS cells.
 * Registers click handlers, pushes into state.cells,
 * returns a DocumentFragment ready to append.
 * @param {number} rowIndex — used for CSS animation stagger only
 */
function createRow(rowIndex) {
  const frag = document.createDocumentFragment();

  for (let col = 0; col < COLS; col++) {
    const idx = state.cells.length;   // capture index before push
    const num = randDigit();

    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.animationDelay = `${col * 0.04 + rowIndex * 0.02}s`;

    const input = document.createElement('input');
    input.type      = 'text';
    input.maxLength = 1;
    input.value     = num;
    input.readOnly  = true;

    cell.appendChild(input);
    cell.addEventListener('click', () => selectCell(idx));

    frag.appendChild(cell);
    state.cells.push({ el: cell, value: num, matched: false, eliminated: false });
  }

  return frag;
}

/** Wipe the board and rebuild all rows from scratch. */
function buildBoard() {
  dom.gameBoard.innerHTML = '';
  dom.gameBoard.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  state.cells = [];

  for (let r = 0; r < state.rows; r++) {
    dom.gameBoard.appendChild(createRow(r));
  }

  updateUI();
  addLog(`GRID BUILT :: ${state.rows} ROWS × ${COLS} COLS`, 'highlight');
}

// ─────────────────────────────────────────────
// ROW MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Internal: append one row without triggering a UI refresh.
 * Callers batch the refresh themselves.
 */
function appendRow() {
  dom.gameBoard.appendChild(createRow(state.rows));
  state.rows++;
}

/** Public: add one row, then refresh UI. (Used by "+ ADD ROW" button & titlebar max.) */
function addRow() {
  appendRow();
  updateUI();
  addLog(`ROW APPENDED :: TOTAL=${state.rows}`, 'highlight');
}

/** Public: inject N rows from the input, then do one single UI refresh. */
function injectRows() {
  const raw = parseInt(dom.rowCountInput.value, 10);
  const n   = Math.max(1, Math.min(99, isNaN(raw) ? 1 : raw));

  for (let i = 0; i < n; i++) appendRow();   // batch — no per-row refresh

  dom.rowCountInput.value = 1;
  updateUI();   // one refresh covers all injected rows

  addLog(`INJECTED ${n} ROW${n !== 1 ? 'S' : ''} :: TOTAL=${state.rows}`, 'highlight');

  // Flash the live counter
  dom.liveRowCount.classList.add('flash');
  setTimeout(() => dom.liveRowCount.classList.remove('flash'), 600);
}

// ─────────────────────────────────────────────
// GAME ACTIONS
// ─────────────────────────────────────────────

function regenerateBoard() {
  state.selected = null;
  buildBoard();
}

function resetGame() {
  Object.assign(state, {
    rows:         INITIAL_ROWS,
    cells:        [],
    selected:     null,
    score:        0,
    matches:      0,
    eliminated:   0,
    level:        1,
    sessionStart: Date.now(),
  });
  dom.logBody.innerHTML = '';
  buildBoard();
  addLog('SYSTEM RESET :: FULL', 'warn');
}

function selectCell(idx) {
  const c = state.cells[idx];
  if (c.matched || c.eliminated) return;

  // ── First selection ──
  if (state.selected === null) {
    state.selected = idx;
    c.el.classList.add('selected');
    addLog(`NODE[${idx}] SELECTED :: VAL=${c.value}`);
    return;
  }

  // ── Second selection ──
  const prev = state.cells[state.selected];

  if (state.selected === idx) {
    // Tap same cell → deselect
    prev.el.classList.remove('selected');
    state.selected = null;
    return;
  }

  if (prev.value === c.value) {
    // MATCH
    prev.el.classList.replace('selected', 'matched');
    c.el.classList.add('matched');
    prev.matched = c.matched = true;

    const pts = prev.value * 10 * state.level;
    state.matches++;
    state.score      += pts;
    state.eliminated += 2;

    showNotification(`MATCH: ${prev.value} + ${c.value} // +${pts}pts`);
    addLog(`MATCH CONFIRMED :: +${pts}pts`, 'highlight');

    setTimeout(() => {
      prev.el.classList.add('eliminated');
      c.el.classList.add('eliminated');
    }, 400);

  } else {
    // MISMATCH
    prev.el.classList.remove('selected');
    prev.el.classList.add('eliminated');
    prev.eliminated  = true;
    state.eliminated++;
    state.score      = Math.max(0, state.score - 5);
    addLog(`MISMATCH :: [${state.selected}]=${prev.value} vs [${idx}]=${c.value}`, 'warn');
  }

  state.selected = null;
  updateUI();
}

function autoMatch() {
  const groups = {};
  state.cells
    .filter(c => !c.matched && !c.eliminated)
    .forEach(c => (groups[c.value] ??= []).push(c));

  for (const val of Object.keys(groups)) {
    if (groups[val].length < 2) continue;

    const [a, b] = groups[val];
    a.el.classList.add('matched'); a.matched = true;
    b.el.classList.add('matched'); b.matched = true;

    const pts = Number(val) * 15 * state.level;
    state.matches++;
    state.score      += pts;
    state.eliminated += 2;

    setTimeout(() => {
      a.el.classList.add('eliminated');
      b.el.classList.add('eliminated');
    }, 600);

    showNotification(`AUTO-MATCH: ${val} // +${pts}pts`);
    addLog(`AUTO-MATCH :: VAL=${val} +${pts}pts`, 'highlight');
    updateUI();
    return;
  }

  addLog('NO VALID MATCH FOUND', 'warn');
}

// ─────────────────────────────────────────────
// UI UPDATE  (single source of truth for all displays)
// ─────────────────────────────────────────────

function updateUI() {
  const total    = state.cells.length;
  const active   = state.cells.filter(c => !c.matched && !c.eliminated).length;
  const matchPct = Math.round((state.eliminated / Math.max(1, total)) * 100);
  const levelPct = Math.min(100, Math.round((state.score / (state.level * 500)) * 100));

  // Level-up check
  if (state.score >= state.level * 500) {
    state.level++;
    addLog(`LEVEL UP :: LEVEL ${state.level}`, 'highlight');
  }

  // Score panel (left)
  dom.scoreDisplay.textContent  = pad(state.score, 4);
  dom.levelPct.textContent      = levelPct + '%';
  dom.levelProgress.style.width = levelPct + '%';
  dom.matchRate.textContent     = matchPct + '%';
  dom.matchProgress.style.width = matchPct + '%';

  // Status bar
  dom.sbNodes.textContent   = total;
  dom.sbActive.textContent  = active;
  dom.sbMatched.textContent = state.eliminated;

  // Live row counter in SYS LOG
  dom.liveRowCount.textContent = state.rows;

  // Fake diagnostics
  const cpu = Math.min(99, 20 + state.matches * 3 + Math.floor(Math.random() * 5));
  const mem = Math.min(99, Math.round(40 + state.eliminated * 0.5));
  dom.cpuVal.textContent = cpu + '%';
  dom.cpuBar.style.width = cpu + '%';
  dom.memVal.textContent = mem + '%';
  dom.memBar.style.width = mem + '%';
}

// ─────────────────────────────────────────────
// LOG
// ─────────────────────────────────────────────

function addLog(msg, type = '') {
  const now   = new Date();
  const time  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (type ? ' ' + type : '');
  entry.innerHTML = `<span class="log-time">${time}</span> ${msg}`;
  dom.logBody.insertBefore(entry, dom.logBody.firstChild);

  // Keep within LOG_MAX entries
  while (dom.logBody.children.length > LOG_MAX) {
    dom.logBody.removeChild(dom.logBody.lastChild);
  }
}

// ─────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────

let notifTimeout;
function showNotification(msg) {
  document.querySelector('.notification')?.remove();
  clearTimeout(notifTimeout);

  const notif = document.createElement('div');
  notif.className   = 'notification';
  notif.textContent = '// ' + msg;
  document.body.appendChild(notif);
  notifTimeout = setTimeout(() => notif.remove(), 2500);
}

// ─────────────────────────────────────────────
// INIT — single DOMContentLoaded, no duplicates
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Cache every DOM ref once ──
  dom = {
    // Navbar / clock
    clock:          document.getElementById('clock'),
    // Session timer card
    sessionTimer:   document.getElementById('sessionTimer'),
    // Status bar
    sbSession:      document.getElementById('sbSession'),
    sbNodes:        document.getElementById('sbNodes'),
    sbActive:       document.getElementById('sbActive'),
    sbMatched:      document.getElementById('sbMatched'),
    // Parallax / cursor
    parallaxLayer:  document.getElementById('parallaxLayer'),
    cursorDot:      document.getElementById('cursorDot'),
    // Game board
    gameBoard:      document.getElementById('gameBoard'),
    // Score panel
    scoreDisplay:   document.getElementById('scoreDisplay'),
    levelPct:       document.getElementById('levelPct'),
    levelProgress:  document.getElementById('levelProgress'),
    matchRate:      document.getElementById('matchRate'),
    matchProgress:  document.getElementById('matchProgress'),
    // Right panel
    liveRowCount:   document.getElementById('liveRowCount'),
    logBody:        document.getElementById('logBody'),
    rowCountInput:  document.getElementById('rowCountInput'),
    // Diagnostics
    cpuVal:         document.getElementById('cpuVal'),
    cpuBar:         document.getElementById('cpuBar'),
    memVal:         document.getElementById('memVal'),
    memBar:         document.getElementById('memBar'),
    netVal:         document.getElementById('netVal'),
    netBar:         document.getElementById('netBar'),
  };

  // ── Single interval: wall-clock + session timer ──
  setInterval(tickClock, 1000);
  tickClock();   // fire immediately — no 1-second blank on load

  // ── Fake network signal animation ──
  setInterval(() => {
    const net = 70 + Math.floor(Math.random() * 20);
    dom.netVal.textContent = net + '%';
    dom.netBar.style.width = net + '%';
  }, 2000);

  // ── Parallax + cursor ──
  initParallax();

  // ── Row injector — Enter key shortcut ──
  dom.rowCountInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') injectRows();
  });

  // ── Boot the board ──
  buildBoard();
});