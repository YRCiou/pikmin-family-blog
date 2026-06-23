-- 皮克敏親子部落格：Supabase 設定
-- 在 Supabase Dashboard > SQL Editor 中執行此檔案

-- 1. 建立瀏覽計數資料表
CREATE TABLE IF NOT EXISTS page_views (
  slug        TEXT PRIMARY KEY,
  count       BIGINT DEFAULT 0 NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立遞增函式（Upsert + 計數）
CREATE OR REPLACE FUNCTION increment_view(page_slug TEXT)
RETURNS BIGINT
LANGUAGE SQL
AS $$
  INSERT INTO page_views (slug, count, updated_at)
  VALUES (page_slug, 1, NOW())
  ON CONFLICT (slug)
  DO UPDATE SET
    count      = page_views.count + 1,
    updated_at = NOW()
  RETURNING count;
$$;

-- 3. 啟用 Row Level Security
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- 4. 允許任何人讀取（公開計數）
CREATE POLICY "public_read" ON page_views
  FOR SELECT USING (true);

-- 5. 允許匿名使用者呼叫 increment_view 函式
GRANT EXECUTE ON FUNCTION increment_view TO anon;
GRANT SELECT ON page_views TO anon;
