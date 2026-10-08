# 筋トレ管理・競技型アプリ (kintore-rank) 設計書 — Phase 1 (MVP)

担当: 設計AI ミライ / 元資料: 筋トレアプリ企画書.pdf

## 1. 今回のスコープ

企画書「13. 開発ロードマップ」の **Phase 1: MVP** を実装する。

| 機能 | 内容 |
|---|---|
| 登録・ログイン | メールアドレス + パスワード (Supabase Auth) |
| 初期設定 | ニックネーム・身長・体重・都道府県・メインカテゴリ(ジム/自重) |
| トレーニング記録 | 日付・種目・重量・回数・セット数・メモ |
| 前回比較 | 同じ種目の直前の記録との差分 (例: 80kg×7回 → 80kg×8回 なら「+1回」) |
| 自己ベスト | 種目ごとのベストと、更新時の表示 |
| ジム/自重 | 種目マスタをカテゴリで分類。自重は重量欄を「加重(任意)」として扱う |

Phase 2 以降(推定1RM・体重比・ポイント・階級・ランキング)は **データ構造だけ先回りして詰まないようにし、実装はしない**。
ホーム画面には階級/ランキングの枠を「Phase 2 で公開」として置いておく。

## 2. 技術構成

| 層 | 採用 | 理由 |
|---|---|---|
| アプリ | Expo SDK 57 / React Native / TypeScript | スマホネイティブ。Expo Go で実機確認でき、`npm run web` でブラウザ確認も可能 |
| 画面遷移 | expo-router (ファイルベース) | テンプレート標準。`Stack.Protected` で未ログイン時のガードが書ける |
| バックエンド | Supabase 無料枠 (Auth + PostgreSQL + RLS) | Phase 2 の全国ランキングで共有DBが必要になるため最初から採用 |
| セッション保存 | ネイティブ: expo-sqlite の localStorage / Web: ブラウザ localStorage | Expo 公式ガイドの推奨構成 |

## 3. フォルダ構成

```
app/                     画面 (expo-router)
  _layout.tsx            AuthProvider + 認証ガード
  sign-in.tsx            ログイン/新規登録
  onboarding.tsx         初期設定 (プロフィール未作成時)
  (tabs)/
    _layout.tsx          タブ: ホーム / 記録 / 履歴 / プロフィール
    index.tsx            ホーム
    record.tsx           トレーニング記録
    history.tsx          履歴・前回比較・自己ベスト
    profile.tsx          プロフィール編集・ログアウト
components/ui.tsx        共通UI (Card, Button, Field, Chip など)
constants/theme.ts       色・余白
lib/
  supabase.ts            Supabaseクライアント
  authStorage(.web).ts   セッション保存先 (ネイティブ/Web)
  auth.tsx               AuthProvider (session + profile)
  exercises.ts           種目マスタ (ジム/自重)
  progress.ts            前回比較・自己ベスト判定 (純粋関数)
  db.ts                  DBアクセス (profiles / workout_logs)
  types.ts               型定義
  date.ts                日付ユーティリティ
supabase/schema.sql      テーブル + RLS
```

## 4. データ設計

### profiles (auth.users と 1:1)
| 列 | 型 | 備考 |
|---|---|---|
| id | uuid PK = auth.users.id | |
| nickname | text | ランキング表示名 (Phase 2) |
| height_cm | numeric | |
| weight_kg | numeric | 体重比 (Phase 2) で使用 |
| prefecture | text | 都道府県ランキング (Phase 2) |
| main_category | text `gym` / `bodyweight` | |

### workout_logs (1行 = 1種目の記録)
| 列 | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid → profiles.id | |
| performed_on | date | トレーニング日 |
| exercise_id | text | `lib/exercises.ts` のID |
| category | text | 記録時点のカテゴリ (集計用に非正規化) |
| weight_kg | numeric | ジム=使用重量 / 自重=加重(0可) |
| reps | int | |
| sets | int | |
| memo | text | |
| body_weight_kg | numeric | 記録時点の体重 (Phase 2 の体重比・不正検知で必要になるので今から保存) |
| created_at | timestamptz | |

- **種目マスタはコード側の定数**。Phase 1 ではユーザー追加種目なし。Phase 2 で係数・難易度を持たせる際に DB へ移す想定。
- RLS: Phase 1 は「自分の行だけ読み書き可」。ランキング公開時に読み取りポリシーを追加する。

## 5. ロジック定義 (lib/progress.ts)

- **前回比較**: 同一ユーザー・同一種目で、対象記録より前 (performed_on → created_at の順) の直近1件と比較し、重量・回数・セット数の差分を返す。
- **自己ベストの序列**
  - ジム: 重量が大きい方が上。同重量なら回数が多い方が上。
  - 自重: 加重が大きい方が上。同加重なら回数が多い方が上。
  - (Phase 2 で推定1RM比較に置き換える。関数を1か所にまとめてあるので差し替えやすい)
- **自己ベスト更新**: その記録が、それより前の全記録のベストを上回ったら「自己ベスト更新」。初回記録は「初記録」として区別する。

## 6. セットアップ手順 (ユーザー作業)

1. https://supabase.com で無料プロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. Authentication → Sign In / Providers → Email の「Confirm email」をオフ (開発中はメール確認を省略)
4. Project Settings → API の URL と publishable key を `.env` に記入 (`.env.example` 参照)
5. `npm start` → Expo Go アプリで QR を読み取る (またはブラウザで `w`)
