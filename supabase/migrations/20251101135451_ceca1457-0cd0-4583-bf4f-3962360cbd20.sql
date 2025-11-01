-- Simplify RLS policies to prevent infinite recursion

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view members of their family groups" ON family_members;
DROP POLICY IF EXISTS "Users can view their own and shared family schedules" ON schedules;

-- Simple policy for family_members: only view your own membership
CREATE POLICY "Users can view their own family membership" 
ON family_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Simple policy for schedules: only view your own schedules
CREATE POLICY "Users can view their own schedules" 
ON schedules 
FOR SELECT 
USING (user_id = auth.uid());