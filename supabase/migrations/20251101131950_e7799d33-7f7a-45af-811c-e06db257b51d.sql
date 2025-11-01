-- Create cultural_spaces table for 문화공간 정보
CREATE TABLE IF NOT EXISTS public.cultural_spaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  district text,
  address text,
  phone text,
  homepage text,
  description text,
  open_hours text,
  closed_days text,
  is_free boolean DEFAULT false,
  entrance_fee text,
  category text,
  latitude numeric,
  longitude numeric,
  main_image text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create cultural_events table for 문화행사 정보
CREATE TABLE IF NOT EXISTS public.cultural_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  organization text,
  district text,
  place text,
  event_type text,
  theme text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  event_time text,
  is_free boolean DEFAULT false,
  fee text,
  target_audience text,
  performers text,
  program_description text,
  latitude numeric,
  longitude numeric,
  main_image text,
  detail_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cultural_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view cultural spaces"
  ON public.cultural_spaces
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view cultural events"
  ON public.cultural_events
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_cultural_spaces_district ON public.cultural_spaces(district);
CREATE INDEX idx_cultural_events_district ON public.cultural_events(district);
CREATE INDEX idx_cultural_events_dates ON public.cultural_events(start_date, end_date);