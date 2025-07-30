-- =================================================================
-- CREATE DEMO USERS FOR PRODUCT COMMUNITY SURVEY
-- =================================================================
-- This script creates demo users with proper authentication
-- Run this in your Supabase SQL editor after setting up authentication

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create demo users with proper authentication
-- Note: These users will be created in auth.users table
-- You'll need to manually set their passwords in Supabase Auth dashboard

-- 1. Create viewer demo user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  uuid_generate_v4(),
  'viewer@demo.com',
  crypt('viewer123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo Viewer", "role": "viewer"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 2. Create admin-demo user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  uuid_generate_v4(),
  'admin-demo@demo.com',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo Admin", "role": "admin-demo"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 3. Create collaborator demo user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  uuid_generate_v4(),
  'collaborator@demo.com',
  crypt('collab456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo Collaborator", "role": "collaborator"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 4. Create admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  uuid_generate_v4(),
  'admin@demo.com',
  crypt('admin789', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo Administrator", "role": "admin"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create profiles for the demo users
-- Note: This will be handled by the trigger function handle_new_user()
-- But we'll create them manually to ensure they exist

-- Get user IDs and create profiles
DO $$
DECLARE
  viewer_id UUID;
  admin_demo_id UUID;
  collaborator_id UUID;
  admin_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'viewer@demo.com';
  SELECT id INTO admin_demo_id FROM auth.users WHERE email = 'admin-demo@demo.com';
  SELECT id INTO collaborator_id FROM auth.users WHERE email = 'collaborator@demo.com';
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@demo.com';

  -- Create profiles
  INSERT INTO profiles (id, email, role, created_at, updated_at)
  VALUES 
    (viewer_id, 'viewer@demo.com', 'viewer', NOW(), NOW()),
    (admin_demo_id, 'admin-demo@demo.com', 'admin-demo', NOW(), NOW()),
    (collaborator_id, 'collaborator@demo.com', 'collaborator', NOW(), NOW()),
    (admin_id, 'admin@demo.com', 'admin', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();
END $$;

-- Verify the users were created
SELECT 
  u.email,
  p.role,
  u.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email IN (
  'viewer@demo.com',
  'admin-demo@demo.com', 
  'collaborator@demo.com',
  'admin@demo.com'
)
ORDER BY u.email;