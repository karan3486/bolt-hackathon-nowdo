/*
  # Add Settings Table

  1. New Tables
    - `user_settings` - User-specific settings with foreign key to auth.users
    
  2. Security
    - Enable RLS on user_settings table
    - Add policies for authenticated users to access only their own settings
    - Implement proper foreign key constraints

  3. Features
    - Theme preference storage
    - Notification settings
    - Language preferences
    - Privacy settings
    - Automatic user_id population
    - Timestamps for created_at and updated_at
*/

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme_preference text NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system')),
  notifications_enabled boolean NOT NULL DEFAULT true,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh')),
  privacy_analytics boolean NOT NULL DEFAULT true,
  privacy_crash_reports boolean NOT NULL DEFAULT true,
  auto_backup boolean NOT NULL DEFAULT true,
  sound_effects boolean NOT NULL DEFAULT true,
  haptic_feedback boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme_preference);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default settings when user signs up
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id, theme_preference)
  VALUES (NEW.id, 'dark')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create settings when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();