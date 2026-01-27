# TierList Collab - SPEC

## 1. 目的
最大8人が同時に操作できる「Tierリスト共同編集」Webアプリを作る。
ログイン不要。URL共有で同一ルームに参加し、全員がカード追加・編集・移動できる。

## 2. 非目的（スコープ外）
- アカウント作成 / OAuthログイン
- 画像のアップロード（外部URLの直リンクのみ）
- 厳密な権限管理（ホスト/閲覧のみ等）
- 変更履歴の完全な監査ログ

## 3. 用語
- Room: 共同編集の単位。URLに含まれるIDで識別する
- Tier: S/A/B...などの行（または列）
- Card: Tier内の要素（テキスト必須、画像URL任意）

## 4. ルーム参加
- ルームURL例: /room/:roomId
- ルームIDを知っている人は編集可能（合言葉URL方式）
- 参加者表示（presence）を行う

## 5. データモデル（正）
### 5.1 Cards
- cards: Record<cardId, Card>
- Card:
  - id: string
  - title: string (必須)
  - imageUrl?: string | null (任意)
  - createdAt: number (epoch ms)

### 5.2 Tiers
- tiers: Tier[]
- Tier:
  - id: string
  - name: string
  - cardIds: string[] (順序を持つ)

## 6. 操作（機能要件）
### 6.1 Tier操作
- Tier追加（name入力）
- Tier名変更
- Tier削除（そのTierのカードは「未分類(Backlog)」へ移動）

### 6.2 Card操作
- Card追加（title必須 / imageUrl任意）
- Card編集（title / imageUrl）
- Card削除
- Drag & DropでTier間移動・並び替え

## 7. 画像URL仕様（重要）
- imageUrlは任意。未入力なら画像表示なし（テキストカード）
- 許可スキーム: https:// または http:// のみ
- 画像読み込み失敗時:
  - 画像は非表示
  - 小さく「画像を読み込めませんでした」を表示
  - imageUrl値は保持（修正で復帰可能）
- セキュリティ:
  - javascript: 等は拒否
  - titleはテキストとして扱い、HTMLとして解釈しない（XSS防止）

## 8. 同時編集（競合ルール）
- 共同編集の正は「状態同期」（CRDT/Yjs）
- 競合は基本的に収束させる（CRDT）
- 同一カードを同時操作する可能性があるため、presenceで「編集中/ドラッグ中」を可視化する
- UX上の扱い:
  - 他者がドラッグ中のカードは半透明+ロックアイコン表示（操作は許すが見た目で衝突を減らす）

## 9. Realtime仕様（方針）
- Yjsを状態管理の正とする
- Liveblocksを接続プロバイダとして使用
- presence:
  - userId（匿名UUID）
  - displayName（任意：Guest-XXXX）
  - draggingCardId? / editingCardId?

## 10. 画面要件（サービス風）
### 10.1 レイアウト
- Top Header: アプリ名 / ルームID / 共有ボタン
- Left Panel: 参加者一覧 / ルーム説明（短文）
- Main: Tierボード（カードのDnD）
- Right Panel: カード追加フォーム（title, imageUrl）/ 使い方

### 10.2 UIコンポーネント
- Card: 角丸 / 影 / hover強調 / 画像は上、タイトルは下
- Modal: Tier追加・編集、カード詳細編集
- Toast: 「コピーしました」「無効なURL」など

## 11. 受け入れ条件（Acceptance Criteria）
- ルーム内で追加/編集/移動が8人で同期する
- imageUrlあり/なしで表示が崩れない
- 無効スキームURLは保存されない（エラー表示）
- 画像ロード失敗でもアプリが落ちない
- リロード後も同一ルームで状態が復元される（少なくともセッション中）

## 12. 変更管理（運用ルール）
- データモデルのキー名・構造は変更しない（移行が必要な変更は禁止）
- realtime層（src/realtime）はI/Fを変えない
- UI改修はui/components内で完結させる

