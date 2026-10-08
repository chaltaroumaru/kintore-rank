# キントレランク (kintore-rank)

筋トレを「記録」から「成長と競争」へ。筋トレ初心者〜中級者向けの、トレーニング記録・成長可視化アプリです。

現在は企画書の **Phase 1 (MVP)** を実装しています。

- メール + パスワードでの登録/ログイン
- 初期設定 (ニックネーム・身長・体重・都道府県・ジム/自重)
- トレーニング記録 (日付・種目・重量・回数・セット数・メモ)
- 前回比較 (例: 80kg×7回 → 80kg×8回 で「+1回」)
- 自己ベストと更新表示
- ジム / 自重カテゴリ

設計の詳細は [docs/DESIGN.md](docs/DESIGN.md) を参照してください。

## 技術スタック

Expo SDK 57 (React Native / TypeScript / expo-router) + Supabase (Auth / PostgreSQL / RLS)

## セットアップ

1. [Supabase](https://supabase.com) で無料プロジェクトを作成
2. SQL Editor で [supabase/schema.sql](supabase/schema.sql) を実行
3. Authentication → Sign In / Providers → Email の「Confirm email」をオフ (開発中)
4. `.env.example` をコピーして `.env` を作り、Project Settings → API の URL と publishable key を記入
5. 起動

```bash
npm install
npm start
```

スマホの Expo Go アプリで QR コードを読み取ると実機で動きます。ブラウザで確認する場合は `npm run web`。

## Web 版 (GitHub Pages)

公開URL: https://chaltaroumaru.github.io/kintore-rank/

更新するときは `npm run deploy:web` (ビルドして `gh-pages` ブランチへ push)。

## 通知設定

プロフィール画面の「通知設定」で ON/OFF・端末の許可・テスト通知を確認できます (ローカル通知・Expo Go で動作 / Web 非対応)。
通知の種類 (リマインダー等) は `lib/notifications.ts` の `NotificationSettings` に追加していく想定です。

## 別の Wi-Fi / モバイル回線から使う

| 方法 | 対象 | PC起動 | 備考 |
|---|---|---|---|
| トンネル接続 | iPhone / Android (Expo Go) | 必要 | 開発用。`npm run start:tunnel` (Cloudflare Quick Tunnel。要 cloudflared) |
| EAS Build (APK) | Android | 不要 | `eas.json` の `preview` プロファイル。Expo アカウント (無料) が必要 |
| EAS Build (iOS) | iPhone | 不要 | Apple Developer Program (有料) が必要 |

## ロードマップ

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | 登録・記録・前回比較・自己ベスト・ジム/自重 | 実装済み |
| 2 | 推定1RM・体重比・種目別ポイント・階級・ランキング | 未着手 |
| 3 | 異常値検出・暫定/公式ランキング・動画認証 | 未着手 |
| 4 | 体重・PFC管理・フレンド・バッジ | 未着手 |
