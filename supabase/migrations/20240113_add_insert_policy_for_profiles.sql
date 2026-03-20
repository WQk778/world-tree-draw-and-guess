-- Add INSERT policy for profiles table so users can create their profile upon registration
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
