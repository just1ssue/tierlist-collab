# TierList Collab (Scaffold)

このzipは「最初にGitへ上げるための土台」です。まだ共同編集（Liveblocks/Yjs）は未導入で、UI雰囲気と設計ドキュメントを先に固めています。

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

## 設計ドキュメント
- docs/SPEC.md
- docs/UX.md
- docs/ARCHITECTURE.md
- docs/AI_RULES.md
- docs/DESIGN_TOKENS.md

## 次のPhase
1. ローカル状態でTier/カードのCRUD + DnD
2. Yjs化（状態をDocへ）
3. Liveblocks接続 + presence

