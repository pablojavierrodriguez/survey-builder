import { z } from 'zod'

// Survey Response Validation Schema
export const SurveyResponseSchema = z.object({
  role: z.enum([
    'Product Manager',
    'Product Owner', 
    'Product Designer / UX/UI Designer (UXer)',
    'Product Engineer / Software Engineer (Developer)',
    'Data Analyst / Product Analyst',
    'Product Marketing Manager',
    'Engineering Manager / Tech Lead',
    'Design Manager / Design Lead',
    'QA Engineer / Test Engineer',
    'DevOps Engineer / Platform Engineer',
    'Technical Writer / Documentation',
    'Customer Success Manager',
    'Sales Engineer / Solutions Engineer',
    'Other'
  ]),
  seniority_level: z.enum([
    'Junior (0-2 years)',
    'Mid-level (2-5 years)',
    'Senior (5-8 years)',
    'Staff/Principal (8+ years)',
    'Manager/Lead',
    'Director/VP',
    'C-level/Founder'
  ]),
  company_type: z.enum([
    'Early-stage Startup (Pre-seed/Seed)',
    'Growth-stage Startup (Series A-C)',
    'Scale-up (Series D+)',
    'SME (Small/Medium Enterprise)',
    'Large Corporate (1000+ employees)',
    'Enterprise (10,000+ employees)',
    'Consultancy/Agency',
    'Freelance/Independent'
  ]),
  industry: z.enum([
    'Technology/Software',
    'Financial Services/Fintech',
    'Healthcare/Medtech',
    'E-commerce/Retail',
    'Education/Edtech',
    'Media/Entertainment',
    'Manufacturing/Industrial',
    'Consulting/Professional Services',
    'Government/Public Sector',
    'Non-profit/NGO',
    'Other'
  ]),
  product_type: z.enum([
    'SaaS (B2B)',
    'SaaS (B2C)',
    'Mobile App',
    'Web Application',
    'E-commerce Platform',
    'API/Developer Tools',
    'Hardware + Software',
    'Services/Consulting',
    'Internal Tools',
    'Other'
  ]),
  customer_segment: z.enum([
    'B2B Product',
    'B2C Product',
    'B2B2C Product',
    'Internal Product',
    'Mixed (B2B + B2C)'
  ]),
  main_challenge: z.string()
    .min(10, 'Challenge must be at least 10 characters')
    .max(500, 'Challenge must be less than 500 characters')
    .refine(text => !text.includes('<script>'), 'Invalid content detected'),
  tools: z.array(z.string())
    .min(1, 'Please select at least one tool')
    .max(10, 'Please select no more than 10 tools'),
  learning_methods: z.array(z.string())
    .min(1, 'Please select at least one learning method')
    .max(5, 'Please select no more than 5 learning methods'),
  salary_range: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
})

// User Authentication Validation
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Admin Settings Validation (no database credentials)
export const AdminSettingsSchema = z.object({
  database: z.object({
    tableName: z.string().min(1, 'Table name is required'),
    environment: z.string().min(1, 'Environment is required'),
  }),
  general: z.object({
    appName: z.string().min(1, 'App name is required'),
    publicUrl: z.string().url('Invalid URL format'),
    maintenanceMode: z.boolean(),
    analyticsEnabled: z.boolean(),
  }),
  security: z.object({
    sessionTimeout: z.number().min(1000, 'Session timeout must be at least 1000ms'),
    maxLoginAttempts: z.number().min(1, 'Max login attempts must be at least 1'),
    enableRateLimit: z.boolean(),
    enforceStrongPasswords: z.boolean(),
    enableTwoFactor: z.boolean(),
  }),
  features: z.object({
    enableExport: z.boolean(),
    enableEmailNotifications: z.boolean(),
    enableAnalytics: z.boolean(),
  }),
})

// API Response Validation
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
})

// Rate Limiting Validation
export const RateLimitSchema = z.object({
  ip: z.string().ip(),
  endpoint: z.string(),
  timestamp: z.number(),
  count: z.number().int().min(0),
})

// Validation Helper Functions
export function validateSurveyResponse(data: unknown) {
  try {
    return { success: true, data: SurveyResponseSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return { success: false, error: 'Unknown validation error' }
  }
}

export function validateLogin(data: unknown) {
  try {
    return { success: true, data: LoginSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid login data', 
        details: error.errors 
      }
    }
    return { success: false, error: 'Unknown validation error' }
  }
}

export function validateSignUp(data: unknown) {
  try {
    return { success: true, data: SignUpSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid signup data', 
        details: error.errors 
      }
    }
    return { success: false, error: 'Unknown validation error' }
  }
}

export function validateAdminSettings(data: unknown) {
  try {
    return { success: true, data: AdminSettingsSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Invalid settings data', 
        details: error.errors 
      }
    }
    return { success: false, error: 'Unknown validation error' }
  }
}

// Sanitization Helper
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Type exports
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>
export type LoginData = z.infer<typeof LoginSchema>
export type SignUpData = z.infer<typeof SignUpSchema>
export type AdminSettings = z.infer<typeof AdminSettingsSchema>