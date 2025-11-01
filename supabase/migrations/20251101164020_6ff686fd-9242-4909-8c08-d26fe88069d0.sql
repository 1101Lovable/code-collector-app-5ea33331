-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  location_city TEXT,
  location_district TEXT,
  location_dong TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_groups table
CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_head BOOLEAN DEFAULT false,
  mood TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_group_id, user_id)
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  schedule_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  event_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mood_records table
CREATE TABLE IF NOT EXISTS public.mood_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  note TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Family groups policies
DROP POLICY IF EXISTS "Users can view family groups they belong to" ON public.family_groups;
DROP POLICY IF EXISTS "Family creators can update their groups" ON public.family_groups;
DROP POLICY IF EXISTS "Users can create family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Family creators can delete their groups" ON public.family_groups;

CREATE POLICY "Users can view family groups they belong to"
  ON public.family_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_group_id = family_groups.id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family creators can update their groups"
  ON public.family_groups FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can create family groups"
  ON public.family_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Family creators can delete their groups"
  ON public.family_groups FOR DELETE
  USING (created_by = auth.uid());

-- Family members policies
DROP POLICY IF EXISTS "Users can view family members of their groups" ON public.family_members;
DROP POLICY IF EXISTS "Family heads can manage members" ON public.family_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON public.family_members;

CREATE POLICY "Users can view family members of their groups"
  ON public.family_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Family heads can manage members"
  ON public.family_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.family_groups
      WHERE family_groups.id = family_members.family_group_id
      AND family_groups.created_by = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert themselves as members"
  ON public.family_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Schedules policies
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can view family schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can create their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;

CREATE POLICY "Users can view their own schedules"
  ON public.schedules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view family schedules"
  ON public.schedules FOR SELECT
  USING (
    family_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_group_id = schedules.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own schedules"
  ON public.schedules FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own schedules"
  ON public.schedules FOR DELETE
  USING (user_id = auth.uid());

-- Mood records policies
DROP POLICY IF EXISTS "Users can view their own mood records" ON public.mood_records;
DROP POLICY IF EXISTS "Users can view family members' mood records" ON public.mood_records;
DROP POLICY IF EXISTS "Users can create their own mood records" ON public.mood_records;
DROP POLICY IF EXISTS "Users can update their own mood records" ON public.mood_records;
DROP POLICY IF EXISTS "Users can delete their own mood records" ON public.mood_records;

CREATE POLICY "Users can view their own mood records"
  ON public.mood_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view family members' mood records"
  ON public.mood_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm1
      JOIN public.family_members fm2 ON fm1.family_group_id = fm2.family_group_id
      WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = mood_records.user_id
    )
  );

CREATE POLICY "Users can create their own mood records"
  ON public.mood_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own mood records"
  ON public.mood_records FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own mood records"
  ON public.mood_records FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger function for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, location_city, location_district, location_dong)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '사용자'),
    NEW.raw_user_meta_data->>'location_city',
    NEW.raw_user_meta_data->>'location_district',
    NEW.raw_user_meta_data->>'location_dong'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_groups_updated_at ON public.family_groups;
CREATE TRIGGER update_family_groups_updated_at
  BEFORE UPDATE ON public.family_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_group_id ON public.family_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_family_id ON public.schedules(family_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_mood_records_user_id ON public.mood_records(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_records_date ON public.mood_records(recorded_at);