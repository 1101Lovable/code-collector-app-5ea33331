-- Remove family head transfer system
-- Drop the leader_who column from family_groups
ALTER TABLE public.family_groups DROP COLUMN IF EXISTS leader_who;

-- Drop the is_head column from family_members
ALTER TABLE public.family_members DROP COLUMN IF EXISTS is_head;