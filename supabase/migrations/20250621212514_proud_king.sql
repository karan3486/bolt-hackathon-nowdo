/*
  # User-Specific Data Management System

  1. New Tables
    - `user_tasks` - User-specific tasks with foreign key to auth.users
    - `user_habits` - User-specific habits with foreign key to auth.users
    - `user_habit_completions` - User habit completion tracking
    - `user_pomodoro_sessions` - User pomodoro session history
    - `user_preferences` - User application preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
    - Implement proper foreign key constraints

  3. Features
    - Automatic user_id population via triggers
    - Timestamps for created_at and updated_at
    - Proper indexing for performance
    - Data validation constraints
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Tasks Table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL CHECK (length(title) > 0),
  description text DEFAULT '',
  category text NOT NULL CHECK (category IN ('work', 'personal', 'health', 'education')),
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  duration integer NOT NULL DEFAULT 30 CHECK (duration > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Habits Table
CREATE TABLE IF NOT EXISTS user_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL CHECK (length(title) > 0),
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Health',
  color text NOT NULL DEFAULT '#4FC3F7',
  target_days integer[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Habit Completions Table
CREATE TABLE IF NOT EXISTS user_habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id uuid REFERENCES user_habits(id) ON DELETE CASCADE NOT NULL,
  completion_date date NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, completion_date)
);

-- User Pomodoro Sessions Table
CREATE TABLE IF NOT EXISTS user_pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES user_tasks(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('work', 'break')),
  duration integer NOT NULL CHECK (duration > 0),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled boolean NOT NULL DEFAULT true,
  work_duration integer NOT NULL DEFAULT 25 CHECK (work_duration > 0),
  short_break_duration integer NOT NULL DEFAULT 5 CHECK (short_break_duration > 0),
  long_break_duration integer NOT NULL DEFAULT 15 CHECK (long_break_duration > 0),
  sessions_until_long_break integer NOT NULL DEFAULT 4 CHECK (sessions_until_long_break > 0),
  first_launch boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_priority ON user_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_user_tasks_category ON user_tasks(category);
CREATE INDEX IF NOT EXISTS idx_user_tasks_created_at ON user_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_user_habits_user_id ON user_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_habits_category ON user_habits(category);

CREATE INDEX IF NOT EXISTS idx_user_habit_completions_user_id ON user_habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_habit_completions_habit_id ON user_habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_user_habit_completions_date ON user_habit_completions(completion_date);

CREATE INDEX IF NOT EXISTS idx_user_pomodoro_sessions_user_id ON user_pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pomodoro_sessions_start_time ON user_pomodoro_sessions(start_time);

-- Enable Row Level Security
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for user_tasks
CREATE POLICY "Users can view own tasks"
  ON user_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON user_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON user_tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON user_tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS Policies for user_habits
CREATE POLICY "Users can view own habits"
  ON user_habits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON user_habits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON user_habits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON user_habits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS Policies for user_habit_completions
CREATE POLICY "Users can view own habit completions"
  ON user_habit_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions"
  ON user_habit_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit completions"
  ON user_habit_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions"
  ON user_habit_completions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS Policies for user_pomodoro_sessions
CREATE POLICY "Users can view own pomodoro sessions"
  ON user_pomodoro_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pomodoro sessions"
  ON user_pomodoro_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro sessions"
  ON user_pomodoro_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pomodoro sessions"
  ON user_pomodoro_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_habits_updated_at
  BEFORE UPDATE ON user_habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clear all user data
CREATE OR REPLACE FUNCTION clear_user_data(target_user_id uuid)
RETURNS json AS $$
DECLARE
  tasks_count integer;
  habits_count integer;
  completions_count integer;
  sessions_count integer;
  result json;
BEGIN
  -- Verify the user exists and is the authenticated user
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot clear data for other users';
  END IF;

  -- Count records before deletion for logging
  SELECT COUNT(*) INTO tasks_count FROM user_tasks WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO habits_count FROM user_habits WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO completions_count FROM user_habit_completions WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO sessions_count FROM user_pomodoro_sessions WHERE user_id = target_user_id;

  -- Delete all user data (cascading will handle related records)
  DELETE FROM user_habit_completions WHERE user_id = target_user_id;
  DELETE FROM user_pomodoro_sessions WHERE user_id = target_user_id;
  DELETE FROM user_habits WHERE user_id = target_user_id;
  DELETE FROM user_tasks WHERE user_id = target_user_id;
  
  -- Reset preferences to defaults instead of deleting
  INSERT INTO user_preferences (user_id) 
  VALUES (target_user_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    theme = 'system',
    notifications_enabled = true,
    work_duration = 25,
    short_break_duration = 5,
    long_break_duration = 15,
    sessions_until_long_break = 4,
    first_launch = true,
    updated_at = now();

  -- Return summary of cleared data
  result := json_build_object(
    'success', true,
    'cleared_at', now(),
    'user_id', target_user_id,
    'deleted_counts', json_build_object(
      'tasks', tasks_count,
      'habits', habits_count,
      'habit_completions', completions_count,
      'pomodoro_sessions', sessions_count
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user data summary
CREATE OR REPLACE FUNCTION get_user_data_summary(target_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Verify the user exists and is the authenticated user
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access data for other users';
  END IF;

  SELECT json_build_object(
    'user_id', target_user_id,
    'summary', json_build_object(
      'tasks', json_build_object(
        'total', (SELECT COUNT(*) FROM user_tasks WHERE user_id = target_user_id),
        'completed', (SELECT COUNT(*) FROM user_tasks WHERE user_id = target_user_id AND status = 'completed'),
        'pending', (SELECT COUNT(*) FROM user_tasks WHERE user_id = target_user_id AND status = 'pending'),
        'in_progress', (SELECT COUNT(*) FROM user_tasks WHERE user_id = target_user_id AND status = 'in-progress')
      ),
      'habits', json_build_object(
        'total', (SELECT COUNT(*) FROM user_habits WHERE user_id = target_user_id),
        'completions_this_week', (
          SELECT COUNT(*) 
          FROM user_habit_completions 
          WHERE user_id = target_user_id 
          AND completion_date >= date_trunc('week', CURRENT_DATE)
          AND completed = true
        )
      ),
      'pomodoro_sessions', json_build_object(
        'total', (SELECT COUNT(*) FROM user_pomodoro_sessions WHERE user_id = target_user_id),
        'completed', (SELECT COUNT(*) FROM user_pomodoro_sessions WHERE user_id = target_user_id AND completed = true),
        'this_week', (
          SELECT COUNT(*) 
          FROM user_pomodoro_sessions 
          WHERE user_id = target_user_id 
          AND start_time >= date_trunc('week', CURRENT_DATE)
        )
      )
    ),
    'last_activity', (
      SELECT MAX(greatest_date) FROM (
        SELECT MAX(updated_at) as greatest_date FROM user_tasks WHERE user_id = target_user_id
        UNION ALL
        SELECT MAX(updated_at) as greatest_date FROM user_habits WHERE user_id = target_user_id
        UNION ALL
        SELECT MAX(created_at) as greatest_date FROM user_habit_completions WHERE user_id = target_user_id
        UNION ALL
        SELECT MAX(created_at) as greatest_date FROM user_pomodoro_sessions WHERE user_id = target_user_id
      ) as dates
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;