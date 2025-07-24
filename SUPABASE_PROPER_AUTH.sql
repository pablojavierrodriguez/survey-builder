-- =====================================================================================
-- SUPABASE NATIVE AUTH SETUP - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================================================
-- This uses Supabase's built-in auth.users table and creates a profiles table
-- that syncs automatically with user signups

-- Step 1: Create a public profiles table that extends auth.users
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'collaborator', 'viewer')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security (RLS) on profiles table
-- =====================================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for profiles
-- =====================================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile (for user management)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 4: Create function to automatically create profile on signup
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to run function on user signup
-- =====================================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Insert some demo profiles (manually for testing)
-- =====================================================================================
-- Note: In real usage, these would be created via Supabase Auth signup
-- This is just for testing if you want some sample data

-- First, let's create some auth users (this would normally be done via signup)
-- You'll need to do this through the Supabase Auth UI or API

-- Step 7: Grant permissions for authenticated users
-- =====================================================================================
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 8: Create helpful views for user management
-- =====================================================================================
CREATE OR REPLACE VIEW public.user_management AS
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  p.created_at,
  au.last_sign_in_at,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.user_management TO authenticated;

-- Step 9: Create function for admins to update user roles
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('admin', 'collaborator', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin, collaborator, or viewer';
  END IF;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Verify setup
-- =====================================================================================
SELECT 'SUCCESS: Supabase native auth setup complete' as status;

-- Show current profiles (will be empty until users sign up)
SELECT * FROM public.profiles;

-- =====================================================================================
-- NEXT STEPS:
-- =====================================================================================
-- 1. Update your Next.js app to use @supabase/supabase-js for auth
-- 2. Use Supabase Auth UI components for login/signup
-- 3. Access user data through the profiles table
-- 4. Use auth.uid() in RLS policies and functions
-- 5. For user management, query the user_management view
-- 6. Use the update_user_role() function for role changes
-- =====================================================================================