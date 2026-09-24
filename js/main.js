/* ═══════════════════════════════════════════
   BOZDEMIR TASARIM — js/main.js
   ═══════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════
   1. GSAP PLUGIN KAYDETTIRME
══════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);


/* ══════════════════════════════════════════
   2. DİNAMİK PROJE YÜKLEMESİ
   data/projects.json'dan yükler; lightbox ve
   ScrollTrigger animasyonlarını yeniden başlatır.
══════════════════════════════════════════ */
const CATEGORY_LABELS = { 'dis-mekan': 'Dış Mekan', 'ic-mekan': 'İç Mekan', 'konsept': 'Konsept' };

// Proje başına images dizisi — geriye dönük uyumluluk (eski "image" alanı)
function getImages(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

function buildProjectCard(p) {
  const images = getImages(p);
  const cover  = images[0] || '';
  const meta   = [p.location, p.year].filter(Boolean).join(' · ');
  const count  = images.length;

  return `<article class="project-card" data-category="${p.category || 'konsept'}" data-id="${p.id}" style="cursor:pointer">
    <div class="card-img-wrap">
      ${cover
        ? `<img src="${cover}" alt="${p.name}" loading="lazy" decoding="async" />`
        : `<div style="width:100%;height:100%;background:var(--surface-2)"></div>`}
    </div>
    <div class="card-overlay">
      <p class="card-name">${p.name}</p>
      <p class="card-meta">${meta}${count > 1 ? ` · ${count} görsel` : ''}</p>
    </div>
  </article>`;
}

// Projeye ait tüm görselleri programatik lightbox ile aç
function openProjectLightbox(p) {
  const images = getImages(p);
  if (!images.length) return;

  const lb = GLightbox({
    elements: images.map((img, i) => ({
      href:        `${img}`, 
      type:        'image',
      title:       i === 0 ? p.name : '',
      description: i === 0 ? [p.description, p.year].filter(Boolean).join(' · ') : '',
    })),
    touchNavigation: true,
    loop:            false,
    openEffect:      'fade',
    closeEffect:     'fade',
    slideEffect:     'slide',
    skin:            'clean',
    onOpen()  { document.body.style.overflow = 'hidden'; },
    onClose() { document.body.style.overflow = ''; lb.destroy(); },
  });
  lb.open();
}

async function loadProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  try {
    const res      = await fetch('data/projects.json');
    const data     = await res.json();
    const projects = data.projects || [];

    grid.innerHTML = projects.length
      ? projects.map(buildProjectCard).join('')
      : `<p style="grid-column:1/-1;text-align:center;color:var(--text-3);padding:48px 0;font-size:0.85rem">Henüz proje eklenmemiş.</p>`;

    // Kart tıklamaları → lightbox
    grid.querySelectorAll('.project-card').forEach(card => {
      const p = projects.find(pr => pr.id === card.dataset.id);
      if (p) card.addEventListener('click', () => openProjectLightbox(p));

      const ring = document.getElementById('cursorRing');
      card.addEventListener('mouseenter', () => ring?.classList.add('cursor-expand'));
      card.addEventListener('mouseleave', () => ring?.classList.remove('cursor-expand'));
    });

    // ScrollTrigger animasyonları
    grid.querySelectorAll('.project-card').forEach((card, i) => {
      gsap.set(card, { opacity: 0, y: 40 });
      gsap.to(card, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        delay: (i % 3) * 0.09,
        scrollTrigger: { trigger: card, start: 'top 89%', toggleActions: 'play none none none' },
      });
    });

    ScrollTrigger.refresh();
  } catch {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-3);padding:48px 0;font-size:0.85rem">
      Projeler yüklenemedi. Sunucunun çalıştığından emin olun.
    </p>`;
  }
}

loadProjects();


/* ══════════════════════════════════════════
   İLETİŞİM BİLGİLERİNİ YÜKLEMESİ
   data/contact.json'dan okur, DOM'u günceller
══════════════════════════════════════════ */
async function loadContact() {
  try {
    const c = await fetch('data/contact.json').then(r => r.json());

    const email    = document.getElementById('contactEmail');
    const phone    = document.getElementById('contactPhone');
    const location = document.getElementById('contactLocation');
    const instagram = document.getElementById('contactInstagram');
    const linkedin  = document.getElementById('contactLinkedin');
    const behance   = document.getElementById('contactBehance');

    if (email && c.email) {
      email.textContent = c.email;
      email.href = `mailto:${c.email}`;
    }
    if (phone && c.phone) {
      phone.textContent = c.phone;
      phone.href = `tel:${c.phone.replace(/\s/g, '')}`;
    }
    if (location && c.location) {
      location.textContent = c.location;
    }
    const validUrl = url => url && url !== '#' && url.trim() !== '';
    if (instagram) {
      if (validUrl(c.instagram)) { instagram.href = c.instagram; instagram.style.display = ''; }
      else { instagram.style.display = 'none'; }
    }
    if (linkedin) {
      if (validUrl(c.linkedin))  { linkedin.href  = c.linkedin;  linkedin.style.display  = ''; }
      else { linkedin.style.display = 'none'; }
    }
    if (behance) {
      if (validUrl(c.behance))   { behance.href   = c.behance;   behance.style.display   = ''; }
      else { behance.style.display = 'none'; }
    }
  } catch {
    // Sunucu yoksa DOM dokunulmaz
  }
}

loadContact();


/* ══════════════════════════════════════════
   2. ÖZEL CURSOR
   Dot anında takip eder, ring rAF ile lerp yapar
══════════════════════════════════════════ */
const ring = document.getElementById('cursorRing');
const dot  = document.getElementById('cursorDot');

let mx = -200, my = -200;
let rx = -200, ry = -200;
let cursorVisible = false;

window.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;

  // Dot anında takip
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';

  if (!cursorVisible) {
    cursorVisible = true;
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  }
}, { passive: true });

(function animateRing() {
  rx += (mx - rx) * 0.10;
  ry += (my - ry) * 0.10;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animateRing);
})();

// Interaktif elemanlarda ring büyür
document.querySelectorAll('a, button, .filter-btn, .project-card').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('cursor-expand'));
  el.addEventListener('mouseleave', () => ring.classList.remove('cursor-expand'));
});


/* ══════════════════════════════════════════
   3. NAVİGASYON
   Scroll: frosted glass arka plan
   Mobil: hamburger drawer
══════════════════════════════════════════ */
const nav       = document.getElementById('siteNav');
const hamburger = document.getElementById('navHamburger');
const drawer    = document.getElementById('navDrawer');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

hamburger.addEventListener('click', () => {
  const open = drawer.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  drawer.setAttribute('aria-hidden', !open);
});

document.querySelectorAll('.drawer-link').forEach(link => {
  link.addEventListener('click', () => {
    drawer.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  });
});


/* ══════════════════════════════════════════
   4. HERO GSAP TİMELİNE
   Sayfa yüklenince bir kez çalışır.
   Sıra: eyebrow → kelimeler (stagger) → brand → cta → scroll hint
══════════════════════════════════════════ */
function initHeroAnimation() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl
    .to('#heroEyebrow', {
      opacity: 1,
      y: 0,
      duration: 1,
    })
    .to('.hero-word', {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0 0 0% 0)',
      duration: 1.15,
      stagger: 0.13,
      ease: 'power4.out',
    }, '-=0.45')
    .to('#heroBrand', {
      opacity: 1,
      duration: 0.8,
    }, '-=0.3')
    .to('#heroCta', {
      opacity: 1,
      duration: 0.65,
    }, '-=0.2')
    .to('#scrollHint', {
      opacity: 1,
      duration: 0.9,
    }, '-=0.1');
}

if (document.getElementById('heroTitle')) {
  initHeroAnimation();
}


/* ══════════════════════════════════════════
   5. SCROLL TRIGGER ANİMASYONLARI
══════════════════════════════════════════ */
function initScrollAnimations() {

  // Section başlıkları
  gsap.utils.toArray('.section-header').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.95,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 82%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Filtre çubuğu
  const filterBar = document.getElementById('filterBar');
  if (filterBar) {
    gsap.to(filterBar, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: filterBar,
        start: 'top 86%',
        toggleActions: 'play none none none',
      },
    });
  }

  // İletişim kalemleri — soldan girer
  gsap.utils.toArray('.contact-item').forEach((item, i) => {
    gsap.to(item, {
      opacity: 1,
      x: 0,
      duration: 0.85,
      ease: 'power3.out',
      delay: i * 0.13,
      scrollTrigger: {
        trigger: item,
        start: 'top 86%',
        toggleActions: 'play none none none',
      },
    });
  });

  // İletişim dekorasyonu
  const deco = document.querySelector('.contact-decoration');
  if (deco) {
    gsap.to(deco, {
      opacity: 1,
      duration: 1.3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: deco,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  }

  // Hero grid parallax (scroll ile yavaşça kayar)
  gsap.to('.hero-grid', {
    yPercent: 28,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

initScrollAnimations();


/* ══════════════════════════════════════════
   6. FİLTRE ÇUBUĞU
   Kartlar dinamik yüklendiği için click anında
   querySelectorAll ile güncel kartları alır.
══════════════════════════════════════════ */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      if (match) { card.style.display = ''; card.style.visibility = 'visible'; card.style.pointerEvents = 'auto'; }
      gsap.to(card, {
        opacity: match ? 1 : 0,
        scale:   match ? 1 : 0.96,
        duration: 0.32,
        ease: 'power2.out',
        onComplete() {
          card.style.pointerEvents = match ? 'auto' : 'none';
          card.style.visibility    = match ? 'visible' : 'hidden';
          card.style.display       = match ? '' : 'none';
        },
      });
    });
    ScrollTrigger.refresh();
  });
});


/* ══════════════════════════════════════════
   8. YARDIMCI FONKSİYONLAR
══════════════════════════════════════════ */

// Footer yılı
const yearEl = document.getElementById('footerYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Smooth scroll — anchor linkleri için
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
