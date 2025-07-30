-- =================================================================
-- CREATE DEMO USER PROFILES FOR PRODUCT COMMUNITY SURVEY
-- =================================================================
-- 
-- INSTRUCTIONS:
-- 1. First run get-user-ids.sql to get the real UUIDs
-- 2. Replace the placeholder UUIDs below with the real ones
-- 3. Then run this script
--
-- Example: If get-user-ids.sql shows:
-- admin@demo.com | 12345678-1234-1234-1234-123456789abc
-- Then replace '00000000-0000-0000-0000-000000000004' with '12345678-1234-1234-1234-123456789abc'

-- Create demo user profiles
-- Replace the UUIDs below with the actual user IDs from auth.users

-- 1. Create viewer profile
-- Replace UUID with actual user ID for viewer@demo.com
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- ⚠️ REPLACE: Get UUID from get-user-ids.sql for viewer@demo.com
  'viewer@demo.com',
  'viewer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Create admin-demo profile
-- Replace UUID with actual user ID for admin-demo@demo.com
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002', -- ⚠️ REPLACE: Get UUID from get-user-ids.sql for admin-demo@demo.com
  'admin-demo@demo.com',
  'admin-demo',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 3. Create collaborator profile
-- Replace UUID with actual user ID for collaborator@demo.com
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003', -- ⚠️ REPLACE: Get UUID from get-user-ids.sql for collaborator@demo.com
  'collaborator@demo.com',
  'collaborator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- 4. Create admin profile
-- Replace UUID with actual user ID for admin@demo.com
INSERT INTO profiles (id, email, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004', -- ⚠️ REPLACE: Get UUID from get-user-ids.sql for admin@demo.com
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