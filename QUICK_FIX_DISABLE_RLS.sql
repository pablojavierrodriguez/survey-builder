-- Quick fix to disable RLS on app_users table
-- Execute this in Supabase SQL Editor

ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT 'RLS disabled on app_users' as status;
SELECT id, email, role FROM app_users;