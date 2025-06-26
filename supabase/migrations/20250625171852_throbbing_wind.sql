/*
  # Fix Profile Pictures Storage Configuration

  1. Storage Setup
    - Create 'profile-pictures' bucket for user profile images
    - Configure bucket policies for authenticated users
    - Allow public access for profile picture viewing

  2. Security
    - Users can upload their own profile pictures
    - Public read access for profile pictures
    - Authenticated users can manage their own files
*/

-- Create the profile-pictures bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Drop existing policies if they exist (these will work since we're targeting specific policies)
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;

-- Policy: Allow authenticated users to upload their own profile pictures
-- Using a simpler approach that works with Supabase's RLS system
CREATE POLICY "Users can upload their own profile pictures"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-pictures');