-- Add leader_who column to family_groups table
ALTER TABLE family_groups 
ADD COLUMN leader_who uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Set initial values to the group creator
UPDATE family_groups 
SET leader_who = created_by;

-- Make leader_who NOT NULL after setting initial values
ALTER TABLE family_groups 
ALTER COLUMN leader_who SET NOT NULL;