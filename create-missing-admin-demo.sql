-- =================================================================
-- CREATE MISSING ADMIN-DEMO USER
-- =================================================================
-- This script creates the missing admin-demo@demo.com user

-- First, create the user in auth.users (this needs to be done manually in Supabase Auth dashboard)
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Email: admin-demo@demo.com
-- Password: demo123

-- Then, create the profile for the user
-- You'll need to get the UUID from auth.users after creating the user

-- Check if admin-demo user exists
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'admin-demo@demo.com';

-- If the user exists, create the profile
-- Replace 'USER_UUID_HERE' with the actual UUID from the query above
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  'admin-demo',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'admin-demo@demo.com'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the profile was created
SELECT 
  p.email,
  p.role,
  p.created_at,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ User exists in auth.users'
    ELSE '❌ User NOT found in auth.users'
  END as auth_status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'admin-demo@demo.com';