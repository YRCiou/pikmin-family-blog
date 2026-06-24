/* ===================================================
   親子共遊皮克敏 — 主要 JavaScript
   =================================================== */

// ── 段落導覽：高亮目前段落 ─────────────────────────
function initSectionNav() {
  const tags = document.querySelectorAll('.nav-tag[href^="#"]');
  if (!tags.length) return;

  const sections = Array.from(tags)
    .map(tag => document.querySelector(tag.getAttribute('href')))
    .filter(Boolean);

  let _lastNavId = '';

  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting);
    if (!visible.length) return;
    const topmost = visible.reduce((a, b) =>
      a.boundingClientRect.top < b.boundingClientRect.top ? a : b
    );
    const id = topmost.target.id;
    tags.forEach(tag => {
      tag.classList.toggle('active', tag.getAttribute('href') === `#${id}`);
    });
    if (id !== _lastNavId) {
      _lastNavId = id;
      history.replaceState(null, '', `#${id}`);
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(sec => observer.observe(sec));

  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
    });
  });
}

// ── 返回頂部按鈕 ────────────────────────────────────
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── 捲動淡入動畫 ─────────────────────────────────────
function initScrollAnimations() {
  const els = document.querySelectorAll('.anim');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}

// ── 訪客計數（GoatCounter）──────────────────────────
// 需在 GoatCounter 後台 Settings 勾選
// "Allow adding visitor counts on your website"，否則端點回傳 403。
function initVisitorCount() {
  const el = document.getElementById('visit-count');
  if (!el) return;
  fetch('https://yrciou.goatcounter.com/counter/TOTAL.json')
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(data => { el.textContent = data.count; })
    .catch(() => { el.textContent = '許多'; });
}

// ── 底部花田（閒置生長、捲動淡出）──────────────────
function initFlowerField() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const field = document.createElement('div');
  field.id = 'flower-field';
  field.setAttribute('aria-hidden', 'true');

  const ground = document.createElement('div');
  ground.className = 'ff-ground';
  ground.innerHTML =
    '<svg preserveAspectRatio="none" viewBox="0 0 100 100" width="100%" height="100%">' +
    '<path d="M0 100 V24 Q14 12 30 20 T62 18 T100 20 V100Z" fill="#3D8B37"/>' +
    '<path d="M0 100 V46 Q22 34 46 42 T100 40 V100Z" fill="#2C6B2F"/></svg>';

  const plants = document.createElement('div');
  plants.className = 'ff-plants';

  field.appendChild(ground);
  field.appendChild(plants);
  document.body.appendChild(field);

  const greens = ['#5CA82E', '#6DB33F', '#4E9325', '#79C24A'];
  const rnd = (a, b) => a + Math.random() * (b - a);

  function blade(c) {
    return '<svg viewBox="0 0 14 44" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">' +
      '<path d="M7 44 C4 30 3 18 8 3" fill="none" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round"/></svg>';
  }
  function flower(stemLen) {
    const vb = Math.round(stemLen + 26);
    const petals = [0, 72, 144, 216, 288].map(a =>
      '<ellipse cx="0" cy="-9.5" rx="5.2" ry="9.5" fill="#ffffff" stroke="#E4E4E4" stroke-width="0.8" transform="rotate(' + a + ')"/>'
    ).join('');
    return '<svg viewBox="0 0 40 ' + vb + '" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">' +
      '<path d="M20 ' + vb + ' C20 ' + (vb - 18) + ' 18 ' + ((vb + 24) / 2).toFixed(1) + ' 18 24" fill="none" stroke="#4E9325" stroke-width="3" stroke-linecap="round"/>' +
      '<g transform="translate(20,20)">' + petals + '<circle r="5" fill="#F4C430"/></g></svg>';
  }
  function place(spec) {
    const d = document.createElement('div');
    d.className = 'ff-plant';
    d.style.left = spec.left + '%';
    d.style.width = spec.w.toFixed(1) + 'px';
    d.style.height = spec.h.toFixed(1) + 'px';
    d.style.marginLeft = (-spec.w / 2).toFixed(1) + 'px';
    d.style.setProperty('--d', spec.delay.toFixed(2) + 's');
    d.innerHTML = spec.html;
    plants.appendChild(d);
  }
  function build() {
    plants.innerHTML = '';
    const W = window.innerWidth;
    const nBlades = Math.max(48, Math.round(W / 6));
    const nFlowers = Math.max(21, Math.round(W / 17));
    const specs = [];
    for (let i = 0; i < nBlades; i++) {
      const w = rnd(11, 17);
      specs.push({ html: blade(greens[i % greens.length]), left: rnd(0, 100), w: w, h: w * 3.1 });
    }
    for (let i = 0; i < nFlowers; i++) {
      const w = rnd(22, 34);
      const stem = rnd(6, 64);
      specs.push({ html: flower(stem), left: rnd(2, 98), w: w, h: w * (stem + 26) / 40 });
    }
    for (let i = specs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = specs[i]; specs[i] = specs[j]; specs[j] = tmp;
    }
    const total = specs.length;
    specs.forEach((s, i) => {
      s.delay = (i / total) * 8.2 + rnd(0, 0.25);
      place(s);
    });
  }
  build();

  let scrollTimer;
  const idle = () => field.classList.add('idle');
  const busy = () => { field.classList.remove('idle'); clearTimeout(scrollTimer); scrollTimer = setTimeout(idle, 650); };
  window.addEventListener('scroll', busy, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 300); }, { passive: true });

  setTimeout(idle, 400);
}

// ── 入口 ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSectionNav();
  initBackToTop();
  initScrollAnimations();
  initVisitorCount();
  initFlowerField();
});
