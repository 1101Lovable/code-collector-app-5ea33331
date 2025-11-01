-- Fix family_groups SELECT policy to use security definer function

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view their family groups" ON family_groups;

-- Create new policy using the security definer function
CREATE POLICY "Users can view their family groups" 
ON family_groups 
FOR SELECT 
USING (
  id IN (
    SELECT user_family_groups(auth.uid())
  )
  OR created_by = auth.uid()  -- Allow creator to see immediately after creation
);