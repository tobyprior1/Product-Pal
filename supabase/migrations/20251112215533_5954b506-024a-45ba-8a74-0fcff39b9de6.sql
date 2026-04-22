-- Drop the overly permissive SELECT policy that exposes all emails
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new SELECT policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);