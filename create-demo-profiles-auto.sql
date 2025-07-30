-- =================================================================
-- AUTOMATIC DEMO USER PROFILES CREATION
-- =================================================================
-- This script automatically gets the UUIDs and creates profiles
-- Run this after creating the users manually in Supabase Auth

-- Create profiles for demo users automatically
DO $$
DECLARE
  viewer_id UUID;
  admin_demo_id UUID;
  collaborator_id UUID;
  admin_id UUID;
BEGIN
  -- Get user IDs from auth.users
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'viewer@demo.com';
  SELECT id INTO admin_demo_id FROM auth.users WHERE email = 'admin-demo@demo.com';
  SELECT id INTO collaborator_id FROM auth.users WHERE email = 'collaborator@demo.com';
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@demo.com';

  -- Create viewer profile
  IF viewer_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, created_at, updated_at)
    VALUES (viewer_id, 'viewer@demo.com', 'viewer', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
    RAISE NOTICE 'Created profile for viewer@demo.com with ID: %', viewer_id;
  ELSE
    RAISE NOTICE 'User viewer@demo.com not found in auth.users';
  END IF;

  -- Create admin-demo profile
  IF admin_demo_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, created_at, updated_at)
    VALUES (admin_demo_id, 'admin-demo@demo.com', 'admin-demo', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
    RAISE NOTICE 'Created profile for admin-demo@demo.com with ID: %', admin_demo_id;
  ELSE
    RAISE NOTICE 'User admin-demo@demo.com not found in auth.users';
  END IF;

  -- Create collaborator profile
  IF collaborator_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, created_at, updated_at)
    VALUES (collaborator_id, 'collaborator@demo.com', 'collaborator', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
    RAISE NOTICE 'Created profile for collaborator@demo.com with ID: %', collaborator_id;
  ELSE
    RAISE NOTICE 'User collaborator@demo.com not found in auth.users';
  END IF;

  -- Create admin profile
  IF admin_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, created_at, updated_at)
    VALUES (admin_id, 'admin@demo.com', 'admin', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
    RAISE NOTICE 'Created profile for admin@demo.com with ID: %', admin_id;
  ELSE
    RAISE NOTICE 'User admin@demo.com not found in auth.users';
  END IF;

END $$;

-- Verify the profiles were created
SELECT 
  p.email,
  p.role,
  p.created_at,
  CASE 
    WHEN u.id IS NOT NULL THEN 'User exists in auth.users'
    ELSE 'User NOT found in auth.users'
  END as auth_status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email IN (
  'viewer@demo.com',
  'admin-demo@demo.com', 
  'collaborator@demo.com',
  'admin@demo.com'
)
ORDER BY p.email;