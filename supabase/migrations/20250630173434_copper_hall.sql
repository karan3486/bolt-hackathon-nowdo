/*
  # Fix Email Verification Redirect

  1. Changes
    - Add redirect URLs for the application
    - Update email templates to use the correct redirect URL
    - Create a function to handle auth redirects properly
    - Set up proper site URL configuration

  2. Security
    - Maintain existing RLS policies
    - No breaking changes to existing functionality
*/

-- Add additional redirect URLs to handle various environments
INSERT INTO auth.redirect_urls (redirect_url)
VALUES 
  ('https://nowdo-app.vercel.app/*'),
  ('https://nowdo-app.vercel.app'),
  ('exp://*/--/*'),
  ('nowdo://*')
ON CONFLICT DO NOTHING;

-- Update email templates to use the correct redirect URL
UPDATE auth.templates
SET template = REPLACE(
  template, 
  'http://localhost:3000', 
  'https://nowdo-app.vercel.app'
)
WHERE template LIKE '%http://localhost:3000%';

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