/*
  # Add completed days tracking table

  1. New Tables
    - `user_completed_days`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `completed_date` (date)
      - `recipes_used` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_completed_days` table
    - Add policy for authenticated users to manage their own completed days

  3. Indexes
    - Add index on user_id and completed_date for efficient queries
*/

CREATE TABLE IF NOT EXISTS user_completed_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  completed_date date NOT NULL,
  recipes_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_completed_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own completed days"
  ON user_completed_days
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_completed_days_user_id_fkey'
  ) THEN
    ALTER TABLE user_completed_days 
    ADD CONSTRAINT user_completed_days_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint to prevent duplicate completions for the same day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_completed_days_user_date_unique'
  ) THEN
    ALTER TABLE user_completed_days 
    ADD CONSTRAINT user_completed_days_user_date_unique 
    UNIQUE (user_id, completed_date);
  END IF;
END $$;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_completed_days_user_date 
ON user_completed_days (user_id, completed_date);