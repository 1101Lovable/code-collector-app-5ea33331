-- Remove foreign key constraint on leader_who temporarily
ALTER TABLE public.family_groups 
DROP CONSTRAINT IF EXISTS family_groups_leader_who_fkey;

-- Make leader_who nullable
ALTER TABLE public.family_groups 
ALTER COLUMN leader_who DROP NOT NULL;