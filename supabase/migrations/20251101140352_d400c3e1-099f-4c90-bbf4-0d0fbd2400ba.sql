-- Add family head indicator to family_members
ALTER TABLE family_members ADD COLUMN is_head BOOLEAN DEFAULT false;

-- Update existing creator memberships to be family heads
UPDATE family_members fm
SET is_head = true
FROM family_groups fg
WHERE fm.family_group_id = fg.id 
  AND fm.user_id = fg.created_by;

-- Modify the invite code trigger to handle empty strings
DROP TRIGGER IF EXISTS set_invite_code_trigger ON family_groups;
DROP FUNCTION IF EXISTS set_invite_code();

CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invite_code_trigger
BEFORE INSERT ON family_groups
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();

-- Add RLS policy for family_members to allow users to view head status
DROP POLICY IF EXISTS "Users can view their own family membership" ON family_members;

CREATE POLICY "Users can view their family group members" 
ON family_members 
FOR SELECT 
USING (
  family_group_id IN (
    SELECT family_group_id 
    FROM family_members 
    WHERE user_id = auth.uid()
  )
);

-- Add policy to allow family heads to update head status
CREATE POLICY "Family heads can update member roles" 
ON family_members 
FOR UPDATE 
USING (
  family_group_id IN (
    SELECT family_group_id 
    FROM family_members 
    WHERE user_id = auth.uid() AND is_head = true
  )
);