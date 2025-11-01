-- Drop trigger first, then recreate function with proper search_path
DROP TRIGGER IF EXISTS trigger_set_invite_code ON public.family_groups;

DROP FUNCTION IF EXISTS set_invite_code() CASCADE;
DROP FUNCTION IF EXISTS generate_invite_code() CASCADE;

CREATE OR REPLACE FUNCTION generate_invite_code() 
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate trigger
CREATE TRIGGER trigger_set_invite_code
  BEFORE INSERT ON public.family_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();