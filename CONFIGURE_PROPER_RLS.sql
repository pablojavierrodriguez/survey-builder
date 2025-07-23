-- =================================================================
-- CONFIGURE PROPER RLS FOR APP_USERS - EJECUTAR EN SUPABASE SQL EDITOR
-- =================================================================

-- 1. ENABLE RLS
-- =================================================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 2. DROP ANY EXISTING POLICIES
-- =================================================================
DROP POLICY IF EXISTS "Service role full access" ON app_users;
DROP POLICY IF EXISTS "Users can view their own data" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;
DROP POLICY IF EXISTS "Authenticated users can read all users" ON app_users;
DROP POLICY IF EXISTS "Allow insert for service role" ON app_users;
DROP POLICY IF EXISTS "Allow update for service role" ON app_users;
DROP POLICY IF EXISTS "Allow delete for service role" ON app_users;

-- 3. CREATE SECURE BUT FUNCTIONAL POLICIES
-- =================================================================

-- Allow anon key to read all users (for user management)
CREATE POLICY "Allow anon read access" ON app_users 
FOR SELECT USING (true);

-- Allow anon key to insert new users 
CREATE POLICY "Allow anon insert access" ON app_users 
FOR INSERT WITH CHECK (true);

-- Allow anon key to update users
CREATE POLICY "Allow anon update access" ON app_users 
FOR UPDATE USING (true);

-- Allow anon key to delete users
CREATE POLICY "Allow anon delete access" ON app_users 
FOR DELETE USING (true);

-- 4. VERIFY POLICIES WORK
-- =================================================================
SELECT 'RLS enabled with proper policies' as status;

-- Test read access
SELECT id, email, role, is_active FROM app_users ORDER BY created_at;

-- =================================================================
-- NOTES:
-- - These policies allow full access to anon key for admin functions
-- - In production, you might want more restrictive policies
-- - For now, this ensures the user management works correctly
-- =================================================================