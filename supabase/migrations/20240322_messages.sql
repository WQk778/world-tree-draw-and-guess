-- Create messages table for friend chat and room invitations
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'room_invite')),
    room_code VARCHAR(6),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
ON public.messages(sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_read 
ON public.messages(receiver_id, is_read);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update message read status" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Realtime Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
