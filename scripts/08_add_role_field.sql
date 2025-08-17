-- Add role field to profiles table for admin management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'admin-demo', 'collaborator', 'admin'));

-- Create index for better performance on role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have proper roles
-- Set admin role for known admin emails
UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN ('admin@demo.com', 'admin@example.com') 
   OR full_name IS NOT NULL;

-- Set viewer role for all other existing profiles
UPDATE public.profiles 
SET role = 'viewer' 
WHERE role IS NULL;

-- Update the handle_new_user function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    CASE 
      WHEN new.email IN ('admin@demo.com', 'admin@example.com') THEN 'admin'
      ELSE 'viewer'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to include role-based access
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
