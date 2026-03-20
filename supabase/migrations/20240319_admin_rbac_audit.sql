-- Create admin_users table for RBAC
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users
-- Only super admins or service role can manage admin users.
CREATE POLICY "Admins can view admin_users"
    ON public.admin_users FOR SELECT
    USING ( auth.uid() IN (SELECT id FROM public.admin_users) );

-- Policies for audit_logs
CREATE POLICY "Admins can view audit_logs"
    ON public.audit_logs FOR SELECT
    USING ( auth.uid() IN (SELECT id FROM public.admin_users) );

-- Insert a default admin (you should replace this UUID with your actual user UUID, or insert via backend script)
-- INSERT INTO public.admin_users (id, role) VALUES ('your-uuid', 'SUPER_ADMIN');
