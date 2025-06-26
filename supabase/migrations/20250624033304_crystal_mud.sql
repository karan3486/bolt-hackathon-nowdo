/*
  # Add time fields to user_tasks table

  1. Changes
    - Add `scheduled_date` field for the specific date the task is scheduled
    - Add `scheduled_time` field for the specific time of day
    - Update existing tasks to use current date as default

  2. Security
    - Maintain existing RLS policies
    - No breaking changes to existing functionality
*/

-- Add new time-related columns to user_tasks
DO $$
BEGIN
  -- Add scheduled_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tasks' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE user_tasks ADD COLUMN scheduled_date date DEFAULT CURRENT_DATE;
  END IF;

  -- Add scheduled_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tasks' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE user_tasks ADD COLUMN scheduled_time time DEFAULT '09:00:00';
  END IF;
END $$;

-- Create index for better performance on date/time queries
CREATE INDEX IF NOT EXISTS idx_user_tasks_scheduled_date ON user_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_scheduled_time ON user_tasks(scheduled_time);

-- Update existing tasks to have today's date if they don't have one
UPDATE user_tasks 
SET scheduled_date = CURRENT_DATE 
WHERE scheduled_date IS NULL;

-- Update existing tasks to have 9 AM as default time if they don't have one
UPDATE user_tasks 
SET scheduled_time = '09:00:00' 
WHERE scheduled_time IS NULL;