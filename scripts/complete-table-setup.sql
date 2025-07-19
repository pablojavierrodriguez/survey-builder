-- SCRIPT COMPLETO PARA SUPABASE - EJECUTAR EN SQL EDITOR
-- Este script crea la tabla completa con todas las columnas necesarias

-- 1. Eliminar tabla existente si hay problemas (CUIDADO: esto borra datos)
-- DROP TABLE IF EXISTS pc_survey_data CASCADE;

-- 2. Crear la tabla completa con todas las columnas
CREATE TABLE IF NOT EXISTS pc_survey_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT NOT NULL,
    daily_tools TEXT[] DEFAULT '{}',
    learning_methods TEXT[] DEFAULT '{}',
    content_preferences TEXT[] DEFAULT '{}',
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agregar columnas faltantes si la tabla ya existe
ALTER TABLE pc_survey_data 
ADD COLUMN IF NOT EXISTS other_role TEXT,
ADD COLUMN IF NOT EXISTS seniority TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT,
ADD COLUMN IF NOT EXISTS customer_segment TEXT,
ADD COLUMN IF NOT EXISTS daily_tools TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_methods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_preferences TEXT[] DEFAULT '{}';

-- 4. Asegurar que las columnas array tengan defaults correctos
ALTER TABLE pc_survey_data 
ALTER COLUMN daily_tools SET DEFAULT '{}',
ALTER COLUMN learning_methods SET DEFAULT '{}',
ALTER COLUMN content_preferences SET DEFAULT '{}';

-- 5. Habilitar Row Level Security
ALTER TABLE pc_survey_data ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Allow anonymous inserts" ON pc_survey_data;
DROP POLICY IF EXISTS "Allow authenticated select" ON pc_survey_data;
DROP POLICY IF EXISTS "Allow anon select" ON pc_survey_data;

-- 7. Crear políticas de seguridad
-- Permitir inserción anónima (para el formulario público)
CREATE POLICY "Allow anonymous inserts" ON pc_survey_data
    FOR INSERT TO anon
    WITH CHECK (true);

-- Permitir lectura a usuarios autenticados (para admin)
CREATE POLICY "Allow authenticated select" ON pc_survey_data
    FOR SELECT TO authenticated
    USING (true);

-- Permitir lectura anónima (para analytics públicos si es necesario)
CREATE POLICY "Allow anon select" ON pc_survey_data
    FOR SELECT TO anon
    USING (true);

-- 8. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_pc_survey_role ON pc_survey_data(role);
CREATE INDEX IF NOT EXISTS idx_pc_survey_seniority ON pc_survey_data(seniority);
CREATE INDEX IF NOT EXISTS idx_pc_survey_company_size ON pc_survey_data(company_size);
CREATE INDEX IF NOT EXISTS idx_pc_survey_industry ON pc_survey_data(industry);
CREATE INDEX IF NOT EXISTS idx_pc_survey_product_type ON pc_survey_data(product_type);
CREATE INDEX IF NOT EXISTS idx_pc_survey_customer_segment ON pc_survey_data(customer_segment);
CREATE INDEX IF NOT EXISTS idx_pc_survey_created_at ON pc_survey_data(created_at);

-- 9. Insertar datos de prueba para verificar funcionamiento
INSERT INTO pc_survey_data (
    role,
    seniority,
    company_type,
    company_size,
    industry,
    product_type,
    customer_segment,
    main_challenge,
    daily_tools,
    learning_methods,
    email
) VALUES 
(
    'Product Manager',
    'Senior (5-8 years)',
    'Scale-up (Series D+)',
    'Scale-up (Series D+)',
    'Technology/Software',
    'SaaS (B2B)',
    'B2B Product',
    'Balancing user needs with business requirements while managing technical debt',
    ARRAY['Jira', 'Figma', 'Notion'],
    ARRAY['Books', 'Community', 'Podcasts'],
    'test@example.com'
),
(
    'Product Designer / UX/UI Designer (UXer)',
    'Mid-level (2-5 years)',
    'Growth-stage Startup (Series A-C)',
    'Growth-stage Startup (Series A-C)',
    'E-commerce/Retail',
    'Mobile App',
    'B2C Product',
    'Creating consistent design systems across multiple platforms',
    ARRAY['Figma', 'Miro', 'Notion'],
    ARRAY['Courses', 'Community', 'Mentors'],
    null
),
(
    'Product Engineer / Software Engineer (Developer)',
    'Staff/Principal (8+ years)',
    'Enterprise (10,000+ employees)',
    'Enterprise (10,000+ employees)',
    'Financial Services/Fintech',
    'Web Application',
    'B2B Product',
    'Scaling architecture while maintaining code quality and team velocity',
    ARRAY['Jira', 'Notion', 'Other'],
    ARRAY['Books', 'Community'],
    'engineer@company.com'
);

-- 10. Verificar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data' 
ORDER BY ordinal_position;

-- 11. Verificar los datos insertados
SELECT COUNT(*) as total_records FROM pc_survey_data;

-- 12. Mostrar distribución por roles
SELECT role, COUNT(*) as count FROM pc_survey_data GROUP BY role ORDER BY count DESC;

-- 13. Verificar que las columnas array funcionan correctamente
SELECT 
    role,
    daily_tools,
    learning_methods,
    array_length(daily_tools, 1) as tools_count,
    array_length(learning_methods, 1) as methods_count
FROM pc_survey_data 
LIMIT 3;

-- MENSAJE DE CONFIRMACIÓN
DO $$
BEGIN
    RAISE NOTICE '✅ TABLA CONFIGURADA CORRECTAMENTE';
    RAISE NOTICE '✅ POLÍTICAS DE SEGURIDAD APLICADAS';
    RAISE NOTICE '✅ ÍNDICES CREADOS PARA PERFORMANCE';
    RAISE NOTICE '✅ DATOS DE PRUEBA INSERTADOS';
    RAISE NOTICE '🚀 SISTEMA LISTO PARA PRODUCCIÓN';
END $$;
