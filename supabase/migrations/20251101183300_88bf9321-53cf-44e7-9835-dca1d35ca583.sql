-- Create a secure function to join a family by invite code without exposing groups via RLS
CREATE OR REPLACE FUNCTION public.join_family_by_invite(p_invite_code text)
RETURNS TABLE(group_id uuid, group_name text) AS $$
DECLARE
  v_group_id uuid;
  v_group_name text;
  v_already boolean;
BEGIN
  -- Find group by invite code (case-insensitive safety)
  SELECT id, name
    INTO v_group_id, v_group_name
  FROM public.family_groups
  WHERE invite_code = UPPER(p_invite_code)
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INVITE_CODE';
  END IF;

  -- Check if the user is already a member
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_group_id = v_group_id AND user_id = auth.uid()
  ) INTO v_already;

  IF NOT v_already THEN
    INSERT INTO public.family_members (family_group_id, user_id)
    VALUES (v_group_id, auth.uid());
  END IF;

  group_id := v_group_id;
  group_name := v_group_name;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;