-- This migration fixes auth redirects for email verification
-- It checks for table existence before performing operations

-- Update email templates to use the correct redirect URL
DO $$
BEGIN
  -- Check if auth.templates exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'templates'
  ) THEN
    UPDATE auth.templates
    SET template = REPLACE(
      template, 
      'http://localhost:3000', 
      'https://nowdo-app.vercel.app'
    )
    WHERE template LIKE '%http://localhost:3000%';
  END IF;
END $$;

-- Create a function to handle auth redirects properly
CREATE OR REPLACE FUNCTION handle_auth_redirect()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the redirect for debugging
  RAISE NOTICE 'Auth redirect triggered for user %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to handle auth redirects
DROP TRIGGER IF EXISTS on_auth_redirect ON auth.users;
CREATE TRIGGER on_auth_redirect
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_auth_redirect();

-- Update site URL in auth settings (using the correct table)
DO $$
BEGIN
  -- Check if auth.config exists (for newer Supabase versions)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'config'
  ) THEN
    UPDATE auth.config
    SET site_url = 'https://nowdo-app.vercel.app'
    WHERE site_url LIKE 'http://localhost%';
  -- For older Supabase versions, try to update the site URL in auth.instances
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'instances'
  ) THEN
    UPDATE auth.instances
    SET external_url = 'https://nowdo-app.vercel.app'
    WHERE external_url LIKE 'http://localhost%';
  END IF;
END $$;

-- Add redirect URLs using the appropriate method based on Supabase version
DO $$
DECLARE
  redirect_urls_table_exists boolean;
  additional_redirect_urls_function_exists boolean;
BEGIN
  -- Check if auth.redirect_urls exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'redirect_urls'
  ) INTO redirect_urls_table_exists;

  -- Check if auth.set_additional_redirect_urls function exists
  SELECT EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'auth'
    AND routine_name = 'set_additional_redirect_urls'
  ) INTO additional_redirect_urls_function_exists;

  -- If redirect_urls table exists, insert directly
  IF redirect_urls_table_exists THEN
    INSERT INTO auth.redirect_urls (redirect_url)
    VALUES 
      ('https://nowdo-app.vercel.app/*'),
      ('https://nowdo-app.vercel.app'),
      ('exp://*/--/*'),
      ('nowdo://*')
    ON CONFLICT DO NOTHING;
  -- If the function exists, use it instead
  ELSIF additional_redirect_urls_function_exists THEN
    PERFORM auth.set_additional_redirect_urls(ARRAY[
      'https://nowdo-app.vercel.app/*',
      'https://nowdo-app.vercel.app',
      'exp://*/--/*',
      'nowdo://*'
    ]);
  -- Otherwise, try to update the config table if it exists
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'config'
  ) THEN
    -- Try to update additional_redirect_urls column if it exists
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'auth'
      AND table_name = 'config'
      AND column_name = 'additional_redirect_urls'
    ) THEN
      UPDATE auth.config
      SET additional_redirect_urls = array_cat(
        additional_redirect_urls,
        ARRAY[
          'https://nowdo-app.vercel.app/*',
          'https://nowdo-app.vercel.app',
          'exp://*/--/*',
          'nowdo://*'
        ]
      );
    END IF;
  END IF;
END $$;