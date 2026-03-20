-- Add email and status columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive'));

-- Update the handle_new_user function to include email and status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'User_' || SUBSTRING(NEW.id::text FROM 1 FOR 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id),
    NEW.email,
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
