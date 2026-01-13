-- =============================================
-- MVP DATABASE MIGRATION
-- =============================================

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS training_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS training_style text DEFAULT 'weights',
ADD COLUMN IF NOT EXISTS available_equipment text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS secondary_goals text[] DEFAULT '{}';

-- 2. Add feedback columns to workout_sessions
ALTER TABLE public.workout_sessions 
ADD COLUMN IF NOT EXISTS completion_status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS feeling text DEFAULT 'normal';

-- 3. Create food_preferences table
CREATE TABLE IF NOT EXISTS public.food_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  preference text DEFAULT 'normal', -- normal, dont_care, supplements
  liked_foods text,
  disliked_foods text,
  allergies text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on food_preferences
ALTER TABLE public.food_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for food_preferences
CREATE POLICY "Users can view their own food preferences"
ON public.food_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food preferences"
ON public.food_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food preferences"
ON public.food_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food preferences"
ON public.food_preferences FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create trigger for updated_at on food_preferences
CREATE TRIGGER update_food_preferences_updated_at
BEFORE UPDATE ON public.food_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();