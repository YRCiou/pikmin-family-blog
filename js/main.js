/* ===================================================
   親子共遊皮克敏 — 主要 JavaScript
   =================================================== */

// ── Supabase 初始化 ──────────────────────────────────
// 注意：不能用 'supabase' 為頂層變數名，會與 CDN UMD 的 var supabase 衝突
let _client = null;

function initSupabase() {
  if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL.includes('YOUR_PROJECT')) return;
  try {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('Supabase init failed:', e);
  }
}

// ── 瀏覽計數 ────────────────────────────────────────
async function incrementView(slug) {
  if (!_client) return null;
  try {
    const { data, error } = await _client.rpc('increment_view', { page_slug: slug });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('View increment error:', e);
    return null;
  }
}

function displayCount(count, selector) {
  const els = document.querySelectorAll(selector);
  const text = count != null ? Number(count).toLocaleString('zh-TW') : '—';
  els.forEach(el => { el.textContent = text; });
}

// ── 段落導覽：高亮目前段落 ─────────────────────────
function initSectionNav() {
  const tags = document.querySelectorAll('.nav-tag[href^="#"]');
  if (!tags.length) return;

  const sections = Array.from(tags)
    .map(tag => document.querySelector(tag.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tags.forEach(tag => {
          tag.classList.toggle('active', tag.getAttribute('href') === `#${id}`);
        });
        history.replaceState(null, '', `#${id}`);
      }
    });
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

// ── 首頁：只計算自身瀏覽數 ──────────────────────────
async function loadIndexPage() {
  const count = await incrementView('home');
  displayCount(count, '.view-count');
}

// ── 文章頁：計數 ────────────────────────────────────
async function loadArticlePage() {
  const slug = document.body.dataset.slug;
  if (!slug) return;
  const count = await incrementView(slug);
  displayCount(count, '.view-count');
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
  initSupabase();
  initSectionNav();
  initBackToTop();
  initScrollAnimations();

  if (document.body.dataset.page === 'index') {
    loadIndexPage();
  } else if (document.body.dataset.page === 'article') {
    loadArticlePage();
  }
});
