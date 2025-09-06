/*
  # Add health_mode column to user_profiles table

  1. Changes
    - Add `health_mode` column to `user_profiles` table
    - Set default value to 'normal'
    - Add check constraint to ensure only valid values are allowed

  2. Security
    - No changes to RLS policies needed
*/

-- Add health_mode column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'health_mode'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN health_mode text DEFAULT 'normal';
    
    -- Add check constraint to ensure only valid values
    ALTER TABLE user_profiles ADD CONSTRAINT health_mode_check 
    CHECK (health_mode IN ('normal', 'diet', 'workout'));
  END IF;
END $$;