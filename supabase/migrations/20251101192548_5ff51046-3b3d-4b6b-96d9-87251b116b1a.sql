-- Fix infinite recursion in schedules RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view schedules shared with their groups" ON public.schedules;

-- Create a security definer function to check if user can view schedule
CREATE OR REPLACE FUNCTION public.can_view_schedule(schedule_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- User owns the schedule
  SELECT EXISTS (
    SELECT 1 FROM public.schedules
    WHERE id = schedule_id
    AND schedules.user_id = can_view_schedule.user_id
  )
  OR
  -- Schedule is shared with user's family group
  EXISTS (
    SELECT 1
    FROM public.schedule_family_shares sfs
    JOIN public.family_members fm ON fm.family_group_id = sfs.family_group_id
    WHERE sfs.schedule_id = can_view_schedule.schedule_id
    AND fm.user_id = can_view_schedule.user_id
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view their own and shared schedules"
ON public.schedules
FOR SELECT
USING (public.can_view_schedule(id, auth.uid()));