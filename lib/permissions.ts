// =====================================================================================
// PERMISSIONS SYSTEM - Controls what each role can access and do
// =====================================================================================

export type UserRole = 'viewer' | 'admin-demo' | 'collaborator' | 'admin'

export interface UserPermissions {
  // Dashboard access
  canViewDashboard: boolean
  canViewAnalytics: boolean
  canViewSettings: boolean
  
  // Data permissions
  canViewSurveyData: boolean
  canExportData: boolean
  canViewUsers: boolean
  
  // Modification permissions
  canEditSurveys: boolean
  canEditSettings: boolean
  canManageUsers: boolean
  canDeleteData: boolean
  
  // System permissions
  canAccessSystemLogs: boolean
  canModifyDatabase: boolean
  canViewSensitiveData: boolean
}

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  // Read-only analytics access
  viewer: {
    canViewDashboard: false,
    canViewAnalytics: true,
    canViewSettings: false,
    canViewSurveyData: true,
    canExportData: false, // Limited export
    canViewUsers: false,
    canEditSurveys: false,
    canEditSettings: false,
    canManageUsers: false,
    canDeleteData: false,
    canAccessSystemLogs: false,
    canModifyDatabase: false,
    canViewSensitiveData: false
  },

  // Read-only admin panel demo (public safe)
  'admin-demo': {
    canViewDashboard: true,
    canViewAnalytics: true,
    canViewSettings: true,
    canViewSurveyData: true,
    canExportData: false, // No exports for demo
    canViewUsers: true, // Can see user management UI
    canEditSurveys: false, // Read-only
    canEditSettings: false, // Read-only
    canManageUsers: false, // Read-only
    canDeleteData: false,
    canAccessSystemLogs: false,
    canModifyDatabase: false,
    canViewSensitiveData: false // No sensitive data shown
  },

  // Survey editing + viewer permissions (private)
  collaborator: {
    canViewDashboard: true,
    canViewAnalytics: true,
    canViewSettings: false, // No access to user management
    canViewSurveyData: true,
    canExportData: true,
    canViewUsers: false,
    canEditSurveys: true, // Can edit survey configurations
    canEditSettings: false,
    canManageUsers: false,
    canDeleteData: false,
    canAccessSystemLogs: false,
    canModifyDatabase: false,
    canViewSensitiveData: false
  },

  // Full administrative access (private)
  admin: {
    canViewDashboard: true,
    canViewAnalytics: true,
    canViewSettings: true,
    canViewSurveyData: true,
    canExportData: true,
    canViewUsers: true,
    canEditSurveys: true,
    canEditSettings: true,
    canManageUsers: true,
    canDeleteData: true,
    canAccessSystemLogs: true,
    canModifyDatabase: true,
    canViewSensitiveData: true
  }
}

// Get permissions for a specific role
export function getPermissions(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer
}

// Check if user has specific permission
export function hasPermission(role: UserRole, permission: keyof UserPermissions): boolean {
  return getPermissions(role)[permission]
}

// Get user role from auth data
export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return 'viewer'
  
  try {
    const authData = localStorage.getItem('survey_auth')
    if (!authData) return 'viewer'
    
    const parsed = JSON.parse(authData)
    return parsed.role || 'viewer'
  } catch {
    return 'viewer'
  }
}

// Get current user permissions
export function getCurrentUserPermissions(): UserPermissions {
  return getPermissions(getUserRole())
}

// Role display helpers
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    viewer: 'Viewer',
    'admin-demo': 'Admin Demo',
    collaborator: 'Collaborator', 
    admin: 'Administrator'
  }
  return roleNames[role] || 'Viewer'
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    viewer: 'Read-only access to analytics and survey data',
    'admin-demo': 'Demo access to admin interface (read-only)',
    collaborator: 'Analytics access + survey editing capabilities',
    admin: 'Full administrative access to all features'
  }
  return descriptions[role] || 'Basic access'
}

// Security helpers
export function isPublicRole(role: UserRole): boolean {
  return role === 'viewer' || role === 'admin-demo'
}

export function isPrivateRole(role: UserRole): boolean {
  return role === 'collaborator' || role === 'admin'
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const permissions = getPermissions(role)
  
  // Route-based access control
  if (route.includes('/admin/settings')) {
    return permissions.canViewSettings
  }
  
  if (route.includes('/admin/dashboard')) {
    return permissions.canViewDashboard
  }
  
  if (route.includes('/admin/analytics')) {
    return permissions.canViewAnalytics
  }
  
  if (route.includes('/admin/users')) {
    return permissions.canViewUsers
  }
  
  // Default: allow if not restricted
  return true
}
