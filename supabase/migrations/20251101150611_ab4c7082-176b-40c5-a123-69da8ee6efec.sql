-- Add mood columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mood text,
ADD COLUMN mood_updated_at timestamp with time zone;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to reset moods
CREATE OR REPLACE FUNCTION public.reset_daily_moods()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET mood = NULL,
      mood_updated_at = NULL
  WHERE mood IS NOT NULL;
END;
$$;

-- Schedule the mood reset to run daily at 5 AM KST (which is 8 PM UTC the previous day)
SELECT cron.schedule(
  'reset-daily-moods',
  '0 20 * * *', -- 8 PM UTC = 5 AM KST
  $$
  SELECT public.reset_daily_moods();
  $$
);