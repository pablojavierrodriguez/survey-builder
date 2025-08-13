-- =================================================================
-- SQL DE INICIALIZACIÓN - Survey Builder App
-- =================================================================
-- Ejecutar este script en Supabase SQL Editor para inicializar la base de datos
-- =================================================================

-- Crear tabla de configuración de la app
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  environment TEXT NOT NULL DEFAULT 'dev',
  survey_table_name TEXT NOT NULL DEFAULT 'survey_data',
  app_name TEXT NOT NULL,
  settings JSONB DEFAULT '{}'
);

-- Crear tabla de respuestas de encuesta
CREATE TABLE IF NOT EXISTS public.survey_data (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_data JSONB NOT NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "app_settings_admin_access" ON public.app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "survey_data_public_insert" ON public.survey_data
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- =================================================================
-- FIN DEL SQL DE INICIALIZACIÓN
-- =================================================================
