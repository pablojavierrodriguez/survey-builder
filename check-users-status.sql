-- =================================================================
-- COMPREHENSIVE USER STATUS CHECK
-- =================================================================
-- This script checks all demo users and their profiles

-- Check auth.users table
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN 'Has password'
    ELSE 'No password'
  END as password_status
FROM auth.users 
WHERE email IN (
  'viewer@demo.com',
  'admin-demo@demo.com', 
  'collaborator@demo.com',
  'admin@demo.com'
)
ORDER BY email;

-- Check profiles table
SELECT 
  'profiles' as table_name,
  id,
  email,
  role,
  created_at,
  updated_at
FROM profiles 
WHERE email IN (
  'viewer@demo.com',
  'admin-demo@demo.com', 
  'collaborator@demo.com',
  'admin@demo.com'
)
ORDER BY email;

-- Cross-reference check
SELECT 
  p.email,
  p.role,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ User exists in auth.users'
    ELSE '❌ User NOT found in auth.users'
  END as auth_status,
  CASE 
    WHEN u.encrypted_password IS NOT NULL THEN '✅ Has password'
    ELSE '❌ No password'
  END as password_status,
  u.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email IN (
  'viewer@demo.com',
  'admin-demo@demo.com', 
  'collaborator@demo.com',
  'admin@demo.com'
)
ORDER BY p.email;