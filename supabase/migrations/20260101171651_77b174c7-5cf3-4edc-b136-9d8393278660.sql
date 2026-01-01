-- ============================================
-- AlphaSupps OS - Complete Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE public.fitness_goal AS ENUM (
  'muscle_gain',
  'fat_loss',
  'recomposition',
  'maintenance'
);

CREATE TYPE public.experience_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

CREATE TYPE public.gender AS ENUM (
  'male',
  'female',
  'other'
);

CREATE TYPE public.muscle_group AS ENUM (
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'full_body'
);

CREATE TYPE public.exercise_category AS ENUM (
  'compound',
  'isolation',
  'cardio',
  'stretching'
);

CREATE TYPE public.supplement_timing AS ENUM (
  'morning',
  'pre_workout',
  'intra_workout',
  'post_workout',
  'with_meal',
  'before_bed'
);

CREATE TYPE public.meal_type AS ENUM (
  'breakfast',
  'lunch',
  'snack',
  'dinner',
  'pre_workout',
  'post_workout'
);

CREATE TYPE public.workout_split AS ENUM (
  'push_pull_legs',
  'upper_lower',
  'full_body',
  'bro_split',
  'custom'
);

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender gender,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  body_fat_percentage NUMERIC(4,1),
  fitness_goal fitness_goal DEFAULT 'muscle_gain',
  experience_level experience_level DEFAULT 'beginner',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- USER SCHEDULES
-- ============================================

CREATE TABLE public.user_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wake_time TIME DEFAULT '07:00',
  sleep_time TIME DEFAULT '23:00',
  workout_time TIME DEFAULT '18:00',
  breakfast_time TIME DEFAULT '08:00',
  lunch_time TIME DEFAULT '13:00',
  dinner_time TIME DEFAULT '20:00',
  workout_days_per_week INTEGER DEFAULT 4 CHECK (workout_days_per_week >= 1 AND workout_days_per_week <= 7),
  workout_duration_minutes INTEGER DEFAULT 60,
  preferred_workout_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'thursday', 'friday'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedules" ON public.user_schedules
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- USER PREFERENCES
-- ============================================

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferred_foods TEXT[] DEFAULT ARRAY[]::TEXT[],
  avoided_foods TEXT[] DEFAULT ARRAY[]::TEXT[],
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_supplements TEXT[] DEFAULT ARRAY[]::TEXT[],
  stress_level INTEGER DEFAULT 5 CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_quality INTEGER DEFAULT 7 CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- DAILY STATE (User's daily check-in)
-- ============================================

CREATE TABLE public.daily_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_hours NUMERIC(3,1),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  soreness_level INTEGER CHECK (soreness_level >= 1 AND soreness_level <= 10),
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  notes TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily states" ON public.daily_states
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- EXERCISES DATABASE
-- ============================================

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_es TEXT,
  description TEXT,
  instructions TEXT,
  primary_muscle muscle_group NOT NULL,
  secondary_muscles muscle_group[] DEFAULT ARRAY[]::muscle_group[],
  category exercise_category DEFAULT 'compound',
  equipment TEXT,
  difficulty experience_level DEFAULT 'beginner',
  video_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises are public read, but only admins can modify
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);

-- ============================================
-- WORKOUT PLANS
-- ============================================

CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  split_type workout_split DEFAULT 'push_pull_legs',
  days_per_week INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout plans" ON public.workout_plans
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- WORKOUT PLAN DAYS (Template for each day)
-- ============================================

CREATE TABLE public.workout_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  name TEXT NOT NULL,
  focus muscle_group[],
  is_rest_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout plan days" ON public.workout_plan_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp 
      WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
    )
  );

-- ============================================
-- WORKOUT PLAN EXERCISES (Exercises in each day)
-- ============================================

CREATE TABLE public.workout_plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_day_id UUID REFERENCES public.workout_plan_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  sets INTEGER DEFAULT 3,
  reps_min INTEGER DEFAULT 8,
  reps_max INTEGER DEFAULT 12,
  rest_seconds INTEGER DEFAULT 90,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plan exercises" ON public.workout_plan_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plan_days wpd
      JOIN public.workout_plans wp ON wp.id = wpd.workout_plan_id
      WHERE wpd.id = workout_plan_day_id AND wp.user_id = auth.uid()
    )
  );

