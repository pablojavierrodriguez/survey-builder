// Simple Supabase client using direct fetch calls
// Avoids dependency conflicts while providing admin functionality

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

// Database management functions
export class SupabaseManager {
  
  // Execute SQL directly using Supabase REST API
  static async execSQL(sql: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Check if environment variables are configured
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return { 
          success: false, 
          error: 'Supabase environment variables not configured. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' 
        }
      }

      console.log('Executing SQL via RPC:', sql.substring(0, 100) + '...')
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql })
      })

      console.log('SQL RPC response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('SQL RPC error response:', errorText)
        
        // Check if it's HTML response (error page)
        if (errorText.includes('<!DOCTYPE')) {
          return { 
            success: false, 
            error: 'SQL execution failed: API returned HTML error page. This usually means the exec_sql function is not available in your Supabase instance. You may need to create tables manually using the SQL editor in Supabase dashboard.' 
          }
        }
        
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('SQL execution error:', error)
      return { success: false, error: String(error) }
    }
  }

  // Check if dev table exists
  static async checkDevTableExists(): Promise<boolean> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/information_schema.tables?table_schema=eq.public&table_name=eq.pc_survey_data_dev&select=table_name`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`
        }
      })

      if (!response.ok) return false
      
      const data = await response.json()
      return Array.isArray(data) && data.length > 0
    } catch (error) {
      console.error('Error checking dev table:', error)
      return false
    }
  }

  // Create dev table automatically with ALL survey fields
  static async createDevTable(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if environment variables are configured
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return { 
          success: false, 
          error: 'Environment variables not configured. Auto-setup requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local file.' 
        }
      }

      // Try to create a simple table structure first
      // Since exec_sql RPC is not available by default, we'll use an alternative approach
      // Try to insert a test record to see if table exists, if not it will fail
      const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/pc_survey_data_dev?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`
        }
      })

      if (testResponse.status === 200) {
        return { success: true } // Table already exists
      }

      // If table doesn't exist, we need manual setup
      return { 
        success: false, 
        error: 'Table does not exist and automatic creation requires manual setup. Please run the MANUAL_SUPABASE_SETUP.sql script in your Supabase SQL editor.' 
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Insert sample data for testing
  static async insertSampleData(): Promise<{ success: boolean; error?: string }> {
    try {
      const sampleData = [
        {
          role: 'Product Manager',
          seniority: 'Senior (5-8 years)',
          company_type: 'Startup',
          company_size: '51-200 employees',
          industry: 'Technology/Software',
          product_type: 'B2B Product',
          customer_segment: 'B2B Product',
          main_challenge: 'Finding product-market fit and understanding customer needs deeply',
          daily_tools: ['Jira', 'Figma', 'Notion', 'Slack'],
          learning_methods: ['Books', 'Podcasts', 'Community'],
          salary_currency: 'USD',
          salary_min: '85000',
          salary_max: '115000',
          salary_average: '100000',
          email: 'test@example.com'
        },
        {
          role: 'Product Designer / UX/UI Designer (UXer)',
          seniority: 'Mid-level (3-5 years)',
          company_type: 'Scale-up',
          company_size: '201-500 employees',
          industry: 'E-commerce/Retail',
          product_type: 'B2C Product',
          customer_segment: 'B2C Product',
          main_challenge: 'Balancing user needs with business requirements and technical constraints',
          daily_tools: ['Figma', 'Miro', 'Notion', 'Slack'],
          learning_methods: ['Courses', 'Community', 'Mentors'],
          salary_currency: 'ARS',
          salary_min: '2125000',
          salary_max: '2875000',
          salary_average: '2500000',
          email: 'designer@example.com'
        },
        {
          role: 'Product Engineer / Software Engineer (Developer)',
          seniority: 'Senior (5-8 years)',
          company_type: 'Enterprise',
          company_size: '1000+ employees',
          industry: 'Financial Services',
          product_type: 'B2B Product',
          customer_segment: 'B2B Product',
          main_challenge: 'Technical debt management and scaling architecture',
          daily_tools: ['GitHub', 'Jira', 'Slack', 'Linear'],
          learning_methods: ['Books', 'Community'],
          salary_currency: 'USD',
          salary_min: '95000',
          salary_max: '135000',
          salary_average: '115000',
          email: 'engineer@example.com'
        }
      ]

      const response = await fetch(`${SUPABASE_URL}/rest/v1/pc_survey_data_dev`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(sampleData)
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Check if main table exists
  static async checkMainTableExists(): Promise<boolean> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/information_schema.tables?table_schema=eq.public&table_name=eq.pc_survey_data&select=table_name`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`
        }
      })

      if (!response.ok) return false
      
      const data = await response.json()
      return Array.isArray(data) && data.length > 0
    } catch (error) {
      console.error('Error checking main table:', error)
      return false
    }
  }

  // Create main table with all fields
  static async createMainTable(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if environment variables are configured
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return { 
          success: false, 
          error: 'Environment variables not configured. Auto-setup requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local file.' 
        }
      }

      // Try to test if table exists
      const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/pc_survey_data?limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`
        }
      })

      if (testResponse.status === 200) {
        return { success: true } // Table already exists
      }

      // If table doesn't exist, we need manual setup
      return { 
        success: false, 
        error: 'Table does not exist and automatic creation requires manual setup. Please run the MANUAL_SUPABASE_SETUP.sql script in your Supabase SQL editor.' 
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Setup complete environment (dev or main)
  static async setupEnvironment(isDev: boolean = true): Promise<{ 
    success: boolean; 
    steps: { 
      tableCreated: boolean; 
      dataInserted: boolean; 
      error?: string 
    } 
  }> {
    const result = {
      success: false,
      steps: {
        tableCreated: false,
        dataInserted: false,
        error: undefined as string | undefined
      }
    }

    try {
      // Check if table already exists
      const tableExists = isDev ? await this.checkDevTableExists() : await this.checkMainTableExists()
      
      if (!tableExists) {
        // Create table
        const createResult = isDev ? await this.createDevTable() : await this.createMainTable()
        if (!createResult.success) {
          result.steps.error = createResult.error
          return result
        }
        result.steps.tableCreated = true
      }

      // Insert sample data only for dev
      if (isDev) {
        const dataResult = await this.insertSampleData()
        if (!dataResult.success) {
          result.steps.error = dataResult.error
          return result
        }
        result.steps.dataInserted = true
      } else {
        result.steps.dataInserted = true // No sample data for production
      }

      result.success = true
      return result
    } catch (error) {
      result.steps.error = String(error)
      return result
    }
  }

  // Legacy function for backward compatibility
  static async setupDevEnvironment(): Promise<{ 
    success: boolean; 
    steps: { 
      tableCreated: boolean; 
      dataInserted: boolean; 
      error?: string 
    } 
  }> {
    return this.setupEnvironment(true)
  }

  // Get all users from app_users table
  static async getUsers(): Promise<{ users: any[]; error?: string }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/app_users?select=*`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Get app users error:', response.status, errorText)
        
        // Check if it's HTML response (common error)
        if (errorText.includes('<!DOCTYPE')) {
          return { users: [], error: 'API endpoint returned HTML instead of JSON. Check table permissions.' }
        }
        
        return { users: [], error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()
      console.log('Users fetched successfully:', data)
      return { users: Array.isArray(data) ? data : [] }
    } catch (error) {
      console.error('Get users error:', error)
      return { users: [], error: String(error) }
    }
  }

  // Create new user in app_users table
  static async createUser(email: string, password: string, role: string): Promise<{ 
    success: boolean; 
    user?: any; 
    error?: string 
  }> {
    try {
      // Simple password hashing (in production, use bcrypt)
      const encryptedPassword = btoa(password) // Basic encoding for demo
      
      console.log('Creating user:', { email, role })
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          email,
          encrypted_password: encryptedPassword,
          role,
          is_active: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Create app user error:', response.status, errorText)
        
        // Check if it's HTML response
        if (errorText.includes('<!DOCTYPE')) {
          return { success: false, error: 'API endpoint returned HTML instead of JSON. Check table permissions and RLS policies.' }
        }
        
        return { success: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()
      console.log('User created successfully:', data)
      return { success: true, user: Array.isArray(data) ? data[0] : data }
    } catch (error) {
      console.error('Create user exception:', error)
      return { success: false, error: String(error) }
    }
  }

  // Delete user from app_users table
  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`
        }
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Update user role in app_users table
  static async updateUserRole(userId: string, role: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          updated_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}