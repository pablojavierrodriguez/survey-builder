-- =================================================================
-- SIMPLE DEMO USERS CREATION FOR PRODUCT COMMUNITY SURVEY
-- =================================================================
-- This script creates demo user profiles in the profiles table
-- You'll need to create the actual users in Supabase Auth dashboard first

-- Create demo user profiles
-- Note: You need to create the actual users in Supabase Auth dashboard
-- and then update the UUIDs below with the actual user IDs

-- 1. Create viewer profile (replace UUID with actual user ID from auth.users)
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual UUID from auth.users
  'viewer@demo.com',
  'viewer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Create admin-demo profile
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002', -- Replace with actual UUID from auth.users
  'admin-demo@demo.com',
  'admin-demo',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 3. Create collaborator profile
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003', -- Replace with actual UUID from auth.users
  'collaborator@demo.com',
  'collaborator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 4. Create admin profile
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004', -- Replace with actual UUID from auth.users
  'admin@demo.com',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the profiles were created
SELECT 
  email,
  role,
  created_at
FROM profiles
WHERE email IN (
  'viewer@demo.com',
  'admin-demo@demo.com', 
  'collaborator@demo.com',
  'admin@demo.com'
)
ORDER BY email;