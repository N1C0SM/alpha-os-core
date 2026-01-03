-- Add new column for multiple weekdays
ALTER TABLE public.workout_plan_days 
  ADD COLUMN assigned_weekdays text[] DEFAULT NULL;

-- Migrate existing data from assigned_weekday to assigned_weekdays
UPDATE public.workout_plan_days 
  SET assigned_weekdays = ARRAY[assigned_weekday] 
  WHERE assigned_weekday IS NOT NULL;