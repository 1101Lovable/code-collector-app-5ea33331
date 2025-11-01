-- Add location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN location_city TEXT,
ADD COLUMN location_district TEXT,
ADD COLUMN location_dong TEXT;