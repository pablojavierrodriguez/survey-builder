import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Test the exact same queries as the analytics API
    const { count: totalResponses, error: countError } = await supabase
      .from('pc_survey_data_dev')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({ 
        error: 'Count error', 
        details: countError.message 
      }, { status: 500 })
    }

    // Test role query
    const { data: roleData, error: roleError } = await supabase
      .from('pc_survey_data_dev')
      .select('role')

    if (roleError) {
      return NextResponse.json({ 
        error: 'Role query error', 
        details: roleError.message 
      }, { status: 500 })
    }

    // Test seniority query
    const { data: seniorityData, error: seniorityError } = await supabase
      .from('pc_survey_data_dev')
      .select('seniority')

    if (seniorityError) {
      return NextResponse.json({ 
        error: 'Seniority query error', 
        details: seniorityError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      debug: {
        totalResponses,
        roleDataCount: roleData?.length || 0,
        seniorityDataCount: seniorityData?.length || 0,
        sampleRoleData: roleData?.slice(0, 3),
        sampleSeniorityData: seniorityData?.slice(0, 3)
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}