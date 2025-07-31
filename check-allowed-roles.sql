-- =================================================================
-- CHECK ALLOWED ROLES IN PROFILES TABLE
-- =================================================================
-- This script checks what roles are allowed in the profiles table

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_role_check';

-- Check current roles in the table
SELECT DISTINCT role FROM profiles ORDER BY role;

-- Check if admin-demo role exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE role = 'admin-demo') 
        THEN 'admin-demo role EXISTS' 
        ELSE 'admin-demo role DOES NOT EXIST' 
    END as admin_demo_status;

-- Show all constraint violations for roles
SELECT 
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;