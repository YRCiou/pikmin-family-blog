/* ===================================================
   親子共遊皮克敏 — 主要 JavaScript
   =================================================== */

// ── Supabase 初始化 ──────────────────────────────────
// 注意：不能用 'supabase' 為變數名，會與 CDN UMD 的 var supabase 衝突
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

async function fetchViewCounts(slugs) {
  if (!_client) return {};
  try {
    const { data, error } = await _client
      .from('page_views')
      .select('slug, count')
      .in('slug', slugs);
    if (error) throw error;
    const map = {};
    (data || []).forEach(row => { map[row.slug] = row.count; });
    return map;
  } catch (e) {
    console.warn('Fetch views error:', e);
    return {};
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
        // 更新 URL hash 但不跳頁
        history.replaceState(null, '', `#${id}`);
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  sections.forEach(sec => observer.observe(sec));

  // 點擊立刻高亮
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

// ── 產生文章標籤 HTML ────────────────────────────────
const tagClassMap = {
  '認識皮克敏': 'discover',
  '親子共玩':   'family',
  '遊戲攻略':   'tips',
  '時間規劃':   'schedule',
};

function tagsHTML(tags) {
  return (tags || []).map(tag => {
    const cls = tagClassMap[tag] || 'discover';
    return `<span class="tag-pill ${cls}">${tag}</span>`;
  }).join('');
}

// ── 格式化日期 ───────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

// ── 產生卡片 HTML ────────────────────────────────────
function cardHTML(article, viewCount) {
  const count = viewCount != null ? Number(viewCount).toLocaleString('zh-TW') : '—';
  return `
    <article class="card" data-slug="${article.slug}">
      <div class="card-body">
        <div class="card-tags">${tagsHTML(article.tags)}</div>
        <h3 class="card-title">${article.title}</h3>
        <p class="card-excerpt">${article.excerpt}</p>
        <div class="card-meta">
          <div class="card-meta-left">
            <span class="card-date">📅 <time datetime="${article.lastModified}">${formatDate(article.lastModified)}</time></span>
            <span class="card-views">👁 <span class="view-count">${count}</span></span>
          </div>
          <span>${article.author}</span>
        </div>
        <a href="/articles/${article.slug}/" class="card-link">閱讀文章 →</a>
      </div>
    </article>`;
}

// ── 首頁：載入文章 + 計數 ────────────────────────────
async function loadIndexPage() {
  // 取得文章資料
  let articles = [];
  try {
    const res = await fetch('/data/articles.json');
    articles = await res.json();
  } catch (e) {
    console.error('Failed to load articles.json:', e);
    return;
  }

  // 依 lastModified 排序（最新在前）
  articles.sort((a, b) => b.lastModified.localeCompare(a.lastModified));

  // 先渲染卡片（不含計數）
  const sectionGrids = {
    discover: document.getElementById('cards-discover'),
    family:   document.getElementById('cards-family'),
    tips:     document.getElementById('cards-tips'),
    schedule: document.getElementById('cards-schedule'),
  };

  articles.forEach(article => {
    const grid = sectionGrids[article.section];
    if (grid) grid.insertAdjacentHTML('beforeend', cardHTML(article, null));
  });

  // 首頁自身計數
  const homeCount = await incrementView('home');
  displayCount(homeCount, '.hero .view-count');

  // 取得所有文章計數並更新卡片
  const slugs = articles.map(a => a.slug);
  const viewMap = await fetchViewCounts(slugs);
  articles.forEach(article => {
    const countEl = document.querySelector(`.card[data-slug="${article.slug}"] .view-count`);
    if (countEl && viewMap[article.slug] != null) {
      countEl.textContent = Number(viewMap[article.slug]).toLocaleString('zh-TW');
    }
  });
}

// ── 文章頁：計數 + 日期顯示 ─────────────────────────
async function loadArticlePage() {
  const slug = document.body.dataset.slug;
  if (!slug) return;

  const count = await incrementView(slug);
  displayCount(count, '.view-count');
}

// ── 入口 ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  initSectionNav();
  initBackToTop();

  if (document.body.dataset.page === 'index') {
    loadIndexPage();
  } else if (document.body.dataset.page === 'article') {
    loadArticlePage();
  }
});
