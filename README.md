# TierList Collab

Vite + Liveblocks + Yjs で動くコラボ TierList アプリです。

## できること
- Lobby 画面からルーム作成/参加
- ルームは `#room/<roomId>` で遷移
- Tier / Card の追加・編集・削除・移動
- Backlog（`t_backlog`）は最下段固定・移動不可・グレー
- Tier 色は `src/main.js` の `renderBoard()` で HSL 0→120
- テンプレ適用/リセット（confirm あり）
- 投票機能（`t_vote` にカードを移動）
  - vote セッションは `voteSessionId` で管理
  - 右パネルに good/bad ボタン＆集計表示
- スクリーンショット書き出し（PNG）
  - ボードのみ対象／Backlog 除外
  - ボタン・操作UI・「ここにドロップ」を除去
  - タイトル（リスト名）を上部に追加
  - 外部画像は CORS 次第で写らない場合あり
- 参加者の名前変更（自分の表示名のみ）

## 開発環境
```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。  
例: `http://localhost:5173/#room/room_xxxxx`

## テンプレ画像の管理
`src/assets/templates/` を一括読み込みしています。  
`src/templates/templates.js` の `img("file_name")` で参照します。

## CSP / セキュリティ
- 画像URLは http/https のみ許可（data: はユーザー入力で拒否）
- `index.html` の CSP（meta）で `img-src` に `data:` を許可  
  （html2canvas の内部データURI対策）

## ディレクトリ構成
```
src/
  main.js                  # メインロジック
  ui/render.js             # レイアウト/ヘッダ/投票パネル
  realtime/
    provider.js            # Liveblocks + Yjs
    yjs-bridge.js          # Yjs state 操作
    presence.js            # Presence 定義
  templates/templates.js   # テンプレ定義
  styles/app.css           # UI スタイル
  assets/                  # 画像
```

## デプロイ
- GitHub Pages: `docs/DEPLOY_GITHUB_PAGES.md`
