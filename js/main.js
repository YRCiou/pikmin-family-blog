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

// ── 入口 ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSectionNav();
  initBackToTop();
  initScrollAnimations();
});
