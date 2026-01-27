# TierList Collab - UX / UI Spec

## 1. UI方針（サービス風）
- 余白を広めに取り、カードは角丸 + 影 + hover
- 主要操作は「右ペインのフォーム」「カードのDnD」「モーダル」で完結
- 成功/失敗はトーストでフィードバックする
- 参加者（presence）を常時表示し、共同作業感を出す

## 2. 画面構成
### 2.1 レイアウト（3ペイン + ヘッダー）
- Top Header（固定）
- Left Panel（参加者・ルーム情報）
- Main（Tierボード）
- Right Panel（カード追加・操作ヘルプ）

## 3. コンポーネント仕様（要点）
- Header: App名 / RoomID / Shareボタン
- Left: Participants + Room Info
- Right: Add Card（title必須, imageUrl任意） + Help
- Main: Tier Board（DnD・空状態のドロップヒント）
- Toast: success / error
- Modal: Tier追加/編集・Card編集（後続Phase）

## 4. 画像URL UX
- imageUrl未入力: 画像領域なし
- 読み込み失敗: 画像を非表示にし「画像を読み込めませんでした」を表示
- 入力は http/https のみ許可

## 5. ルーティング
- /room/:roomId をメインにする（MVPは固定でも可）

