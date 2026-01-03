-- Add assigned_weekday column to workout_plan_days
-- This allows users to assign specific weekdays to their routine days
ALTER TABLE public.workout_plan_days 
ADD COLUMN assigned_weekday TEXT CHECK (assigned_weekday IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));