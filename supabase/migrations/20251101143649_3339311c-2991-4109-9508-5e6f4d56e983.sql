-- Fix schedules RLS policy to respect shared_with_family flag
DROP POLICY IF EXISTS "Users can view own and family schedules" ON schedules;

CREATE POLICY "Users can view own and family schedules" 
ON schedules 
FOR SELECT 
USING (
  -- Users can view their own schedules (regardless of sharing setting)
  user_id = auth.uid() 
  OR 
  -- Users can view family members' schedules ONLY if shared_with_family is true
  (
    shared_with_family = true
    AND EXISTS (
      SELECT 1 
      FROM profiles p1, profiles p2
      WHERE p1.user_id = auth.uid() 
      AND p2.user_id = schedules.user_id
      AND p1.family_group_code = p2.family_group_code
      AND p1.family_group_code IS NOT NULL
    )
  )
);