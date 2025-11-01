-- Fix infinite recursion in family_members policies using security definer function

-- Create security definer function to check family membership
CREATE OR REPLACE FUNCTION public.user_family_groups(_user_id uuid)
RETURNS TABLE(family_group_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_group_id
  FROM family_members
  WHERE user_id = _user_id
$$;

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view their family group members" ON family_members;

-- Create new policy using the security definer function
CREATE POLICY "Users can view their family group members" 
ON family_members 
FOR SELECT 
USING (
  family_group_id IN (
    SELECT user_family_groups(auth.uid())
  )
);

-- Also fix the family heads update policy
DROP POLICY IF EXISTS "Family heads can update member roles" ON family_members;

CREATE POLICY "Family heads can update member roles" 
ON family_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM family_members fm
    WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
      AND fm.is_head = true
  )
);