-- =================================================================
-- SIMPLE FIX FOR APP_USERS RLS - EJECUTAR EN SUPABASE SQL EDITOR
-- =================================================================

-- 1. TEMPORARILY DISABLE RLS FOR TESTING
-- =================================================================
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 2. VERIFY TABLE EXISTS AND HAS DATA
-- =================================================================
SELECT 'Table app_users exists and accessible' as status, count(*) as user_count FROM app_users;

-- 3. INSERT A TEST USER IF NONE EXIST
-- =================================================================
INSERT INTO app_users (email, encrypted_password, role, is_active) 
VALUES ('test@example.com', encode('test123', 'base64'), 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 4. SHOW ALL USERS
-- =================================================================
SELECT id, email, role, created_at, is_active FROM app_users ORDER BY created_at DESC;

-- =================================================================
-- INSTRUCTIONS:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. This will disable RLS temporarily so the app can work
-- 3. Test user creation in the app
-- 4. Once working, you can re-enable RLS later with proper policies
-- =================================================================

-- 5. TO RE-ENABLE RLS LATER (OPTIONAL):
-- =================================================================
-- ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Service role full access" ON app_users FOR ALL 
-- USING (true);
-- =================================================================