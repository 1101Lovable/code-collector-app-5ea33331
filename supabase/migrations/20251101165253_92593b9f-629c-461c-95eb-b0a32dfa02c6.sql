-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS mood_updated_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to family_groups table
ALTER TABLE public.family_groups 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS leader_who UUID REFERENCES public.profiles(id);

-- Create index on invite_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON public.family_groups(invite_code);

-- Add missing columns to schedules table
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS schedule_time TIME,
ADD COLUMN IF NOT EXISTS shared_with_family BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES public.family_groups(id);

-- Create index on family_group_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_schedules_family_group_id ON public.schedules(family_group_id);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code() 
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite code for new family groups
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.family_groups WHERE invite_code = NEW.invite_code) LOOP
      NEW.invite_code := generate_invite_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invite_code ON public.family_groups;
CREATE TRIGGER trigger_set_invite_code
  BEFORE INSERT ON public.family_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();