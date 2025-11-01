-- Add gender column to profiles table
ALTER TABLE public.profiles
ADD COLUMN gender text CHECK (gender IN ('남', '여'));

-- Update handle_new_user function to include gender
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, location_city, location_district, location_dong, phone_number, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '사용자'),
    NEW.raw_user_meta_data->>'location_city',
    NEW.raw_user_meta_data->>'location_district',
    NEW.raw_user_meta_data->>'location_dong',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'gender'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    location_city = COALESCE(EXCLUDED.location_city, profiles.location_city),
    location_district = COALESCE(EXCLUDED.location_district, profiles.location_district),
    location_dong = COALESCE(EXCLUDED.location_dong, profiles.location_dong),
    gender = COALESCE(EXCLUDED.gender, profiles.gender);
  RETURN NEW;
END;
$function$;