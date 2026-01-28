# GitHub Pages デプロイ手順（Vite）

対象:
- GitHub: just1ssue/tierlist-collab
- 公開URL: https://just1ssue.github.io/tierlist-collab/

## 1. ファイル追加/変更
- vite.config.js に `base: "/tierlist-collab/"` を設定
- `.github/workflows/deploy.yml` を追加（Actionsで build → Pagesへデプロイ）

## 2. GitHub 側の設定
1) リポジトリの **Settings → Pages**
2) **Build and deployment → Source** を **GitHub Actions** にする

## 3. デプロイ
ローカルで:

```powershell
git add -A
git commit -m "chore: deploy to github pages"
git push
```

GitHub の **Actions** タブで `Deploy to GitHub Pages` が成功すると、Pages URL が有効になります。

## 4. よくある問題
### 真っ白になる
`vite.config.js` の `base` が間違っていることが多いです。
- project pages の場合は `"/<repo>/"`（末尾スラッシュも含む）にする必要があります。
