# 家族構成データの永続化デバッグ手順

## 問題の確認

家族構成データがログアウト後に消える問題を解決するため、以下の手順でデバッグします。

## 1. データベーステーブルの作成

Supabaseダッシュボードで以下を実行：

1. [Supabase Dashboard](https://app.supabase.io) にログイン
2. プロジェクト `roeojaxovszrejfpzenz` を選択
3. 左メニュー「SQL Editor」をクリック
4. 「New query」を選択
5. `create-tables.sql` の内容をコピー&ペーストして実行

## 2. データベース接続テスト

1. ブラウザで `debug-db.html` を開く
2. 「Test Connection」ボタンをクリック
3. 「Check Tables」ボタンをクリック
4. 「Test user_profiles Table」ボタンをクリック

## 3. アプリでのテスト手順

1. アプリケーション（http://localhost:5173）を開く
2. ブラウザの開発者ツール（F12）を開き、Consoleタブを表示
3. ログインまたはアカウント作成
4. 基本設定画面で家族構成を設定（名前、生年月日、性別、食べる量）
5. 「設定を保存」ボタンをクリック
6. コンソールで以下のログを確認：
   - `Saving user settings:` - 保存データ
   - `Successfully saved user settings:` - 保存完了
7. ログアウト
8. コンソールで `Clearing user data on logout` ログを確認
9. 再度ログイン
10. コンソールで以下のログを確認：
    - `User ID changed:` - ユーザーID
    - `Loading all data for user:` - データ読み込み開始
    - `Loading user settings for user:` - 設定読み込み開始
    - `Loaded user settings from database:` - データベースからの読み込み結果
    - `Processing family members from database:` - 家族構成データ処理
    - `Setting user settings state:` - 状態設定
11. 基本設定画面で保存した家族構成が表示されることを確認

## 4. トラブルシューティング

### エラー: テーブルが存在しない
- SQL Editorで `create-tables.sql` を再実行
- テーブル作成エラーがないか確認

### エラー: 権限がない
- RLS（Row Level Security）ポリシーが正しく設定されているか確認
- 認証ユーザーのみアクセス可能になっているか確認

### データが保存されない
- コンソールで `Error saving user settings:` エラーを確認
- Supabaseダッシュボードの「Authentication」で正しくログインされているか確認

### データが読み込まれない
- コンソールで `Error loading user settings:` エラーを確認
- Supabaseダッシュボードの「Table Editor」で `user_profiles` テーブルにデータが存在するか確認

## 5. 期待される結果

- ログアウト前に設定した家族構成（名前、生年月日、性別、食べる量）が完全に保持される
- 再ログイン時に基本設定画面で設定内容が正しく表示される
- コンソールエラーが発生しない