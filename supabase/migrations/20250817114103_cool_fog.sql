/*
  # Add family members column to user profiles

  1. Changes
    - Add `family_members` column to `user_profiles` table to store detailed family composition data
    - Column stores JSON data with family member details (birth date, gender, appetite level, name)

  2. Data Structure
    - JSON array containing family member objects
    - Each member has: id, birthDate, gender, appetiteLevel, name (optional)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'family_members'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN family_members text DEFAULT '[]';
  END IF;
END $$;