-- ============================================
-- WORKOUT SESSIONS (Actual completed workouts)
-- ============================================

CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_plan_day_id UUID REFERENCES public.workout_plan_days(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  calories_burned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout sessions" ON public.workout_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- EXERCISE LOGS (Sets performed in a session)
-- ============================================

CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg NUMERIC(6,2),
  reps_completed INTEGER,
  rpe NUMERIC(3,1) CHECK (rpe >= 1 AND rpe <= 10),
  is_warmup BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exercise logs" ON public.exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws 
      WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
  );

-- ============================================
-- NUTRITION PLANS
-- ============================================

CREATE TABLE public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Mi Plan Nutricional',
  daily_calories INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fat_grams INTEGER,
  protein_per_kg NUMERIC(3,1) DEFAULT 2.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nutrition plans" ON public.nutrition_plans
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- MEALS
-- ============================================

CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id UUID REFERENCES public.nutrition_plans(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  meal_type meal_type NOT NULL,
  scheduled_time TIME,
  calories INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fat_grams INTEGER,
  ingredients JSONB DEFAULT '[]'::JSONB,
  instructions TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meals" ON public.meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_plans np 
      WHERE np.id = nutrition_plan_id AND np.user_id = auth.uid()
    )
  );

-- ============================================
-- MEAL LOGS (Tracking completed meals)
-- ============================================

CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meal logs" ON public.meal_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SUPPLEMENTS (Product catalog - real products)
-- ============================================

CREATE TABLE public.supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  benefits TEXT[],
  dosage TEXT,
  amazon_url TEXT,
  image_url TEXT,
  price_eur NUMERIC(8,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supplements" ON public.supplements
  FOR SELECT USING (true);

-- ============================================
-- SUPPLEMENT PLANS
-- ============================================

CREATE TABLE public.supplement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplement_id UUID REFERENCES public.supplements(id) ON DELETE CASCADE NOT NULL,
  timing supplement_timing NOT NULL,
  dosage TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.supplement_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own supplement plans" ON public.supplement_plans
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SUPPLEMENT LOGS
-- ============================================

CREATE TABLE public.supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplement_plan_id UUID REFERENCES public.supplement_plans(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  timing supplement_timing NOT NULL,
  taken BOOLEAN DEFAULT false,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own supplement logs" ON public.supplement_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- HYDRATION LOGS
-- ============================================

CREATE TABLE public.hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_ml INTEGER DEFAULT 3000,
  consumed_ml INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hydration logs" ON public.hydration_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- SLEEP LOGS
-- ============================================

CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bedtime TIMESTAMP WITH TIME ZONE,
  wake_time TIMESTAMP WITH TIME ZONE,
  hours_slept NUMERIC(3,1),
  quality INTEGER CHECK (quality >= 1 AND quality <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sleep logs" ON public.sleep_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- HABITS
-- ============================================

CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✓',
  color TEXT DEFAULT 'primary',
  target_frequency TEXT DEFAULT 'daily',
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- HABIT LOGS
-- ============================================

CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habit logs" ON public.habit_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- DAILY PRIORITIES (Generated by decision engine)
-- ============================================

CREATE TABLE public.daily_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  priority_order INTEGER NOT NULL CHECK (priority_order >= 1 AND priority_order <= 5),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, priority_order)
);

ALTER TABLE public.daily_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own priorities" ON public.daily_priorities
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers for updated_at
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_user_schedules_updated
  BEFORE UPDATE ON public.user_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_daily_states_updated
  BEFORE UPDATE ON public.daily_states
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_workout_plans_updated
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_nutrition_plans_updated
  BEFORE UPDATE ON public.nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_supplement_plans_updated
  BEFORE UPDATE ON public.supplement_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_hydration_logs_updated
  BEFORE UPDATE ON public.hydration_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_habits_updated
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- FUNCTION TO CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default user schedule
  INSERT INTO public.user_schedules (user_id) VALUES (NEW.id);
  
  -- Create default user preferences
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();