-- Add privacy settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_habits BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_supplements BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_hydration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_schedule BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_goals BOOLEAN DEFAULT false;

-- Make workout_plans viewable by anyone if user has public posts
CREATE POLICY "Anyone can view workout plans of users with public posts" 
ON public.workout_plans
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.user_id = workout_plans.user_id 
    AND posts.is_public = true
  )
);

-- Make workout_plan_days viewable for public plans
CREATE POLICY "Anyone can view workout plan days of public plans" 
ON public.workout_plan_days
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_plans wp
    JOIN public.posts p ON p.user_id = wp.user_id AND p.is_public = true
    WHERE wp.id = workout_plan_days.workout_plan_id
  )
);

-- Make workout_plan_exercises viewable for public plans
CREATE POLICY "Anyone can view workout plan exercises of public plans" 
ON public.workout_plan_exercises
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_plan_days wpd
    JOIN public.workout_plans wp ON wp.id = wpd.workout_plan_id
    JOIN public.posts p ON p.user_id = wp.user_id AND p.is_public = true
    WHERE wpd.id = workout_plan_exercises.workout_plan_day_id
  )
);

-- Make workout_sessions viewable publicly  
CREATE POLICY "Anyone can view workout sessions of users with public posts" 
ON public.workout_sessions
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.user_id = workout_sessions.user_id 
    AND posts.is_public = true
  )
);

-- Make exercise_logs viewable for public sessions
CREATE POLICY "Anyone can view exercise logs of public sessions" 
ON public.exercise_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    JOIN public.posts p ON p.user_id = ws.user_id AND p.is_public = true
    WHERE ws.id = exercise_logs.workout_session_id
  )
);

-- Allow anyone to view public habit data when user has enabled it
CREATE POLICY "Anyone can view habits of users who share them" 
ON public.habits
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = habits.user_id 
    AND profiles.show_habits = true
  )
);

CREATE POLICY "Anyone can view habit logs of users who share them" 
ON public.habit_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = habit_logs.user_id 
    AND profiles.show_habits = true
  )
);

-- Allow anyone to view supplement plans when user has enabled it
CREATE POLICY "Anyone can view supplement plans of users who share them" 
ON public.supplement_plans
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = supplement_plans.user_id 
    AND profiles.show_supplements = true
  )
);

-- Allow anyone to view hydration logs when user has enabled it
CREATE POLICY "Anyone can view hydration logs of users who share them" 
ON public.hydration_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = hydration_logs.user_id 
    AND profiles.show_hydration = true
  )
);

-- Allow anyone to view schedules when user has enabled it
CREATE POLICY "Anyone can view schedules of users who share them" 
ON public.user_schedules
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_schedules.user_id 
    AND profiles.show_schedule = true
  )
);

-- Allow public profile viewing
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles
FOR SELECT 
USING (true);

-- Get followers count - create a function
CREATE OR REPLACE FUNCTION public.get_followers_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.user_follows WHERE following_id = target_user_id;
$$;

-- Get following count
CREATE OR REPLACE FUNCTION public.get_following_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.user_follows WHERE follower_id = target_user_id;
$$;