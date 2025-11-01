-- Add invite code to family_groups table
ALTER TABLE family_groups ADD COLUMN invite_code TEXT UNIQUE;

-- Create function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM family_groups WHERE invite_code = code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Set invite codes for existing groups
UPDATE family_groups 
SET invite_code = generate_invite_code() 
WHERE invite_code IS NULL;

-- Make invite_code NOT NULL after setting values
ALTER TABLE family_groups ALTER COLUMN invite_code SET NOT NULL;

-- Add trigger to auto-generate invite code for new groups
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invite_code_trigger
BEFORE INSERT ON family_groups
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();