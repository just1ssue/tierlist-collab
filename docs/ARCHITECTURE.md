# TierList Collab - Architecture

## 1. 全体方針
- 共同編集の正は Yjs Doc（CRDT）
- 通信は Liveblocks + Yjs Provider
- Presence（参加者/操作中表示）は Liveblocks presence
- “AI改修で壊れない”ために責務分離を強制する

## 2. ディレクトリ責務
- src/state: データモデルと操作（純粋ロジック）
- src/realtime: YjsとLiveblocks接続を隔離
- src/ui: DOM描画、DnD、モーダル、トースト
- src/app: 起動・ルーティング

## 3. Yjs上のデータ構造（推奨）
- app.tiers: Tier[] 相当（順序あり）
- app.cards: cardId -> Card

## 4. Presence設計
- userId（匿名UUID）
- displayName（Guest-XXXX）
- draggingCardId / editingCardId

## 5. 重要な不変条件
- docs/SPEC.md のデータモデルは変更禁止
- realtime層の公開I/Fは破壊変更しない
- Tier削除はBacklogへ移動

## 6. 手動テスト（最小）
- 2ブラウザで同一roomIdに入り同期確認
- 画像URLあり/なし、404時フォールバック確認

