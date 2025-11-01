-- Add family_group_code to profiles table
ALTER TABLE profiles 
ADD COLUMN family_group_code text REFERENCES family_groups(invite_code);

-- Create index for faster lookups
CREATE INDEX idx_profiles_family_group_code ON profiles(family_group_code);

-- Update RLS policies for profiles to allow viewing family members
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view all profiles and family members" 
ON profiles 
FOR SELECT 
USING (true);

-- Update schedules RLS to allow family members to view each other's schedules
DROP POLICY IF EXISTS "Users can view their own schedules" ON schedules;

CREATE POLICY "Users can view own and family schedules" 
ON schedules 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 
    FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = schedules.user_id
    AND p1.family_group_code = p2.family_group_code
    AND p1.family_group_code IS NOT NULL
  )
);