-- Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pc_survey_data' 
ORDER BY ordinal_position;

-- Check if all required columns exist
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id',
        'role', 
        'other_role',
        'seniority',
        'company_type',
        'company_size', 
        'industry',
        'product_type',
        'customer_segment',
        'main_challenge',
        'daily_tools',
        'learning_methods', 
        'content_preferences',
        'email',
        'created_at'
    ];
    col TEXT;
    exists_check INTEGER;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        SELECT COUNT(*) INTO exists_check
        FROM information_schema.columns 
        WHERE table_name = 'pc_survey_data' 
        AND column_name = col;
        
        IF exists_check = 0 THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All required columns exist!';
    END IF;
END $$;
