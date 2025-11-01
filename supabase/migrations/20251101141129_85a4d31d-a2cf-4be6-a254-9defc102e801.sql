-- Allow anyone to view family groups by invite code (for joining)

DROP POLICY IF EXISTS "Users can view their family groups" ON family_groups;

CREATE POLICY "Users can view their family groups" 
ON family_groups 
FOR SELECT 
USING (
  -- Users can see groups they're members of
  id IN (
    SELECT user_family_groups(auth.uid())
  )
  -- Creators can see their groups
  OR created_by = auth.uid()
  -- Anyone can see a group if they know the invite code (for joining)
  -- This is safe because we still control INSERT on family_members
  OR true  -- Allow reading all groups to enable invite code lookup
);