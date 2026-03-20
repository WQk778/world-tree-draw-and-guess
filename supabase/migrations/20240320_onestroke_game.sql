-- Create bucket for one stroke game images
insert into storage.buckets (id, name, public)
values ('onestroke', 'onestroke', true)
on conflict (id) do nothing;

create policy "Public Access OneStroke"
  on storage.objects for select
  using ( bucket_id = 'onestroke' );

create policy "Auth Insert OneStroke"
  on storage.objects for insert
  with check ( bucket_id = 'onestroke' and auth.role() = 'authenticated' );

-- Create tables
CREATE TABLE IF NOT EXISTS public.onestroke_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    answer_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.onestroke_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.onestroke_questions(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.onestroke_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.onestroke_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onestroke_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onestroke_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view questions" ON public.onestroke_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.onestroke_questions FOR ALL USING ( auth.uid() IN (SELECT id FROM public.admin_users) );

CREATE POLICY "Users can view own records" ON public.onestroke_records FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Service can insert records" ON public.onestroke_records FOR INSERT WITH CHECK ( true );

CREATE POLICY "Anyone can view profiles" ON public.onestroke_profiles FOR SELECT USING (true);

-- Triggers for profile update
CREATE OR REPLACE FUNCTION update_onestroke_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_correct THEN
        INSERT INTO public.onestroke_profiles (user_id, total_score, correct_count)
        VALUES (NEW.user_id, NEW.points_earned, 1)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            total_score = public.onestroke_profiles.total_score + EXCLUDED.total_score,
            correct_count = public.onestroke_profiles.correct_count + 1,
            updated_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_onestroke_record_inserted
    AFTER INSERT ON public.onestroke_records
    FOR EACH ROW
    EXECUTE FUNCTION update_onestroke_profile();
