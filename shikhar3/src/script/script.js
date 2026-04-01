/* ══════════════════════════════════════════════════
   COSMOSX — script.js
   Renders:
     1. Bento grid cards (#bento-container)
     2. Scattered floating cards (#scatter-container)
   All images from Unsplash (space/NASA/astronomy topics)
   ══════════════════════════════════════════════════ */

/* ── Bento Card Data ──
   size: 'normal' | 'wide' | 'tall' | 'big' | 'wide2'
   link: page to open on click (placeholder '#detail')     */
const bentoData = [
  {
    title: "James Webb Telescope",
    content: "Revealing the earliest galaxies of the cosmos in infrared light.",
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=900",
    size: "big",
    link: "#james-webb"
  },
  {
    title: "Mars Rover",
    content: "Jezero Crater: the search for ancient microbial life continues.",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&q=80&w=800",
    size: "normal",
    link: "#mars-rover"
  },
  {
    title: "Nebula Dreams",
    content: "Stellar nurseries where new suns are born from gas and dust.",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800",
    size: "tall",
    link: "#nebula"
  },
  {
    title: "Saturn's Rings",
    content: "The solar system's most spectacular ring system, billions of ice particles wide.",
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&q=80&w=800",
    size: "normal",
    link: "#saturn"
  },
  {
    title: "Black Hole",
    content: "Where spacetime collapses and light itself cannot escape.",
    image: "https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&q=80&w=900",
    size: "wide",
    link: "#black-hole"
  },
  {
    title: "Astronaut's View",
    content: "Earth from the ISS — a fragile blue marble in infinite dark.",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800",
    size: "normal",
    link: "#iss"
  },
  {
    title: "Galaxy Spiral",
    content: "Billions of stars locked in a slow cosmic waltz across millennia.",
    image: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=800",
    size: "tall",
    link: "#galaxy"
  },
  {
    title: "Lunar Surface",
    content: "Ancient craters and volcanic plains, our closest celestial companion.",
    image: "https://images.unsplash.com/photo-1522030239044-12f311f16c05?auto=format&fit=crop&q=80&w=800",
    size: "normal",
    link: "#moon"
  },
  {
    title: "Solar Flare",
    content: "Massive eruptions from our star releasing energies beyond comprehension.",
    image: "https://images.unsplash.com/photo-1532386236358-a33d8a9434e3?auto=format&fit=crop&q=80&w=900",
    size: "wide",
    link: "#solar-flare"
  },
  {
    title: "Deep Space Cluster",
    content: "Thousands of galaxies colliding and merging over cosmic time scales.",
    image: "https://images.unsplash.com/photo-1484950763426-56b5bf172dbb?auto=format&fit=crop&q=80&w=800",
    size: "normal",
    link: "#cluster"
  },
  {
    title: "Milky Way Core",
    content: "The dense galactic center, home to the supermassive black hole Sagittarius A*.",
    image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=80&w=800",
    size: "wide",
    link: "#milky-way"
  },
  {
    title: "Jupiter Giant",
    content: "The storm called the Great Red Spot has raged for over 350 years.",
    image: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&q=80&w=800",
    size: "normal",
    link: "#jupiter"
  }
];

/* ── Scattered Section Card Data ──
   type: 'image' | 'text'
   Positions use top/left percentages for responsive-ish layout */
const scatterData = [
  {
    type: "image",
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=400",
    alt: "James Webb",
    width: 180, height: 240,
    top: "8%", left: "28%",
    link: "#james-webb"
  },
  {
    type: "image",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=400",
    alt: "Nebula",
    width: 150, height: 200,
    top: "10%", left: "8%",
    link: "#nebula"
  },
  {
    type: "text",
    text: "Wix Studio is proud to have COSMOSX as a trusted partner in bringing real-time NASA data to the open web.",
    attribution: "— Vargab Bakshi, VP of WIX",
    width: 230, height: 190,
    top: "58%", left: "5%",
    link: "#"
  },
  {
    type: "image",
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&q=80&w=400",
    alt: "Saturn",
    width: 200, height: 260,
    top: "12%", right: "5%",
    link: "#saturn"
  },
  {
    type: "text",
    text: "I had the opportunity to explore COSMOSX and I'm truly fascinated by the story behind it. Hardik has created something truly special for the cosmos community.",
    attribution: "— Oscar Pérez Pinazo, CEO Awwwards",
    width: 280, height: 160,
    top: "8%", right: "26%",
    link: "#"
  },
  {
    type: "image",
    image: "https://images.unsplash.com/photo-1532386236358-a33d8a9434e3?auto=format&fit=crop&q=80&w=400",
    alt: "Solar Flare",
    width: 160, height: 190,
    bottom: "8%", left: "38%",
    link: "#solar-flare"
  },
  {
    type: "image",
    image: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&q=80&w=400",
    alt: "Galaxy",
    width: 180, height: 200,
    bottom: "5%", right: "6%",
    link: "#galaxy"
  }
];

