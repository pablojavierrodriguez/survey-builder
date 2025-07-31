-- =================================================================
-- CREATE MISSING ADMIN-DEMO USER
-- =================================================================
-- This script creates the missing admin-demo@demo.com user
-- Role: admin-demo (read-only admin with limited access)

-- First, create the user in auth.users (this needs to be done manually in Supabase Auth dashboard)
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Email: admin-demo@demo.com
-- Password: demo123

-- Then, create the profile for the user with admin-demo role
-- admin-demo role has access to: dashboard, analytics, settings (read-only)

-- Check if admin-demo user exists
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'admin-demo@demo.com';

-- If the user exists, create the profile with admin-demo role
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  'admin-demo', -- Read-only admin role
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
  END as auth_status,
  'admin-demo: read-only admin (dashboard, analytics, settings)' as role_description
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'admin-demo@demo.com';