-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Meetings policies
CREATE POLICY "Anyone can view meetings" 
  ON public.meetings FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create meetings" 
  ON public.meetings FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update their meetings" 
  ON public.meetings FOR UPDATE 
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their meetings" 
  ON public.meetings FOR DELETE 
  USING (auth.uid() = organizer_id);

-- Create meeting_participants table
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- Meeting participants policies
CREATE POLICY "Anyone can view participants" 
  ON public.meeting_participants FOR SELECT 
  USING (true);

CREATE POLICY "Meeting organizers can manage participants" 
  ON public.meeting_participants FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_participants.meeting_id 
      AND meetings.organizer_id = auth.uid()
    )
  );

-- Create agenda_items table
CREATE TABLE public.agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  context TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;

-- Agenda items policies
CREATE POLICY "Anyone can view agenda items" 
  ON public.agenda_items FOR SELECT 
  USING (true);

CREATE POLICY "Meeting organizers can manage agenda items" 
  ON public.agenda_items FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = agenda_items.meeting_id 
      AND meetings.organizer_id = auth.uid()
    )
  );

-- Create meeting_transcripts table
CREATE TABLE public.meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Transcripts policies
CREATE POLICY "Anyone can view transcripts" 
  ON public.meeting_transcripts FOR SELECT 
  USING (true);

CREATE POLICY "Meeting organizers can upload transcripts" 
  ON public.meeting_transcripts FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_transcripts.meeting_id 
      AND meetings.organizer_id = auth.uid()
    )
  );

-- Create meeting_analysis table
CREATE TABLE public.meeting_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE UNIQUE,
  productivity_score INTEGER NOT NULL CHECK (productivity_score >= 0 AND productivity_score <= 10),
  summary TEXT NOT NULL,
  decisions JSONB NOT NULL DEFAULT '[]',
  action_items JSONB NOT NULL DEFAULT '[]',
  agenda_adherence TEXT,
  recommendations TEXT,
  participant_analysis JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.meeting_analysis ENABLE ROW LEVEL SECURITY;

-- Analysis policies
CREATE POLICY "Anyone can view analysis" 
  ON public.meeting_analysis FOR SELECT 
  USING (true);

CREATE POLICY "System can create analysis" 
  ON public.meeting_analysis FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agenda_items_updated_at
  BEFORE UPDATE ON public.agenda_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();