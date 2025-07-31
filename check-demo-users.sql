-- Check demo users in auth.users table
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'Has password'
        ELSE 'No password'
    END as password_status
FROM auth.users 
WHERE email IN ('viewer@demo.com', 'admin-demo@demo.com', 'collaborator@demo.com', 'admin@demo.com')
ORDER BY email;

-- Check profiles table
SELECT 
    p.id,
    p.email,
    p.role,
    p.created_at,
    CASE 
        WHEN u.id IS NOT NULL THEN 'User exists in auth.users'
        ELSE 'User NOT found in auth.users'
    END as auth_status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email IN ('viewer@demo.com', 'admin-demo@demo.com', 'collaborator@demo.com', 'admin@demo.com')
ORDER BY p.email;

-- Check if users can authenticate (this will show if passwords are set correctly)
-- Note: This is just for checking, not for actual authentication
SELECT 
    email,
    CASE 
        WHEN encrypted_password IS NOT NULL AND length(encrypted_password) > 0 THEN 'Password set'
        ELSE 'No password set'
    END as auth_status
FROM auth.users 
WHERE email IN ('viewer@demo.com', 'admin-demo@demo.com', 'collaborator@demo.com', 'admin@demo.com');