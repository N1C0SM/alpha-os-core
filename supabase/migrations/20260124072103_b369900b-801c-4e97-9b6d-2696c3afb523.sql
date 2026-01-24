-- Fix: Restrict public profile access to non-sensitive fields only
-- This addresses PUBLIC_DATA_EXPOSURE findings for email and health data

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy: Users can view their OWN full profile (all columns)
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a secure view for public profile data (non-sensitive fields only)
-- This is what other users can see about someone else (for social/community features)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  fitness_goal,
  experience_level
FROM public.profiles;

-- Grant access to the view for authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO authenticated, anon;