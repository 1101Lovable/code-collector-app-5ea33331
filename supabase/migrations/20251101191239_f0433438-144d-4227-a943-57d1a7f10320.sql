-- Create a junction table for schedule-family group relationships
CREATE TABLE public.schedule_family_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(schedule_id, family_group_id)
);

-- Enable RLS
ALTER TABLE public.schedule_family_shares ENABLE ROW LEVEL SECURITY;

-- Users can view shares for schedules they created
CREATE POLICY "Users can view their schedule shares"
ON public.schedule_family_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.schedules
    WHERE schedules.id = schedule_family_shares.schedule_id
    AND schedules.user_id = auth.uid()
  )
);

-- Users can insert shares for their own schedules
CREATE POLICY "Users can create shares for their schedules"
ON public.schedule_family_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.schedules
    WHERE schedules.id = schedule_family_shares.schedule_id
    AND schedules.user_id = auth.uid()
  )
);

-- Users can delete shares for their own schedules
CREATE POLICY "Users can delete their schedule shares"
ON public.schedule_family_shares
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.schedules
    WHERE schedules.id = schedule_family_shares.schedule_id
    AND schedules.user_id = auth.uid()
  )
);

-- Family members can view shared schedules
CREATE POLICY "Family members can view shared schedules"
ON public.schedule_family_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_group_id = schedule_family_shares.family_group_id
    AND family_members.user_id = auth.uid()
  )
);