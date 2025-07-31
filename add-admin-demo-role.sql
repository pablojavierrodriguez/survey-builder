-- =================================================================
-- ADD ADMIN-DEMO ROLE TO PROFILES TABLE
-- =================================================================
-- This script adds the admin-demo role to the profiles table constraint

-- First, check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_role_check';

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Create new constraint with admin-demo role
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('viewer', 'collaborator', 'admin', 'admin-demo'));

-- Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_role_check';

-- Now try to create the admin-demo user profile
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