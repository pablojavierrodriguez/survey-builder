-- =================================================================
-- CORRECCIÓN DE POLÍTICAS RLS - Survey Builder
-- =================================================================
-- Ejecutar este script para corregir las políticas de seguridad
-- =================================================================

-- Eliminar políticas existentes que pueden estar causando problemas
DROP POLICY IF EXISTS "survey_data_public_insert" ON public.survey_data;
DROP POLICY IF EXISTS "survey_data_public_read" ON public.survey_data;

-- Crear políticas más permisivas para la tabla survey_data
-- Permitir INSERT público (para envío de encuestas)
CREATE POLICY "survey_data_allow_insert" ON public.survey_data
  FOR INSERT WITH CHECK (true);

-- Permitir SELECT para usuarios autenticados (para admin panel)
CREATE POLICY "survey_data_allow_select" ON public.survey_data
  FOR SELECT TO authenticated USING (true);

-- Permitir SELECT público también (si necesitas mostrar resultados públicos)
CREATE POLICY "survey_data_allow_public_select" ON public.survey_data
  FOR SELECT TO anon USING (true);

-- Verificar que las políticas estén activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'survey_data';

-- =================================================================
-- FIN DE LA CORRECCIÓN
-- =================================================================
