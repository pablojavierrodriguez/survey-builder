import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // SQL to create the function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_survey_table_if_not_exists(table_name TEXT)
      RETURNS VOID AS $$
      BEGIN
        -- Check if table exists
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = create_survey_table_if_not_exists.table_name
        ) THEN
          -- Create the table
          EXECUTE format('
            CREATE TABLE %I (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              role TEXT NOT NULL,
              other_role TEXT,
              seniority TEXT NOT NULL,
              company_type TEXT,
              company_size TEXT NOT NULL,
              industry TEXT NOT NULL,
              product_type TEXT NOT NULL,
              customer_segment TEXT NOT NULL,
              main_challenge TEXT NOT NULL,
              daily_tools TEXT[] NOT NULL,
              other_tool TEXT,
              learning_methods TEXT[] NOT NULL,
              salary_currency TEXT DEFAULT ''ARS'',
              salary_min TEXT,
              salary_max TEXT,
              salary_average TEXT,
              email TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          ', create_survey_table_if_not_exists.table_name);
          
          -- Create indexes
          EXECUTE format('
            CREATE INDEX idx_%I_role ON %I (role);
            CREATE INDEX idx_%I_seniority ON %I (seniority);
            CREATE INDEX idx_%I_industry ON %I (industry);
            CREATE INDEX idx_%I_created_at ON %I (created_at);
          ', 
            create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name,
            create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name,
            create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name,
            create_survey_table_if_not_exists.table_name, create_survey_table_if_not_exists.table_name
          );
          
          RAISE NOTICE 'Table % created successfully', create_survey_table_if_not_exists.table_name;
        ELSE
          RAISE NOTICE 'Table % already exists', create_survey_table_if_not_exists.table_name;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })
    
    if (error) {
      logger.error('Function creation error:', error)
      return NextResponse.json({
        error: 'Function creation failed',
        details: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Test the function by creating the dev table
    const testSQL = `SELECT create_survey_table_if_not_exists('pc_survey_data_dev');`
    const { data: testData, error: testError } = await supabase.rpc('exec_sql', { sql: testSQL })
    
    if (testError) {
      logger.error('Function test error:', testError)
      return NextResponse.json({
        error: 'Function created but test failed',
        details: testError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Function created and tested successfully',
      data: { function: data, test: testData },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Create function error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}