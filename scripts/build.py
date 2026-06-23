#!/usr/bin/env python3
"""
皮克敏親子部落格 — 自動建置腳本
執行時機：每次 git push 後由 GitHub Actions 自動呼叫

功能：
1. 讀取每篇文章的 git 最後修改日期
2. 更新 data/articles.json 中的 lastModified 欄位
3. 同步更新文章 HTML 中的 <time> 元素與 meta 標籤
4. 依 lastModified 排序（最新在前）
"""

import json
import os
import re
import subprocess
from datetime import datetime, timezone


def get_git_last_modified(filepath: str) -> str:
    """取得檔案在 git 中的最後 commit 日期（YYYY-MM-DD）"""
    try:
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%cI', '--', filepath],
            capture_output=True, text=True, check=True
        )
        date_str = result.stdout.strip()
        if date_str:
            dt = datetime.fromisoformat(date_str)
            return dt.astimezone(timezone.utc).strftime('%Y-%m-%d')
    except Exception as e:
        print(f'  警告：無法取得 {filepath} 的 git 日期：{e}')
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')


def format_date_tw(iso_date: str) -> str:
    """將 YYYY-MM-DD 轉為 YYYY年M月D日"""
    y, m, d = iso_date.split('-')
    return f'{y}年{int(m)}月{int(d)}日'


def update_article_html(filepath: str, new_date: str):
    """更新文章 HTML 中的日期標記"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    tw_date = format_date_tw(new_date)
    changed = False

    # 更新 meta 標籤
    new_meta = f'<meta name="article:modified_time" content="{new_date}">'
    updated = re.sub(
        r'<meta name="article:modified_time" content="[^"]*">',
        new_meta, content
    )
    if updated != content:
        content = updated
        changed = True

    # 更新 <time> 元素
    new_time = f'<time class="article-date" datetime="{new_date}">{tw_date}</time>'
    updated = re.sub(
        r'<time class="article-date" datetime="[^"]*">.*?</time>',
        new_time, content
    )
    if updated != content:
        content = updated
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  已更新 HTML 日期：{filepath} → {new_date}')


def main():
    articles_path = 'data/articles.json'

    with open(articles_path, 'r', encoding='utf-8') as f:
        articles = json.load(f)

    any_changed = False

    for article in articles:
        slug = article['slug']
        html_path = f'articles/{slug}/index.html'

        if not os.path.exists(html_path):
            print(f'  跳過（找不到檔案）：{html_path}')
            continue

        new_date = get_git_last_modified(html_path)
        old_date = article.get('lastModified', '')

        if new_date != old_date:
            print(f'[{slug}] 日期更新：{old_date} → {new_date}')
            article['lastModified'] = new_date
            update_article_html(html_path, new_date)
            any_changed = True
        else:
            print(f'[{slug}] 日期無變化：{new_date}')

    # 依 lastModified 排序（最新在前）
    articles.sort(key=lambda x: x.get('lastModified', '2000-01-01'), reverse=True)

    with open(articles_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    if any_changed:
        print('\n✅ articles.json 與 HTML 已更新。')
    else:
        print('\n✅ 所有日期均為最新，無需更新。')


if __name__ == '__main__':
    main()
