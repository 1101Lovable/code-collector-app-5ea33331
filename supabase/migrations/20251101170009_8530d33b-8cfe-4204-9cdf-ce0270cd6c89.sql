-- Drop the problematic RLS policies
DROP POLICY IF EXISTS "Users can view family members of their groups" ON public.family_members;
DROP POLICY IF EXISTS "Family heads can manage members" ON public.family_members;

-- Create security definer function to check if user is in same family group
CREATE OR REPLACE FUNCTION public.is_in_same_family(family_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_members.family_group_id = is_in_same_family.family_group_id
      AND family_members.user_id = auth.uid()
  )
$$;

-- Create security definer function to check if user is family head
CREATE OR REPLACE FUNCTION public.is_family_head(family_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_groups
    WHERE family_groups.id = is_family_head.family_group_id
      AND family_groups.created_by = auth.uid()
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view family members of their groups"
ON public.family_members
FOR SELECT
USING (public.is_in_same_family(family_group_id));

CREATE POLICY "Family heads can manage members"
ON public.family_members
FOR ALL
USING (public.is_family_head(family_group_id) OR user_id = auth.uid());