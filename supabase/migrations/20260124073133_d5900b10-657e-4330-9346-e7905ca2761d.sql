-- Fix 1: Add missing UPDATE policy for post_comments table
CREATE POLICY "Users can update their own comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Align storage bucket configuration with RLS policies
UPDATE storage.buckets 
SET public = false 
WHERE id = 'progress-photos';