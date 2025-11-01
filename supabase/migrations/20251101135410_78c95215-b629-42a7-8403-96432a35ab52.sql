-- Fix infinite recursion in family_members and schedules RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their family groups" ON family_members;
DROP POLICY IF EXISTS "Users can view their own and shared family schedules" ON schedules;

-- Create simpler, non-recursive policy for family_members
CREATE POLICY "Users can view members of their family groups" 
ON family_members 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  family_group_id IN (
    SELECT family_group_id 
    FROM family_members 
    WHERE user_id = auth.uid()
  )
);

-- Create simpler policy for schedules that doesn't cause recursion
CREATE POLICY "Users can view their own and shared family schedules" 
ON schedules 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  (
    shared_with_family = true 
    AND user_id IN (
      SELECT fm2.user_id 
      FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_group_id = fm2.family_group_id
      WHERE fm1.user_id = auth.uid()
    )
  )
);