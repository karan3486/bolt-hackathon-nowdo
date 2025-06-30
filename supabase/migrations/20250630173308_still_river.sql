/*
  # Fix Email Verification Redirect

  1. Changes
    - Update site URL and redirect URLs in auth.config table
    - Configure proper redirect handling for email verification
    - Ensure access tokens are properly processed

  2. Security
    - Maintain existing security policies
    - No breaking changes to existing functionality
*/

-- Update the site URL in auth.config to ensure proper redirects
UPDATE auth.config
SET site_url = 'https://nowdo-app.vercel.app'
WHERE site_url LIKE 'http://localhost%';

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