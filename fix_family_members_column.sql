-- Fix family_members column type from text to jsonb
-- This script should be executed directly in Supabase SQL editor

-- Step 1: Add a temporary jsonb column
ALTER TABLE user_profiles ADD COLUMN family_members_temp jsonb;

-- Step 2: Convert existing text data to jsonb (handle empty/null values)
UPDATE user_profiles 
SET family_members_temp = 
  CASE 
    WHEN family_members IS NULL OR family_members = '' THEN '[]'::jsonb
    WHEN family_members = '[]' THEN '[]'::jsonb
    ELSE family_members::jsonb
  END;

-- Step 3: Drop the old text column
ALTER TABLE user_profiles DROP COLUMN family_members;

-- Step 4: Rename the temporary column
ALTER TABLE user_profiles RENAME COLUMN family_members_temp TO family_members;

-- Step 5: Set default value
ALTER TABLE user_profiles ALTER COLUMN family_members SET DEFAULT '[]'::jsonb;

-- Step 6: Add not null constraint if needed
ALTER TABLE user_profiles ALTER COLUMN family_members SET NOT NULL;