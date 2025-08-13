-- Script de verificación del schema para Survey Builder
-- Ejecuta esto en tu dashboard de Supabase para verificar que todo esté correcto

-- Verificar que existe la tabla survey_data
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'survey_data'
ORDER BY ordinal_position;

-- Si la tabla no existe, crearla
CREATE TABLE IF NOT EXISTS survey_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_data JSONB NOT NULL,
    session_id TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar que se puede insertar datos de prueba
INSERT INTO survey_data (response_data, session_id, user_agent, ip_address) 
VALUES (
    '{"role": "test", "seniority": "test"}',
    'test-session-123',
    'test-user-agent',
    '127.0.0.1'
);

-- Verificar que se insertó correctamente
SELECT COUNT(*) as total_records FROM survey_data;

-- Limpiar el registro de prueba
DELETE FROM survey_data WHERE session_id = 'test-session-123';
