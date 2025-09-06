/*
  # Add recipe frequency settings to user profiles

  1. Changes
    - Add `recipe_frequency` column to `user_profiles` table
    - Store JSON data for S/A/B/C grade recipe frequency settings
    - Set default values for existing users

  2. Default Settings
    - S grade: 2 days (high-rated recipes appear frequently)
    - A grade: 3 days (good recipes appear regularly)
    - B grade: 7 days (average recipes appear weekly)
    - C grade: 30 days (low-rated recipes appear rarely)
*/

-- Add recipe_frequency column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'recipe_frequency'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN recipe_frequency jsonb DEFAULT '{"S": 2, "A": 3, "B": 7, "C": 30}'::jsonb;
  END IF;
END $$;

-- Update existing users with default recipe frequency settings
UPDATE user_profiles 
SET recipe_frequency = '{"S": 2, "A": 3, "B": 7, "C": 30}'::jsonb
WHERE recipe_frequency IS NULL;