-- Fix reset_daily_moods function to use empty search_path
CREATE OR REPLACE FUNCTION public.reset_daily_moods()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET mood = NULL,
      mood_updated_at = NULL
  WHERE mood IS NOT NULL;
END;
$$;