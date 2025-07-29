-- Fix for infinite recursion in profiles policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new policies that don't cause recursion
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    )
);

CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    )
);

-- Alternative approach: Use a simpler policy that doesn't query the same table
-- CREATE POLICY "Admins can view all profiles" ON profiles
-- FOR SELECT USING (
--     EXISTS (
--         SELECT 1 FROM auth.users 
--         WHERE auth.users.id = auth.uid() 
--         AND auth.users.raw_user_meta_data->>'role' = 'admin'
--     )
-- );

-- CREATE POLICY "Admins can manage all profiles" ON profiles
-- FOR ALL USING (
--     EXISTS (
--         SELECT 1 FROM auth.users 
--         WHERE auth.users.id = auth.uid() 
--         AND auth.users.raw_user_meta_data->>'role' = 'admin'
--     )
-- );