-- Update handle_new_user function to include location data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, location_city, location_district, location_dong)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'location_city',
    NEW.raw_user_meta_data->>'location_district',
    NEW.raw_user_meta_data->>'location_dong'
  );
  RETURN NEW;
END;
$function$;