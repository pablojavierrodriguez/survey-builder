-- =================================================================
-- COMPLETE RESET OF APP_USERS TABLE - EJECUTAR EN SUPABASE SQL EDITOR
-- =================================================================

-- 1. DROP TABLE COMPLETELY AND RECREATE
-- =================================================================
DROP TABLE IF EXISTS app_users CASCADE;

-- 2. RECREATE TABLE WITH SIMPLE STRUCTURE
-- =================================================================
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

-- 3. NO RLS FOR NOW (KEEP IT SIMPLE)
-- =================================================================
-- We won't enable RLS initially to ensure it works

-- 4. INSERT TEST USERS
-- =================================================================
INSERT INTO app_users (email, encrypted_password, role, is_active) VALUES
('admin@test.com', encode('admin123', 'base64'), 'admin', true),
('user@test.com', encode('user123', 'base64'), 'viewer', true),
('collaborator@test.com', encode('collab123', 'base64'), 'collaborator', true);

-- 5. VERIFY EVERYTHING WORKS
-- =================================================================
SELECT 'SUCCESS: app_users table reset complete' as status;
SELECT id, email, role, created_at, is_active FROM app_users ORDER BY created_at;

-- =================================================================
-- INSTRUCTIONS:
-- 1. This completely resets the app_users table
-- 2. Creates 3 test users with known passwords
-- 3. No RLS policies for maximum compatibility
-- 4. Test in the app immediately after running this
-- =================================================================