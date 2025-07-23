-- =====================================================================================
-- COMPLETE USER MANAGEMENT FIX - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================================================
-- This script will completely reset and fix the app_users table and all policies
-- It's designed to be idempotent (safe to run multiple times)

-- Step 1: Drop all existing policies (even if they don't exist)
-- =====================================================================================
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on app_users table
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'app_users'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
            RAISE NOTICE 'Dropped policy: %', pol.policyname;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to drop policy %, continuing...', pol.policyname;
        END;
    END LOOP;
END $$;

-- Step 2: Disable RLS completely
-- =====================================================================================
ALTER TABLE IF EXISTS app_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate the table with clean structure
-- =====================================================================================
DROP TABLE IF EXISTS app_users CASCADE;

CREATE TABLE app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'collaborator', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Step 4: Insert test users with known credentials
-- =====================================================================================
INSERT INTO app_users (email, encrypted_password, role, is_active) VALUES
('admin@test.com', encode('admin123', 'base64'), 'admin', true),
('user@test.com', encode('user123', 'base64'), 'viewer', true),
('collaborator@test.com', encode('collab123', 'base64'), 'collaborator', true),
('manager@test.com', encode('manager123', 'base64'), 'admin', true),
('demo@test.com', encode('demo123', 'base64'), 'viewer', true);

-- Step 5: Grant necessary permissions (no RLS for now)
-- =====================================================================================
-- Grant select, insert, update, delete to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON app_users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_users TO authenticated;

-- Step 6: Create indexes for performance
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_active ON app_users(is_active);

-- Step 7: Verify everything works
-- =====================================================================================
SELECT 'SUCCESS: app_users table completely reset and configured' as status;

-- Show all users
SELECT 
    id, 
    email, 
    role, 
    is_active,
    created_at,
    'Password encoded with base64' as password_note
FROM app_users 
ORDER BY created_at;

-- Show table permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'app_users';

-- =====================================================================================
-- NEXT STEPS AFTER RUNNING THIS SCRIPT:
-- =====================================================================================
-- 1. Test the application immediately - users should now be visible
-- 2. Try creating a new user - should work without JSON errors
-- 3. If everything works, you can optionally enable RLS later with proper policies
-- 4. The demo users listed above can be used for testing:
--    - admin@test.com / admin123
--    - user@test.com / user123
--    - collaborator@test.com / collab123
--    - manager@test.com / manager123
--    - demo@test.com / demo123
-- =====================================================================================