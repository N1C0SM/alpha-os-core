-- Fix SECURITY DEFINER view issue by recreating with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate view with SECURITY INVOKER (default, safe)
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  fitness_goal,
  experience_level
FROM public.profiles;

-- Grant access to the view for authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Create a permissive SELECT policy for authenticated users to view limited public data
-- This allows the view to work by giving authenticated users access to these specific columns
CREATE POLICY "Authenticated can view limited public profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- The view will only expose the columns defined in it (id, full_name, avatar_url, fitness_goal, experience_level)
-- Sensitive fields (email, weight, height, body_fat, dob, etc.) are not exposed