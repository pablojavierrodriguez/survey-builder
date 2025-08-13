-- =================================================================
-- SCRIPT DE CORRECCIÓN COMPLETA - Survey Builder
-- =================================================================
-- Ejecutar este script en Supabase SQL Editor
-- =================================================================

-- 1. Verificar y crear tabla survey_data
CREATE TABLE IF NOT EXISTS public.survey_data (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_data JSONB NOT NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- 2. Verificar y crear tabla app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT NOT NULL DEFAULT 'dev',
  survey_table_name TEXT NOT NULL DEFAULT 'survey_data',
  app_name TEXT NOT NULL DEFAULT 'Survey Builder',
  settings JSONB DEFAULT '{}'
);

-- 3. Verificar y crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de seguridad
DROP POLICY IF EXISTS "survey_data_public_insert" ON public.survey_data;
CREATE POLICY "survey_data_public_insert" ON public.survey_data
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "survey_data_admin_read" ON public.survey_data;
CREATE POLICY "survey_data_admin_read" ON public.survey_data
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "app_settings_admin_access" ON public.app_settings;
CREATE POLICY "app_settings_admin_access" ON public.app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 6. Insertar configuración inicial si no existe
INSERT INTO public.app_settings (app_name, environment, survey_table_name, settings)
SELECT 'Survey Builder', 'production', 'survey_data', '{
  "general": {
    "surveyTitle": "Product Survey",
    "maintenanceMode": false
  }
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings WHERE environment = 'production');

-- 7. Verificar que todo funciona - insertar datos de prueba
INSERT INTO public.survey_data (response_data, session_id, user_agent)
VALUES (
  '{"test": "data", "timestamp": "2024-01-01"}',
  'test-session-' || extract(epoch from now()),
  'Test User Agent'
);

-- 8. Mostrar resultados
SELECT 'survey_data' as table_name, count(*) as records FROM public.survey_data
UNION ALL
SELECT 'app_settings' as table_name, count(*) as records FROM public.app_settings
UNION ALL
SELECT 'profiles' as table_name, count(*) as records FROM public.profiles;

-- =================================================================
-- Si ves resultados arriba, la base de datos está funcionando
-- =================================================================
