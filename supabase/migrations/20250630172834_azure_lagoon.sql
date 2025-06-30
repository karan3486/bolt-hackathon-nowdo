/*
  # Fix Registration Database Error

  1. Changes
    - Fix the user profile creation trigger to handle errors gracefully
    - Update the trigger function to avoid conflicts and handle edge cases
    - Ensure proper error handling for user registration

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during user creation
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with proper error handling
  INSERT INTO user_profiles (user_id, email, first_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert user settings with proper error handling
  INSERT INTO user_settings (user_id, theme_preference)
  VALUES (NEW.id, 'dark')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Also update the settings creation function to be more robust
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
DROP FUNCTION IF EXISTS create_user_settings();

-- The settings creation is now handled in the main profile creation function above
-- so we don't need a separate trigger for settings

-- Ensure the user_profiles table has proper constraints
DO $$
BEGIN
  -- Make sure the user_id column is properly constrained
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_user_id_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Ensure the user_settings table has proper constraints
DO $$
BEGIN
  -- Make sure the user_id column is properly constrained
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_settings' AND constraint_name = 'user_settings_user_id_key'
  ) THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;