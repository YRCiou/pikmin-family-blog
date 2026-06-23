# 親子共遊皮克敏部落格 — 部署設定說明

## 1. 建立 Supabase 計數器

1. 前往 [supabase.com](https://supabase.com) 建立免費帳號與專案
2. 進入 **SQL Editor**，貼上並執行 `supabase/setup.sql` 的全部內容
3. 前往 **Project Settings > API**，複製：
   - **Project URL**（`https://xxxx.supabase.co`）
   - **anon / public key**
4. 編輯 `js/supabase-config.js`，填入上述兩個值：
   ```js
   const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
   ```

---

## 2. 建立 GitHub 儲存庫並推送

```bash
cd D:/OneDrive/claude/100_Pikmin

git init
git add .
git commit -m "feat: initial blog setup"

# 在 GitHub 建立新 repo（例如 pikmin-family-blog），然後：
git remote add origin https://github.com/YOUR_USERNAME/pikmin-family-blog.git
git branch -M main
git push -u origin main
```

---

## 3. 設定 Cloudflare Pages

### 方法一：GitHub 連動（推薦）

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages** > **Create application** > **Pages**
2. 選擇 **Connect to Git** > 授權 GitHub > 選擇你的 repo
3. 設定：
   - **Framework preset**：`None`
   - **Build command**：（留空）
   - **Build output directory**：`/`（根目錄）
4. 點擊 **Save and Deploy**

Cloudflare 會自動分配一個網址，例如：
```
https://pikmin-family-blog.pages.dev
```

### 方法二：GitHub Actions 自動部署（本專案預設方式）

在 GitHub 儲存庫的 **Settings > Secrets and variables > Actions** 新增以下三個 Secrets：

| Secret 名稱 | 取得方式 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard > My Profile > API Tokens > Create Token（使用 Edit Cloudflare Pages 模板） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard > Workers & Pages > 右側欄位 Account ID |
| `CLOUDFLARE_PROJECT_NAME` | 你在 Cloudflare Pages 建立的專案名稱（如 `pikmin-family-blog`） |

設定完成後，每次 push 到 `main` branch，GitHub Actions 會自動：
1. 更新有修改的文章日期
2. 更新 `data/articles.json` 排序
3. 部署到 Cloudflare Pages

---

## 4. 新增文章的流程

1. 在 `articles/` 下建立新資料夾，例如 `articles/new-article/`
2. 複製任一現有文章的 `index.html` 並修改內容
3. 在 `data/articles.json` 新增該文章的 metadata（仿照現有格式）
4. `git add . && git commit -m "feat: add new article" && git push`
5. GitHub Actions 自動執行日期更新並部署

首頁卡片會在部署後自動顯示新文章（依 `lastModified` 排序，最新在前）。

---

## 5. 修改文章的流程

1. 直接編輯對應的 `articles/[slug]/index.html`
2. `git add articles/[slug]/index.html && git commit -m "update: ..." && git push`
3. GitHub Actions 自動偵測修改、更新日期並部署

---

## 6. 網站結構說明

```
/                                  ← 首頁（單頁式，錨點導覽）
  /#discover                       ← 認識皮克敏段落
  /#family                         ← 親子共玩段落
  /#tips                           ← 遊戲攻略段落
  /#schedule                       ← 時間規劃段落

/articles/discover-pikmin/         ← 文章1
/articles/why-pikmin-family/       ← 文章2
/articles/play-with-kids/          ← 文章3
/articles/no-argument-tips/        ← 文章4
/articles/reward-system/           ← 文章5
```

---

## 7. Hero 圖片版權聲明

本站 Hero 圖片使用：

> **"Person Playing Nintendo Switch"** by [Inclusive Game Lab](https://inclusivelabs.org/)  
> 授權條款：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)  
> 來源：[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:InclusiveGameLab_Person-Playing-Nintendo-Switch_3_CC-BY-SA.jpg)

如需更換圖片，請在所有 HTML 的 `<img class="hero-img">` 與 `<img class="article-hero-img">` 標籤更新 `src`，並同步更新 Footer 中的版權標示文字。
