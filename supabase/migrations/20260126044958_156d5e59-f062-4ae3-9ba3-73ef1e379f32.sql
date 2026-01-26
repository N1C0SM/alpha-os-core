-- Create a table for user's custom saved meals
CREATE TABLE public.user_custom_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  protein_grams INTEGER NOT NULL DEFAULT 0,
  carbs_grams INTEGER NOT NULL DEFAULT 0,
  fat_grams INTEGER NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_custom_meals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own custom meals"
ON public.user_custom_meals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom meals"
ON public.user_custom_meals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom meals"
ON public.user_custom_meals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom meals"
ON public.user_custom_meals
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_custom_meals_updated_at
BEFORE UPDATE ON public.user_custom_meals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();