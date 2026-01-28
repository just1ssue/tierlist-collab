# TierList Collab

リアルタイムマルチプレイ TierList 編集アプリケーション。Liveblocks + Yjs により、複数ユーザーが同時編集可能

## 必要なもの
- Node.js (LTS)
- Git
- VS Code

## 起動

```bash
npm install
npm run dev
```

ブラウザで表示されるURL（例: http://localhost:5173 ）を開きます。

自動的にルーム ID が生成され、`http://localhost:5173/#room/room_xxxxx` にリダイレクトされます。

## マルチプレイ テスト（同一マシン・複数タブ）

1. ブラウザで `http://localhost:5173/#room/test001` を開く（タブ1）
2. 別タブで同じ URL `http://localhost:5173/#room/test001` を開く（タブ2）
3. タブ1 でカードを追加・編集・移動
4. タブ2 でリアルタイム更新を確認

**参加者リスト表示**：各タブの左パネルに接続したユーザーが表示されます。

## 機能

### Tier 操作
- ✅ Add Tier（新規作成）
- ✅ Rename Tier（名前変更）
- ✅ Delete Tier（削除 ※Backlog は除外）
- ✅ Move Tier Up/Down（順序変更）

### Card 操作
- ✅ Add Card（新規追加）
- ✅ Edit Card（タイトル・画像URL 変更）
- ✅ Delete Card（削除）
- ✅ Move Card（ドラッグ&ドロップで Tier 間移動）

### リアルタイム機能
- ✅ Presence tracking（ユーザーの接続状態・カード選択状態を表示）
- ✅ Yjs CRDT（競合なし同期）
- ✅ Liveblocks sync（クラウド経由で複数デバイス間同期）

## 設計ドキュメント
- docs/SPEC.md：機能仕様
- docs/UX.md：ユーザー体験
- docs/ARCHITECTURE.md：実装アーキテクチャ
- docs/AI_RULES.md：開発ガイドライン
- docs/DESIGN_TOKENS.md：デザイン設計

## 実装概要

### Phase 1 ✅（完了）
- UI レイアウト（3 列 → 2 列）
- Card CRUD（Add, Edit, Delete）
- Tier 管理（Add, Rename, Delete, Move）
- ドラッグ&ドロップ移動
- モーダルフォーム

### Phase 2 ✅（完了）
- **2.1**: Yjs Doc ベースの状態管理
  - `Y.Doc` に `app` map（listName, tiers, cards）
  - `stateToYdoc` / `ydocToState` マッピング
  - `applyActionToYdoc` で全 action を統合

- **2.2**: Liveblocks 接続
  - `createClient` で public key を使用
  - `client.enterRoom(roomId)` で room 取得
  - `room.updateStorage` で状態を同期

- **2.3**: Presence + Routing
  - URL ハッシュ `#room/:roomId` ベース
  - ユーザー ID 自動生成（sessionStorage 永続化）
  - `updatePresence` で ドラッグ状態・編集中状態を追跡
  - 左パネルに参加者リスト表示

## ファイル構成

```
src/
├── main.js                    # アプリケーション起点
├── state/
│   ├── model.js              # 初期状態定義
│   ├── store.js              # 状態管理（Yjs 互換）
│   └── actions.js            # 純粋なロジック関数
├── realtime/
│   ├── provider.js           # Liveblocks クライアント + Yjs
│   ├── yjs-bridge.js         # state ↔ Yjs 変換
│   └── presence.js           # ユーザー追跡
└── ui/
    └── render.js             # DOM 描画
```

## トラブルシューティング

**Q: Liveblocks に接続できない**  
A: `.env.local` に `VITE_LIVEBLOCKS_PUBLIC_KEY` が正しく設定されているか確認してください。

**Q: 複数タブで同期されない**  
A: 同じ `#room/roomId` URL にアクセスしているか確認。ブラウザのネットワークタブで Liveblocks への接続を確認してください。

**Q: 参加者リストが空**  
A: Presence リスナーが正しく登録されているか確認。console でエラーをチェックしてください。

---

開発は Vanilla JS（フレームワークなし）で実装。Vite でビルド、localStorage で開発時キャッシュ対応。

