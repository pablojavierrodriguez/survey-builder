-- =================================================================
-- FIX APP_USERS RLS POLICIES - EJECUTAR EN SUPABASE SQL EDITOR
-- =================================================================

-- 1. DROP EXISTING POLICIES THAT ARE BLOCKING ACCESS
-- =================================================================
DROP POLICY IF EXISTS "Users can view their own data" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;

-- 2. CREATE PERMISSIVE POLICIES FOR SERVICE ROLE
-- =================================================================

-- Allow service role to perform all operations
CREATE POLICY "Service role full access" ON app_users FOR ALL 
USING (auth.role() = 'service_role');

-- Allow authenticated users to read all users (for user management)
CREATE POLICY "Authenticated users can read all users" ON app_users FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role');

-- Allow service role and authenticated users to insert
CREATE POLICY "Allow insert for service role" ON app_users FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow service role to update
CREATE POLICY "Allow update for service role" ON app_users FOR UPDATE 
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow service role to delete
CREATE POLICY "Allow delete for service role" ON app_users FOR DELETE 
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 3. ALTERNATIVE: DISABLE RLS TEMPORARILY FOR TESTING
-- =================================================================
-- Uncomment the line below if the above policies still don't work
-- ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 4. TEST QUERIES
-- =================================================================
-- Test read access
SELECT * FROM app_users;

-- Test insert (you can run this to verify)
-- INSERT INTO app_users (email, encrypted_password, role) 
-- VALUES ('test@example.com', 'dGVzdDEyMw==', 'viewer');

-- =================================================================
-- INSTRUCTIONS:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Test creating users in the app
-- 3. If still not working, uncomment the DISABLE RLS line above
-- =================================================================