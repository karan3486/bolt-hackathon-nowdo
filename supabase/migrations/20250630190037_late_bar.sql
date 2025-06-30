/*
  # Fix User Registration and Database Record Creation

  1. Database Triggers
    - Create robust trigger function for new user creation
    - Ensure all user-related tables get populated on registration
    - Add proper error handling and logging

  2. Security
    - Ensure RLS policies are correctly configured
    - Grant proper permissions for user creation flow
    - Add service role permissions for trigger execution

  3. Data Integrity
    - Ensure foreign key constraints are properly set
    - Add unique constraints where needed
    - Create necessary indexes for performance
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a robust function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Get email and metadata from the new user record
  user_email := COALESCE(NEW.email, '');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Parse first and last name
  IF user_name != '' THEN
    first_name := split_part(user_name, ' ', 1);
    IF position(' ' in user_name) > 0 THEN
      last_name := substring(user_name from position(' ' in user_name) + 1);
    ELSE
      last_name := NULL;
    END IF;
  ELSE
    first_name := NULL;
    last_name := NULL;
  END IF;
  
  -- Log the user creation attempt
  RAISE LOG 'Creating profile and settings for user: % with email: %', NEW.id, user_email;
  
  -- Insert into user_profiles
  BEGIN
    INSERT INTO public.user_profiles (
      user_id, 
      email,
      first_name,
      last_name,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      user_email,
      first_name,
      last_name,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
      updated_at = now();
      
    RAISE LOG 'Successfully created/updated user_profiles for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating user_profiles for user %: %', NEW.id, SQLERRM;
  END;

  -- Insert into user_preferences
  BEGIN
    INSERT INTO public.user_preferences (
      user_id,
      theme,
      notifications_enabled,
      work_duration,
      short_break_duration,
      long_break_duration,
      sessions_until_long_break,
      first_launch,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'dark',
      true,
      25,
      5,
      15,
      4,
      true,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'Successfully created user_preferences for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating user_preferences for user %: %', NEW.id, SQLERRM;
  END;

  -- Insert into user_settings
  BEGIN
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
      haptic_feedback,
      created_at,
      updated_at
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
      true,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'Successfully created user_settings for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating user_settings for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Unexpected error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to run after user insertion
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all tables have RLS enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to insert profiles (for trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Drop and recreate RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to insert preferences (for trigger)
CREATE POLICY "Service role can insert preferences"
  ON public.user_preferences
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Drop and recreate RLS policies for user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON public.user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role to insert settings (for trigger)
CREATE POLICY "Service role can insert settings"
  ON public.user_settings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;

-- Ensure foreign key constraints exist
DO $$
BEGIN
  -- user_profiles foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- user_preferences foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_preferences_user_id_fkey' 
    AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- user_settings foreign key
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

-- Ensure unique constraints exist
DO $$
BEGIN
  -- user_profiles unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_key' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;

  -- user_preferences unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_preferences_user_id_key' 
    AND table_name = 'user_preferences'
  ) THEN
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
  END IF;

  -- user_settings unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_settings_user_id_key' 
    AND table_name = 'user_settings'
  ) THEN
    ALTER TABLE public.user_settings 
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON public.user_settings(theme_preference);

-- Create a function to manually create user records for existing users who might be missing them
CREATE OR REPLACE FUNCTION public.create_missing_user_records()
RETURNS TABLE(user_id uuid, created_profile boolean, created_preferences boolean, created_settings boolean) AS $$
DECLARE
  user_record RECORD;
  profile_created boolean;
  preferences_created boolean;
  settings_created boolean;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
  LOOP
    profile_created := false;
    preferences_created := false;
    settings_created := false;
    
    -- Create profile
    BEGIN
      INSERT INTO public.user_profiles (user_id, email, created_at, updated_at)
      VALUES (user_record.id, user_record.email, now(), now())
      ON CONFLICT (user_id) DO NOTHING;
      profile_created := true;
    EXCEPTION
      WHEN OTHERS THEN
        profile_created := false;
    END;
    
    -- Create preferences
    BEGIN
      INSERT INTO public.user_preferences (
        user_id, theme, notifications_enabled, work_duration, 
        short_break_duration, long_break_duration, sessions_until_long_break, 
        first_launch, created_at, updated_at
      )
      VALUES (
        user_record.id, 'dark', true, 25, 5, 15, 4, true, now(), now()
      )
      ON CONFLICT (user_id) DO NOTHING;
      preferences_created := true;
    EXCEPTION
      WHEN OTHERS THEN
        preferences_created := false;
    END;
    
    -- Create settings
    BEGIN
      INSERT INTO public.user_settings (
        user_id, theme_preference, notifications_enabled, email_notifications,
        push_notifications, language, privacy_analytics, privacy_crash_reports,
        auto_backup, sound_effects, haptic_feedback, created_at, updated_at
      )
      VALUES (
        user_record.id, 'dark', true, true, true, 'en', true, true, true, true, true, now(), now()
      )
      ON CONFLICT (user_id) DO NOTHING;
      settings_created := true;
    EXCEPTION
      WHEN OTHERS THEN
        settings_created := false;
    END;
    
    RETURN QUERY SELECT user_record.id, profile_created, preferences_created, settings_created;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.create_missing_user_records() TO authenticated, service_role;