-- ADD AUTOMATIC PROFILE CREATION TRIGGER
-- This script adds the missing trigger to automatically create profiles when users sign up

-- First, update the profiles table to reference auth.users
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS id,
ADD COLUMN IF NOT EXISTS id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for profiles to use auth.users
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_update" ON public.profiles;

-- Create proper RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage profiles
CREATE POLICY "profiles_service_role" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ PROFILE TRIGGER ADDED SUCCESSFULLY!';
    RAISE NOTICE '🔗 Profiles table now references auth.users';
    RAISE NOTICE '⚡ Automatic profile creation trigger enabled';
    RAISE NOTICE '🔒 Updated RLS policies for proper security';
    RAISE NOTICE '👤 New users will automatically get profiles created';
END $$;
