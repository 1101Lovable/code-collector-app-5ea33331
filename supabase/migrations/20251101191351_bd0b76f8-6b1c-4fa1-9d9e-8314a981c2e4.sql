-- Drop the old family schedule viewing policy
DROP POLICY IF EXISTS "Users can view family schedules" ON public.schedules;

-- Create new policy for viewing shared schedules via junction table
CREATE POLICY "Users can view schedules shared with their groups"
ON public.schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.schedule_family_shares sfs
    JOIN public.family_members fm ON fm.family_group_id = sfs.family_group_id
    WHERE sfs.schedule_id = schedules.id
    AND fm.user_id = auth.uid()
  )
);