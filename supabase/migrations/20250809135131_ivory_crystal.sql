/*
  # 購入済み食材テーブルの作成

  1. 新しいテーブル
    - `user_purchased_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `ingredient_name` (text)
      - `amount` (numeric)
      - `unit` (text)
      - `category` (text)
      - `purchased_date` (date)
      - `created_at` (timestamptz)

  2. セキュリティ
    - RLSを有効化
    - ユーザーは自分の購入済みアイテムのみアクセス可能

  3. インデックス
    - user_id と purchased_date でのクエリを最適化
*/

CREATE TABLE IF NOT EXISTS user_purchased_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_name text NOT NULL,
  amount numeric NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  purchased_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_purchased_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchased items"
  ON user_purchased_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchased items"
  ON user_purchased_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchased items"
  ON user_purchased_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchased items"
  ON user_purchased_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- インデックスを作成してクエリを最適化
CREATE INDEX IF NOT EXISTS idx_user_purchased_items_user_date 
  ON user_purchased_items(user_id, purchased_date);

CREATE INDEX IF NOT EXISTS idx_user_purchased_items_user_ingredient 
  ON user_purchased_items(user_id, ingredient_name);