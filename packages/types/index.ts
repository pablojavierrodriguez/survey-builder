// =================================================================
// SHARED TYPES FOR OPEN SURVEY
// =================================================================

// Re-export database types
export type * from '@open-survey/database'

// =================================================================
// COMMON TYPES
// =================================================================

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams {
  query?: string
  filters?: Record<string, any>
}

// =================================================================
// FORM TYPES
// =================================================================

export interface FormField {
  id: string
  name: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  validation?: ValidationRule[]
  options?: FormOption[]
}

export interface FormOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url'
  value?: any
  message?: string
}

// =================================================================
// UI TYPES
// =================================================================

export interface Theme {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  warning: string
  success: string
  info: string
}

export interface ComponentProps {
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  loading?: boolean
}

// =================================================================
// API TYPES
// =================================================================

export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface ApiSuccess<T = any> {
  data: T
  message?: string
}

export type ApiResult<T = any> = ApiSuccess<T> | { error: ApiError }

// =================================================================
// AUTH TYPES
// =================================================================

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role: UserRole
  permissions: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// =================================================================
// SURVEY BUILDER TYPES
// =================================================================

export interface SurveyBuilderState {
  questions: SurveyQuestion[]
  currentQuestion: number
  isDirty: boolean
  isSaving: boolean
  error: string | null
}

export interface QuestionBuilderProps {
  question: SurveyQuestion
  onUpdate: (question: SurveyQuestion) => void
  onDelete: (id: string) => void
  onMove: (from: number, to: number) => void
}

// =================================================================
// ANALYTICS TYPES
// =================================================================

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
  }[]
}

export interface AnalyticsFilter {
  dateRange: {
    start: Date
    end: Date
  }
  questionIds?: string[]
  responseCount?: {
    min: number
    max: number
  }
}

// =================================================================
// EXPORT TYPES
// =================================================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json'
  includeMetadata: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  questionIds?: string[]
}

export interface ExportResult {
  url: string
  filename: string
  size: number
  expiresAt: Date
}