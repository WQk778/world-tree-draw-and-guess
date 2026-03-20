-- ==============================================================================
-- Add missing INSERT / UPDATE / DELETE policies for frontend operations
-- ==============================================================================

-- 1. Rooms
-- Users can create rooms
CREATE POLICY "Users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
-- Users can update their own rooms (e.g. change status)
CREATE POLICY "Users can update own rooms" ON public.rooms FOR UPDATE USING (auth.uid() = owner_id);
-- Users can delete their own rooms
CREATE POLICY "Users can delete own rooms" ON public.rooms FOR DELETE USING (auth.uid() = owner_id);

-- 2. Room Members
-- Users can join a room (insert themselves)
CREATE POLICY "Users can insert themselves into room_members" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can leave a room (delete themselves)
CREATE POLICY "Users can delete themselves from room_members" ON public.room_members FOR DELETE USING (auth.uid() = user_id);
-- Room owners can also delete members (kick players)
CREATE POLICY "Room owners can delete members" ON public.room_members FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.rooms 
        WHERE rooms.id = room_members.room_id 
        AND rooms.owner_id = auth.uid()
    )
);

-- 3. Game Rounds
-- Users in the room can create a round (if they are the drawer, or owner starts game)
CREATE POLICY "Authenticated users can create game rounds" ON public.game_rounds FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Anyone in the room can update the round (e.g. when round ends)
CREATE POLICY "Authenticated users can update game rounds" ON public.game_rounds FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Drawings
-- The designated drawer can upload their drawing (drawings has round_id, which connects to game_rounds)
-- To keep it simple, any authenticated user can insert/update a drawing for now, or check via subquery.
CREATE POLICY "Users can insert drawings" ON public.drawings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update drawings" ON public.drawings FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Guess Records
-- Users can submit their guesses
CREATE POLICY "Users can insert their own guesses" ON public.guess_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Point Records
-- System (or users if handled in frontend) inserts point records
CREATE POLICY "Users can insert their own point records" ON public.point_records FOR INSERT WITH CHECK (auth.uid() = user_id);
