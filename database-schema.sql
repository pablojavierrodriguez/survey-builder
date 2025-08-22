-- =================================================================
-- SCHEMA DINÁMICO DE ENCUESTAS - Survey Builder App
-- =================================================================
-- Ejecutar este script en Supabase SQL Editor para crear el sistema de encuestas dinámico
-- =================================================================

-- Crear tabla de encuestas
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Crear tabla de preguntas de encuesta
CREATE TABLE IF NOT EXISTS public.survey_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('single-choice', 'multi-choice', 'text', 'textarea', 'email', 'number', 'date')),
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(survey_id, order_index)
);

-- Crear tabla de opciones para preguntas
CREATE TABLE IF NOT EXISTS public.survey_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_value TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_other BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, order_index)
);

-- Crear tabla de respuestas de encuesta (actualizada)
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES public.surveys(id),
  session_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración de la app (actualizada)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de perfiles de usuario (actualizada)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad para surveys
CREATE POLICY "surveys_admin_access" ON public.surveys
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "surveys_public_read_active" ON public.surveys
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Crear políticas de seguridad para survey_questions
CREATE POLICY "survey_questions_admin_access" ON public.survey_questions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "survey_questions_public_read" ON public.survey_questions
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE surveys.id = survey_questions.survey_id 
      AND surveys.is_active = true
    )
  );

-- Crear políticas de seguridad para survey_options
CREATE POLICY "survey_options_admin_access" ON public.survey_options
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "survey_options_public_read" ON public.survey_options
  FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.survey_questions sq
      JOIN public.surveys s ON s.id = sq.survey_id
      WHERE sq.id = survey_options.question_id 
      AND s.is_active = true
    )
  );

-- Crear políticas de seguridad para survey_responses
CREATE POLICY "survey_responses_public_insert" ON public.survey_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "survey_responses_admin_read" ON public.survey_responses
  FOR SELECT TO authenticated USING (true);

-- Crear políticas de seguridad para app_settings
CREATE POLICY "app_settings_admin_access" ON public.app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Crear políticas de seguridad para profiles
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_admin_access" ON public.profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON public.survey_questions(survey_id, order_index);
CREATE INDEX IF NOT EXISTS idx_survey_options_question_id ON public.survey_options(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_options_order ON public.survey_options(question_id, order_index);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.survey_responses(created_at);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para updated_at
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_questions_updated_at BEFORE UPDATE ON public.survey_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_options_updated_at BEFORE UPDATE ON public.survey_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_responses_updated_at BEFORE UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar encuesta por defecto
INSERT INTO public.surveys (id, name, description, is_active, created_by) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Product Community Survey',
  'Help us understand the product community better',
  true,
  NULL
) ON CONFLICT DO NOTHING;

-- =================================================================
-- FIN DEL SCHEMA DINÁMICO DE ENCUESTAS
-- =================================================================