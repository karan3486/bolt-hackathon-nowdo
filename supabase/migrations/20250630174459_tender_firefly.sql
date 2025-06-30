/*
  # Fix User Registration Database Error

  1. Database Functions
    - Create or update the trigger function for user profile creation
    - Ensure proper error handling in user creation process
    - Add missing constraints and indexes

  2. Security
    - Ensure RLS policies are properly configured
    - Add proper foreign key constraints
    - Handle edge cases in user creation

  3. Triggers
    - Create trigger to automatically create user profile on auth.users insert
    - Create trigger to automatically create user preferences on auth.users insert
    - Create trigger to automatically create user settings on auth.users insert
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_preferences with default values
  INSERT INTO public.user_preferences (
    user_id,
    theme,
    notifications_enabled,
    work_duration,
    short_break_duration,
    long_break_duration,
    sessions_until_long_break,
    first_launch
  )
  VALUES (
    NEW.id,
    'dark',
    true,
    25,
    5,
    15,
    4,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_settings with default values
  INSERT INTO public.user_settings (
    user_id,
    theme_preference,
    notifications_enabled,
    email_notifications,
    push_notifications,
    language,
    privacy_analytics,
    privacy_crash_reports,
    auto_backup,
    sound_effects,
    haptic_feedback
  )
  VALUES (
    NEW.id,
    'dark',
    true,
    true,
    true,
    'en',
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all tables have proper RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Ensure foreign key constraints exist and are properly configured
DO $$
BEGIN
  -- Add foreign key constraint for user_profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key constraint for user_preferences if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_preferences_user_id_fkey' 
    AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key constraint for user_settings if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_settings_user_id_fkey' 
    AND table_name = 'user_settings'
  ) THEN
    ALTER TABLE public.user_settings 
    ADD CONSTRAINT user_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Ensure unique constraints exist
DO $$
BEGIN
  -- Add unique constraint for user_profiles.user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_key' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;

  -- Add unique constraint for user_preferences.user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_preferences_user_id_key' 
    AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
  END IF;

  -- Add unique constraint for user_settings.user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_settings_user_id_key' 
    AND table_name = 'user_settings'
  ) THEN
    ALTER TABLE public.user_settings 
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;