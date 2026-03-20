-- ==============================================================================
-- 1. Create Functions for Triggers
-- ==============================================================================

-- Function to automatically update 'updated_at' column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically calculate and update total_points in profiles
-- whenever a new point_record is inserted
CREATE OR REPLACE FUNCTION update_profile_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET total_points = total_points + NEW.points_change,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- 2. Create Triggers
-- ==============================================================================

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_point_rules_updated_at BEFORE UPDATE ON public.point_rules FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ai_configs_updated_at BEFORE UPDATE ON public.ai_configs FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Trigger for total_points
CREATE TRIGGER trigger_update_total_points
AFTER INSERT ON public.point_records
FOR EACH ROW
EXECUTE FUNCTION update_profile_total_points();


-- ==============================================================================
-- 3. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guess_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_records ENABLE ROW LEVEL SECURITY;

-- Note: In this architecture, most complex write operations will go through 
-- the Express backend (using service_role key which bypasses RLS). 
-- Therefore, these RLS policies are primarily designed to allow the Vue frontend 
-- to safely READ data directly via the Supabase client (anon key) for realtime subscriptions.

-- 1. Profiles
-- Anyone can read profiles (needed to show names/avatars in rooms and rankings)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Rooms
-- Anyone can view rooms (to join them or list them)
CREATE POLICY "Rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);

-- 3. Room Members
-- Anyone can view room members (needed to show who is in the room)
CREATE POLICY "Room members are viewable by everyone" ON public.room_members FOR SELECT USING (true);

-- 4. Game Rounds
-- Anyone can view rounds
CREATE POLICY "Game rounds are viewable by everyone" ON public.game_rounds FOR SELECT USING (true);

-- 5. Drawings
-- Anyone can view drawings (needed for guessing)
CREATE POLICY "Drawings are viewable by everyone" ON public.drawings FOR SELECT USING (true);

-- 6. Guess Records
-- Anyone can view guess records (to show who guessed what)
CREATE POLICY "Guess records are viewable by everyone" ON public.guess_records FOR SELECT USING (true);

-- 7. Point Rules (Read-only for public)
CREATE POLICY "Point rules are viewable by everyone" ON public.point_rules FOR SELECT USING (true);

-- 8. Point Records (Users can view their own, or maybe everyone can view for transparency)
CREATE POLICY "Point records are viewable by everyone" ON public.point_records FOR SELECT USING (true);

-- 9. AI Configs (Only viewable by backend service_role, no public read needed)
-- We don't create a SELECT policy for anon users here.

-- 10. Rankings
-- Anyone can view rankings
CREATE POLICY "Rankings are viewable by everyone" ON public.rankings FOR SELECT USING (true);

-- 11. Login Records (Private, only for backend/admin)
-- We don't create a SELECT policy for anon users here.
