-- SCRIPT DE EMERGENCIA - Solo usar si hay problemas graves
-- ⚠️ CUIDADO: Este script ELIMINA todos los datos existentes

-- DESCOMENTA LAS SIGUIENTES LÍNEAS SOLO SI NECESITAS RESET COMPLETO:

-- DROP TABLE IF EXISTS pc_survey_data CASCADE;

-- Luego ejecuta el script complete-table-setup.sql nuevamente

-- Para reset parcial (mantener estructura, limpiar datos):
-- DELETE FROM pc_survey_data WHERE created_at < NOW();

-- Para verificar antes de reset:
SELECT 
    COUNT(*) as total_records,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM pc_survey_data;

-- Mensaje de advertencia
DO $$
BEGIN
    RAISE NOTICE '⚠️  SCRIPT DE EMERGENCIA CARGADO';
    RAISE NOTICE '⚠️  DESCOMENTA LAS LÍNEAS SOLO SI ES NECESARIO';
    RAISE NOTICE '⚠️  ESTO ELIMINARÁ TODOS LOS DATOS EXISTENTES';
END $$;
