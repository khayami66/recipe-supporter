/*
  # Create user profiles table with proper structure

  1. Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `family_count` (integer)
      - `preferences` (text)
      - `family_members` (jsonb)
      - `health_mode` (text)
      - `recipe_frequency` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for authenticated users to manage their own profiles

  3. Indexes
    - Primary key index on id
*/

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_count integer DEFAULT 2,
  preferences text DEFAULT '',
  family_members jsonb DEFAULT '[]'::jsonb,
  health_mode text DEFAULT 'normal' CHECK (health_mode IN ('normal', 'diet', 'workout')),
  recipe_frequency jsonb DEFAULT '{"S": 2, "A": 3, "B": 7, "C": 30}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE
  ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data from text to jsonb if needed
DO $$
BEGIN
  -- Check if family_members column exists and is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' 
    AND column_name = 'family_members'
    AND data_type = 'text'
  ) THEN
    -- Create temporary column
    ALTER TABLE user_profiles ADD COLUMN family_members_temp jsonb;
    
    -- Migrate data
    UPDATE user_profiles 
    SET family_members_temp = 
      CASE 
        WHEN family_members IS NULL OR family_members = '' THEN '[]'::jsonb
        ELSE family_members::jsonb
      END;
    
    -- Drop old column and rename new one
    ALTER TABLE user_profiles DROP COLUMN family_members;
    ALTER TABLE user_profiles RENAME COLUMN family_members_temp TO family_members;
    
    -- Set default
    ALTER TABLE user_profiles ALTER COLUMN family_members SET DEFAULT '[]'::jsonb;
  END IF;
END $$;