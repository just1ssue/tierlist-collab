# AGENTS.md

## Project Overview
- Vite + Liveblocks + Yjs のコラボTierリスト
- ルームは `#room/<roomId>` で遷移
- Lobby 画面あり（作成/参加）

## Key Features
- Backlog（`t_backlog`）は最下段固定・移動不可・グレー
- Tier 色は `src/main.js` の `renderBoard()` で HSL 0→120
- テンプレ適用/リセットは confirm あり
- 投票機能は `t_vote` にカードを移動する方式
  - vote セッションは `voteSessionId` で管理
  - 右パネルに good/bad ボタン＆集計表示
- スクリーンショット書き出し（PNG）あり
  - ボードのみ対象／Backlog除外
  - ボタン・操作UI・「ここにドロップ」を除去
  - タイトル（リスト名）を上部に追加
  - 外部画像は CORS 次第で写らない

## Important Files
- `src/main.js` : 主要ロジック（drag/drop, vote, render）
- `src/ui/render.js` : レイアウト/ヘッダ/投票パネル
- `src/realtime/yjs-bridge.js` : Yjs state操作
- `src/realtime/presence.js` : Presence定義
- `src/templates/templates.js` : テンプレ定義
- `src/styles/app.css` : UIスタイル
- `src/assets/` : title/good/bad + templates画像
- `index.html` : CSP 設定（meta）

## Conventions
- 文字コードは UTF-8、LF（`.editorconfig` 参照）
- Backlog固定の制約は `main.js` + `yjs-bridge.js` に実装
- 投票カードは `t_vote` にドラッグして移動
- 画像URLは http/https のみ許可（data: はユーザー入力で拒否）
- テンプレ画像は `import.meta.glob` で一括読み込み（`img("file_name")`）

## Dev Commands
- `npm run dev`
- `npm run build`

## Notes
- GitHub Pages デプロイ：`docs/DEPLOY_GITHUB_PAGES.md`
- CSP: `img-src` に `data:` を許可（html2canvas 用）
- 依存追加: `html2canvas`
