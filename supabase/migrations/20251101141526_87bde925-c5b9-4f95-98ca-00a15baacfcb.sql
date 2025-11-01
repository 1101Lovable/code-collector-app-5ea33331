-- Add is_family_head to profiles for role management
ALTER TABLE profiles 
ADD COLUMN is_family_head boolean DEFAULT false;