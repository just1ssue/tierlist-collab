# Design Tokens (Service-style)

本プロジェクトのUIは「Webサービス風（落ち着いた管理画面/コラボツール感）」を目標とする。
実装は CSS Variables（:root）を唯一の正とし、コンポーネント側で直値指定を避ける。

## 1. Color
### Brand / Accent
- --c-accent: メインの強調色（ボタン/リンク/フォーカス）
- --c-accent-weak: 背景に薄く敷くアクセント

### Surface
- --c-bg: 全体背景
- --c-surface: パネル/カード背景
- --c-surface-2: ヘッダー/サブ背景
- --c-border: 境界線

### Text
- --c-text: 本文
- --c-text-muted: サブ
- --c-text-invert: 反転（アクセントボタン上）

### Status
- --c-success
- --c-warning
- --c-danger

## 2. Typography
- --font-sans: system UI
- --fs-1..--fs-6: 段階的スケール
- --lh: 行間
- --fw-regular / --fw-medium / --fw-semibold

## 3. Spacing
- --s-1..--s-8: 4px基準のスケール
- 余白は原則トークンから選び、直値を避ける

## 4. Radius / Shadow
- --r-1..--r-4: 角丸
- --shadow-1..--shadow-3: 影（hoverで増やす）

## 5. Layout
- ヘッダーは固定（sticky）
- 3ペインは:
  - Left: participants + info
  - Main: board
  - Right: form + help
- 最大幅は 1200〜1440程度でセンタリングしてもよい（可変）

## 6. Components
### Button
- Primary / Secondary / Ghost
- hover/active/focus visible を定義

### Input
- border + focus ring
- error state

### Card
- 角丸 + 影 + hover上昇
- image領域は高さ固定（object-fit: cover）

### Toast
- success/error の2種を最低限
- 右下に積む

### Modal
- backdrop blur（任意）
- センタリング
- escapeで閉じる

## 7. Do / Don't
Do:
- すべての色・余白・角丸はCSS変数から参照
- textはtextContentで描画（XSS対策）

Don't:
- コンポーネント内で hex / px の直書き乱発
- innerHTML利用

