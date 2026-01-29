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

## Important Files
- `src/main.js` : 主要ロジック（drag/drop, vote, render）
- `src/ui/render.js` : レイアウト/ヘッダ/投票パネル
- `src/realtime/yjs-bridge.js` : Yjs state操作
- `src/realtime/presence.js` : Presence定義
- `src/templates/templates.js` : テンプレ定義
- `src/styles/app.css` : UIスタイル
- `src/assets/` : title/good/bad + templates画像

## Conventions
- 文字コードは UTF-8、LF（`.editorconfig` 参照）
- Backlog固定の制約は `main.js` + `yjs-bridge.js` に実装
- 投票カードは `t_vote` にドラッグして移動

## Dev Commands
- `npm run dev`
- `npm run build`

## Notes
- GitHub Pages デプロイ：`docs/DEPLOY_GITHUB_PAGES.md`
