import type { 
  Organization, 
  Survey, 
  SurveyQuestion, 
  SurveyOption,
  SurveyResponse,
  User,
  UserRole,
  PlanType,
  QuestionType 
} from '@prisma/client'

// =================================================================
// SURVEY TYPES
// =================================================================

export interface SurveyWithQuestions extends Survey {
  questions: (SurveyQuestion & {
    options: SurveyOption[]
  })[]
}

export interface SurveyWithResponses extends Survey {
  responses: SurveyResponse[]
  _count: {
    responses: number
  }
}

export interface QuestionWithOptions extends SurveyQuestion {
  options: SurveyOption[]
}

// =================================================================
// RESPONSE TYPES
// =================================================================

export interface SurveyResponseData {
  [questionId: string]: any
}

export interface QuestionResponseData {
  questionId: string
  answer: any
  questionType: QuestionType
}

// =================================================================
// ORGANIZATION TYPES
// =================================================================

export interface OrganizationWithUsers extends Organization {
  users: {
    user: User
    role: UserRole
  }[]
  _count: {
    users: number
    surveys: number
  }
}

// =================================================================
// VALIDATION TYPES
// =================================================================

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url'
  value?: any
  message?: string
}

export interface ConditionalLogic {
  type: 'show' | 'hide'
  condition: {
    questionId: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }
}

// =================================================================
// THEME TYPES
// =================================================================

export interface SurveyTheme {
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  fontFamily: string
  customCSS?: string
}

// =================================================================
// SETTINGS TYPES
// =================================================================

export interface SurveySettings {
  allowMultipleResponses: boolean
  requireAuthentication: boolean
  showProgressBar: boolean
  showQuestionNumbers: boolean
  allowBackNavigation: boolean
  autoSave: boolean
  completionMessage: string
  redirectUrl?: string
}

export interface OrganizationSettings {
  defaultTheme: SurveyTheme
  allowedDomains: string[]
  maxSurveys: number
  maxResponses: number
  features: {
    analytics: boolean
    exports: boolean
    api: boolean
    customThemes: boolean
  }
}

// =================================================================
// API TYPES
// =================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =================================================================
// ANALYTICS TYPES
// =================================================================

export interface SurveyAnalytics {
  totalResponses: number
  completionRate: number
  averageTime: number
  dropOffRate: number
  questionAnalytics: {
    questionId: string
    questionText: string
    responseCount: number
    dropOffCount: number
    averageTime: number
  }[]
}

export interface QuestionAnalytics {
  questionId: string
  questionText: string
  questionType: QuestionType
  responseCount: number
  answerDistribution: {
    value: string
    count: number
    percentage: number
  }[]
}