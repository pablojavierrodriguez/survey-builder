-- =================================================================
-- GET REAL USER IDs FOR DEMO USERS
-- =================================================================
-- Run this script to get the actual UUIDs of the users you created manually
-- Then use those UUIDs in the create-demo-users-simple.sql script

-- Get the UUIDs of the demo users
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email IN (
  'viewer@demo.com',
  'admin-demo@demo.com', 
  'collaborator@demo.com',
  'admin@demo.com'
)
ORDER BY email;

-- This will show you the real UUIDs to use in the profiles table