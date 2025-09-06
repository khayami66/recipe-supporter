# Supabaseマイグレーション適用ガイド

## 概要
家族構成情報をログアウト後も保持するため、データベーステーブルの設定が必要です。

## マイグレーション適用手順

### 方法1: Supabaseダッシュボードから直接適用

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 対象のプロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 以下のSQLを実行：

```sql
-- supabase/migrations/20250906_create_user_profiles.sql の内容を実行
```

### 方法2: Supabase CLIを使用

1. Supabase CLIをインストール（未インストールの場合）
```bash
npm install -g supabase
```

2. プロジェクトルートで初期化
```bash
supabase init
```

3. Supabaseプロジェクトとリンク
```bash
supabase link --project-ref roeojaxovszrejfpzenz
```

4. マイグレーションを適用
```bash
supabase db push
```

## 確認事項

### データベーステーブルの確認
Supabaseダッシュボードの「Table Editor」で以下のテーブルが存在することを確認：

- `user_profiles`
  - `id` (uuid, primary key)
  - `family_count` (integer)
  - `preferences` (text)
  - `family_members` (jsonb)
  - `health_mode` (text)
  - `recipe_frequency` (jsonb)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

### RLS（Row Level Security）の確認
各テーブルでRLSが有効になっていることを確認

## トラブルシューティング

### エラー: テーブルが既に存在する
`CREATE TABLE IF NOT EXISTS`を使用しているため、このエラーは発生しないはずです。

### エラー: 権限がない
Supabaseダッシュボードで、Authentication > Policiesを確認し、必要な権限が設定されていることを確認してください。

### データが保存されない
1. ブラウザのコンソールでエラーを確認
2. Supabaseダッシュボードでテーブルのデータを直接確認
3. RLSポリシーが正しく設定されているか確認

## 実装の変更点

### 1. データベーステーブルの作成
- `user_profiles`テーブルに家族構成情報を保存する`family_members`カラムを追加
- JSONBデータ型を使用して構造化データを保存

### 2. データ保存処理の改善
- `useUserData`フックの`saveUserSettings`関数で、birthDateを適切に文字列化
- family_membersデータをJSONBとして保存

### 3. データ読み込み処理の改善
- `loadUserSettings`関数で、データベースから読み込んだデータを適切に復元
- family_membersが空の場合のデフォルト値生成

### 4. SettingsPageの改善
- localStorageへの依存を削除
- データベースから読み込んだデータを優先的に使用

## 動作確認

1. アプリケーションにログイン
2. 基本設定画面で家族構成を設定
3. 保存ボタンをクリック
4. ログアウト
5. 再度ログイン
6. 基本設定画面で保存した家族構成が表示されることを確認