-- =============================================
-- AUTOPILOT SYSTEM: Database Schema Upgrade
-- =============================================

-- 1. Exercise Progression Tracking: Add feeling and functional max to exercise_logs
ALTER TABLE public.exercise_logs 
ADD COLUMN IF NOT EXISTS feeling TEXT CHECK (feeling IN ('easy', 'correct', 'hard')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_pr BOOLEAN DEFAULT FALSE;

-- 2. Create exercise_max_weights table to track functional maximums per user/exercise
CREATE TABLE IF NOT EXISTS public.exercise_max_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  functional_max_kg NUMERIC NOT NULL DEFAULT 0,
  best_weight_kg NUMERIC NOT NULL DEFAULT 0,
  best_reps INTEGER NOT NULL DEFAULT 0,
  consecutive_successful_sessions INTEGER DEFAULT 0,
  last_feeling TEXT CHECK (last_feeling IN ('easy', 'correct', 'hard')),
  last_session_date DATE,
  should_progress BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- Enable RLS on exercise_max_weights
ALTER TABLE public.exercise_max_weights ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_max_weights
CREATE POLICY "Users can view their own max weights" 
ON public.exercise_max_weights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own max weights" 
ON public.exercise_max_weights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own max weights" 
ON public.exercise_max_weights 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Add time_blocks JSONB column to user_schedules for detailed schedule
-- Structure: { "monday": [{ type: "class", name: "Matemáticas", start: "09:00", end: "10:30" }], ... }
ALTER TABLE public.user_schedules 
ADD COLUMN IF NOT EXISTS time_blocks JSONB DEFAULT '{}'::jsonb;

-- 4. Create trigger to auto-update updated_at
CREATE OR REPLACE TRIGGER update_exercise_max_weights_updated_at
BEFORE UPDATE ON public.exercise_max_weights
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_exercise_max_weights_user_exercise 
ON public.exercise_max_weights(user_id, exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_feeling 
ON public.exercise_logs(feeling) 
WHERE feeling IS NOT NULL;