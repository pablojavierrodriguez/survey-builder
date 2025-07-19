-- SCRIPT DE VERIFICACIÓN - Ejecutar después del setup principal
-- Este script verifica que todo esté configurado correctamente

-- 1. Verificar que la tabla existe
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'pc_survey_data';

-- 2. Verificar todas las columnas necesarias
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data' 
ORDER BY ordinal_position;

-- 3. Verificar políticas de seguridad
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pc_survey_data';

-- 4. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'pc_survey_data'
ORDER BY indexname;

-- 5. Contar registros existentes
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT role) as unique_roles,
    COUNT(DISTINCT industry) as unique_industries,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM pc_survey_data;

-- 6. Verificar distribución de datos
SELECT 
    'Roles' as category,
    role as value,
    COUNT(*) as count
FROM pc_survey_data 
GROUP BY role
UNION ALL
SELECT 
    'Industries' as category,
    industry as value,
    COUNT(*) as count
FROM pc_survey_data 
WHERE industry IS NOT NULL
GROUP BY industry
ORDER BY category, count DESC;

-- 7. Test de inserción (se eliminará automáticamente)
INSERT INTO pc_survey_data (
    role,
    seniority,
    company_size,
    industry,
    product_type,
    customer_segment,
    main_challenge,
    daily_tools,
    learning_methods,
    email
) VALUES (
    'Test Role - DELETE ME',
    'Test Seniority',
    'Test Company',
    'Test Industry',
    'Test Product',
    'Test Segment',
    'This is a test record that will be deleted automatically',
    ARRAY['Test Tool 1', 'Test Tool 2'],
    ARRAY['Test Method 1', 'Test Method 2'],
    'test-delete@example.com'
);

-- 8. Verificar que el test se insertó correctamente
SELECT * FROM pc_survey_data WHERE role = 'Test Role - DELETE ME';

-- 9. Eliminar el registro de test
DELETE FROM pc_survey_data WHERE role = 'Test Role - DELETE ME';

-- 10. Verificar que se eliminó
SELECT COUNT(*) as test_records_remaining 
FROM pc_survey_data 
WHERE role = 'Test Role - DELETE ME';

-- RESULTADO FINAL
DO $$
DECLARE
    total_count INTEGER;
    column_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO total_count FROM pc_survey_data;
    
    -- Contar columnas
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'pc_survey_data';
    
    -- Contar políticas
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'pc_survey_data';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE tablename = 'pc_survey_data';
    
    RAISE NOTICE '=== VERIFICACIÓN COMPLETA ===';
    RAISE NOTICE '📊 Total de registros: %', total_count;
    RAISE NOTICE '📋 Total de columnas: %', column_count;
    RAISE NOTICE '🔒 Políticas de seguridad: %', policy_count;
    RAISE NOTICE '⚡ Índices creados: %', index_count;
    
    IF total_count >= 3 AND column_count >= 14 AND policy_count >= 2 AND index_count >= 7 THEN
        RAISE NOTICE '✅ SISTEMA COMPLETAMENTE CONFIGURADO Y LISTO';
    ELSE
        RAISE NOTICE '⚠️  REVISAR CONFIGURACIÓN - ALGUNOS ELEMENTOS FALTAN';
    END IF;
END $$;