/* ════════════════════════════════════════
   RENDER: BENTO CARDS
   ════════════════════════════════════════ */
function renderBentoCards() {
  const container = document.getElementById('bento-container');
  if (!container) return;

  container.innerHTML = bentoData.map(card => `
    <div class="card-wrap ${card.size}" onclick="navigateTo('${card.link}')">
      <div class="card">
        <div class="card-bg" style="background-image: url('${card.image}')"></div>
        <div class="card-info">
          <h3>${card.title}</h3>
          <p>${card.content}</p>
        </div>
      </div>
    </div>
  `).join('');

  /* ── JS-powered 3D mouse tilt on each card ──
     Tracks mouse within card, tilts card in 3D for
     a more interactive, premium feel beyond CSS alone */
  container.querySelectorAll('.card-wrap').forEach(wrap => {
    const card = wrap.querySelector('.card');

    wrap.addEventListener('mousemove', (e) => {
      const rect  = wrap.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
      const dy    = (e.clientY - cy) / (rect.height / 2); // -1 to 1
      const tiltX = dy * -7;   // Max 7deg vertical tilt
      const tiltY = dx *  7;   // Max 7deg horizontal tilt

      card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.025)`;
      card.style.transition = 'transform 0.1s ease, border-color 0.5s ease, box-shadow 0.6s ease';
    });

    wrap.addEventListener('mouseleave', () => {
      /* Smoothly spring back to default on mouse leave */
      card.style.transform = '';
      card.style.transition = 'transform 0.6s cubic-bezier(0.445, 0.05, 0.55, 0.95), border-color 0.5s ease, box-shadow 0.6s ease';
    });
  });
}

/* ════════════════════════════════════════
   RENDER: SCATTERED CARDS
   ════════════════════════════════════════ */
function renderScatterCards() {
  const container = document.getElementById('scatter-container');
  if (!container) return;

  scatterData.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = `scatter-card${card.type === 'text' ? ' text-card' : ''}`;

    /* Apply position styles */
    el.style.width  = card.width  + 'px';
    el.style.height = card.height + 'px';
    if (card.top)    el.style.top    = card.top;
    if (card.left)   el.style.left   = card.left;
    if (card.right)  el.style.right  = card.right;
    if (card.bottom) el.style.bottom = card.bottom;

    /* Slight random rotation for an organic scattered feel */
    const rot = (Math.random() - 0.5) * 10; // -5 to +5 degrees
    el.style.transform = `rotate(${rot}deg)`;

    /* Staggered entrance animation using CSS animation-delay */
    el.style.animation = `scatter-in 0.8s ${i * 0.12}s var(--ease-out) both`;

    /* Link on click */
    el.addEventListener('click', () => navigateTo(card.link));

    if (card.type === 'image') {
      el.innerHTML = `<img src="${card.image}" alt="${card.alt}" loading="lazy">`;
    } else {
      el.innerHTML = `
        <p>${card.text}</p>
        <p class="attribution">${card.attribution}</p>
      `;
    }

    container.appendChild(el);
  });
}

/* ── Scatter entrance keyframe injected via JS ── */
function injectScatterAnimation() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scatter-in {
      from { opacity: 0; transform: translateY(20px) scale(0.92) rotate(var(--rot, 0deg)); }
      to   { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

/* ════════════════════════════════════════
   NAVIGATION HELPER
   Navigates to href; if it's a hash-only link
   just smooth-scrolls to that section if it exists,
   otherwise redirects (simulating a new page).
   ════════════════════════════════════════ */
function navigateTo(href) {
  if (!href || href === '#') return;

  /* If it's an anchor that exists on the page, smooth scroll */
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  /* Otherwise redirect — simulates navigating to a detail page */
  window.location.href = href;
}

/* ════════════════════════════════════════
   SMOOTH SCROLL FOR NAV LINKS
   ════════════════════════════════════════ */
function initNavSmooth() {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') { e.preventDefault(); return; }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ════════════════════════════════════════
   INIT ON DOM READY
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  injectScatterAnimation();
  renderBentoCards();
  renderScatterCards();
  initNavSmooth();
});