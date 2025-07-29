-- Fix for infinite recursion in profiles policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new policies that don't cause recursion
-- Use auth.users table instead of profiles table to check admin role
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Alternative: Disable RLS temporarily for testing
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Alternative: Use a simpler policy that doesn't query any table
-- CREATE POLICY "Admins can view all profiles" ON profiles
-- FOR SELECT USING (auth.uid() IN (
--     SELECT id FROM profiles WHERE role = 'admin'
-- ));