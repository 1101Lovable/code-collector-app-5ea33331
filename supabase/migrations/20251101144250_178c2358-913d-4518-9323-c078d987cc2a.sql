-- Step 1: Update schedules RLS policy to use family_members table
DROP POLICY IF EXISTS "Users can view own and family schedules" ON schedules;

CREATE POLICY "Users can view own and family schedules" 
ON schedules 
FOR SELECT 
USING (
  -- Users can view their own schedules
  user_id = auth.uid() 
  OR 
  -- Users can view family members' schedules ONLY if shared_with_family is true
  (
    shared_with_family = true
    AND EXISTS (
      SELECT 1 
      FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_group_id = fm2.family_group_id
      WHERE fm1.user_id = auth.uid() 
      AND fm2.user_id = schedules.user_id
    )
  )
);

-- Step 2: Fix duplicate heads - keep only the first head for each family
WITH duplicate_heads AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY family_group_id ORDER BY joined_at) as rn
  FROM family_members
  WHERE is_head = true
)
UPDATE family_members
SET is_head = false
WHERE id IN (
  SELECT id FROM duplicate_heads WHERE rn > 1
);

-- Step 3: Migrate existing family_group_code data to family_members table
INSERT INTO family_members (user_id, family_group_id, is_head)
SELECT 
  p.user_id,
  fg.id,
  false  -- Set as false initially to avoid conflicts
FROM profiles p
JOIN family_groups fg ON fg.invite_code = p.family_group_code
WHERE p.family_group_code IS NOT NULL
ON CONFLICT (user_id, family_group_id) DO NOTHING;

-- Step 4: Remove family_group_code and is_family_head from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS family_group_code;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_family_head;

-- Step 5: Add constraint to limit max 10 families per user
CREATE OR REPLACE FUNCTION check_max_families()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM family_members WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'Cannot join more than 10 families';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_max_families_trigger ON family_members;
CREATE TRIGGER check_max_families_trigger
BEFORE INSERT ON family_members
FOR EACH ROW
EXECUTE FUNCTION check_max_families();

-- Step 6: Add unique constraint to ensure only one head per family
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_head_per_family 
ON family_members (family_group_id) 
WHERE is_head = true;