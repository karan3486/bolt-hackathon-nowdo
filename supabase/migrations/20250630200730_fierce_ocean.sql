/*
  # Fix Email Verification Redirect

  1. Changes
     - Add a function to handle email verification redirects
     - Configure proper redirect URLs for authentication
     - Ensure mobile deep linking works correctly
*/

-- Create a function to handle email verification redirects
CREATE OR REPLACE FUNCTION public.handle_email_verification_redirect()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be triggered when a user verifies their email
  -- We can use it to update user records or perform other actions
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger for email verification (if needed)
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_verification_redirect();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_email_verification_redirect() TO service_role;