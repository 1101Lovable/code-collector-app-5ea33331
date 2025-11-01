-- Fix the UPDATE policy to also use security definer function

-- Create security definer function to check if user is family head
CREATE OR REPLACE FUNCTION public.is_family_head(_user_id uuid, _family_group_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members
    WHERE user_id = _user_id
      AND family_group_id = _family_group_id
      AND is_head = true
  )
$$;

-- Drop and recreate the UPDATE policy
DROP POLICY IF EXISTS "Family heads can update member roles" ON family_members;

CREATE POLICY "Family heads can update member roles" 
ON family_members 
FOR UPDATE 
USING (
  is_family_head(auth.uid(), family_group_id)
);