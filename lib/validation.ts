import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required')
export const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters')

// Enhanced password validation for production
export const strongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

// Authentication schemas
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional()
})

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: strongPasswordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Survey data schemas
export const surveyResponseSchema = z.object({
  role: z.string().min(1, 'Role is required').max(100),
  other_role: z.string().max(100).optional(),
  seniority: z.string().min(1, 'Seniority level is required').max(50),
  company_type: z.string().max(100).optional(),
  company_size: z.string().min(1, 'Company size is required').max(100),
  industry: z.string().min(1, 'Industry is required').max(100),
  product_type: z.string().min(1, 'Product type is required').max(100),
  customer_segment: z.string().min(1, 'Customer segment is required').max(100),
  main_challenge: z.string().min(10, 'Challenge description must be at least 10 characters').max(1000, 'Challenge description must be less than 1000 characters'),
  daily_tools: z.array(z.string().max(50)).min(1, 'At least one tool must be selected').max(20, 'Too many tools selected'),
  other_tool: z.string().max(100).optional(),
  learning_methods: z.array(z.string().max(50)).min(1, 'At least one learning method must be selected').max(10),
  email: z.string().email('Invalid email format').optional().or(z.literal(''))
})

// Admin configuration schemas
export const surveyConfigSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(500),
  thankYouMessage: z.string().min(1, 'Thank you message is required').max(500),
  isActive: z.boolean(),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['single-choice', 'multiple-choice', 'text', 'email']),
    title: z.string().min(1, 'Question title is required').max(200),
    description: z.string().max(500),
    options: z.array(z.string().max(100)).optional(),
    required: z.boolean(),
    order: z.number().min(0),
    isVisible: z.boolean()
  }))
})

export const appSettingsSchema = z.object({
  general: z.object({
    maintenanceMode: z.boolean(),
    allowRegistration: z.boolean().optional(),
    maxResponsesPerDay: z.number().min(0).optional()
  }),
  security: z.object({
    maxLoginAttempts: z.number().min(1).max(20),
    sessionTimeout: z.number().min(1).max(24),
    requireStrongPasswords: z.boolean(),
    enableTwoFactor: z.boolean().optional()
  }),
  database: z.object({
    url: z.string().url('Invalid database URL'),
    apiKey: z.string().min(1, 'API key is required'),
    enableBackup: z.boolean().optional()
  })
})

// Content sanitization
export function sanitizeHtml(input: string): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return input.replace(/<[^>]*>/g, '')
  }
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML brackets
}

export function sanitizeEmail(input: string): string {
  return input.toLowerCase().trim()
}

// Validation helpers
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  sanitize: boolean = true
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Pre-sanitization for string fields
    if (sanitize && typeof data === 'object' && data !== null) {
      data = sanitizeObjectStrings(data)
    }

    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
  } catch (error) {
    return { 
      success: false, 
      errors: ['Validation failed due to unexpected error'] 
    }
  }
}

function sanitizeObjectStrings(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectStrings(item))
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectStrings(value)
    }
    return sanitized
  }
  
  return obj
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  identifier: z.string().min(1),
  action: z.string().min(1),
  windowMs: z.number().min(1000),
  maxAttempts: z.number().min(1)
})

// API response schemas
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
})

export const apiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional()
})

// File upload validation (for future use)
export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  type: z.string().regex(/^(image|text|application)\//),
})

// Search and pagination
export const searchParamsSchema = z.object({
  q: z.string().max(100).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Export types for TypeScript
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type SurveyResponseData = z.infer<typeof surveyResponseSchema>
export type SurveyConfigData = z.infer<typeof surveyConfigSchema>
export type AppSettingsData = z.infer<typeof appSettingsSchema>
export type SearchParams = z.infer<typeof searchParamsSchema>

// Custom validation functions
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}