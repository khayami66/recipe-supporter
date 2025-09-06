/*
  # Recipe Ratings Table

  1. New Tables
    - `user_recipe_ratings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `recipe_name` (text)
      - `taste` (integer, 1-5)
      - `cooking_time` (integer, 1-5)
      - `difficulty` (integer, 1-5)
      - `would_make_again` (integer, 1-5)
      - `rated_date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_recipe_ratings` table
    - Add policy for authenticated users to manage their own ratings

  3. Indexes
    - Add index on user_id and recipe_name for efficient queries
*/

CREATE TABLE IF NOT EXISTS user_recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_name text NOT NULL,
  taste integer NOT NULL CHECK (taste >= 1 AND taste <= 5),
  cooking_time integer NOT NULL CHECK (cooking_time >= 1 AND cooking_time <= 5),
  difficulty integer NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  would_make_again integer NOT NULL CHECK (would_make_again >= 1 AND would_make_again <= 5),
  rated_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_recipe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recipe ratings"
  ON user_recipe_ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_recipe_ratings_user_id_fkey'
  ) THEN
    ALTER TABLE user_recipe_ratings 
    ADD CONSTRAINT user_recipe_ratings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_recipe_ratings_user_recipe 
ON user_recipe_ratings (user_id, recipe_name);

CREATE INDEX IF NOT EXISTS idx_user_recipe_ratings_user_date 
ON user_recipe_ratings (user_id, rated_date);