DO $$
BEGIN
  -- Create a SELECT policy allowing creators to view their own groups
  CREATE POLICY "Family creators can view their groups"
  ON public.family_groups
  FOR SELECT
  USING (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists, do nothing
  NULL;
END $$;