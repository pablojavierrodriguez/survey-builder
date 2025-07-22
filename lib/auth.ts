import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Types
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'viewer'
  lastLogin: Date
  isActive: boolean
}

export interface AuthToken {
  userId: string
  username: string
  role: string
  iat: number
  exp: number
}

export interface RateLimitData {
  attempts: number
  lastAttempt: Date
  lockedUntil?: Date
}

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRE_TIME = process.env.JWT_EXPIRE_TIME || '8h'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')
const RATE_LIMIT_MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5')
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
const LOCKOUT_DURATION_MS = parseInt(process.env.LOCKOUT_DURATION_MS || '1800000') // 30 minutes

// In-memory storage for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitData>()

// Demo users (replace with proper database in production)
const demoUsers: User[] = [
  {
    id: '1',
    username: process.env.DEV_ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    role: 'admin',
    lastLogin: new Date(),
    isActive: true
  },
  {
    id: '2',
    username: process.env.DEV_VIEWER_USERNAME || 'viewer',
    email: process.env.SUPPORT_EMAIL || 'viewer@example.com',
    role: 'viewer',
    lastLogin: new Date(),
    isActive: true
  }
]

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, BCRYPT_ROUNDS)
  } catch (error) {
    console.error('Password hashing failed:', error)
    throw new Error('Password hashing failed')
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Password verification failed:', error)
    return false
  }
}

// JWT token management
export function generateToken(user: User): string {
  try {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    }
    
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE_TIME,
      issuer: 'product-survey-app',
      audience: 'survey-users'
    })
  } catch (error) {
    console.error('Token generation failed:', error)
    throw new Error('Token generation failed')
  }
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'product-survey-app',
      audience: 'survey-users'
    }) as AuthToken
    
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Rate limiting
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = new Date()
  const userLimit = rateLimitStore.get(identifier)
  
  if (!userLimit) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      lastAttempt: now
    })
    return { allowed: true }
  }
  
  // Check if user is currently locked out
  if (userLimit.lockedUntil && now < userLimit.lockedUntil) {
    const retryAfter = Math.ceil((userLimit.lockedUntil.getTime() - now.getTime()) / 1000)
    return { allowed: false, retryAfter }
  }
  
  // Reset attempts if window has passed
  if (now.getTime() - userLimit.lastAttempt.getTime() > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      lastAttempt: now
    })
    return { allowed: true }
  }
  
  // Increment attempts
  userLimit.attempts++
  userLimit.lastAttempt = now
  
  // Check if max attempts exceeded
  if (userLimit.attempts > RATE_LIMIT_MAX_ATTEMPTS) {
    userLimit.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS)
    const retryAfter = Math.ceil(LOCKOUT_DURATION_MS / 1000)
    return { allowed: false, retryAfter }
  }
  
  rateLimitStore.set(identifier, userLimit)
  return { allowed: true }
}

// Reset rate limit (call on successful login)
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

// User authentication
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    // Find user by username
    const user = demoUsers.find(u => u.username === username && u.isActive)
    if (!user) {
      return null
    }
    
    // In production, get hashed password from database
    // For demo, use environment variables with hashed passwords
    let hashedPassword: string
    if (username === process.env.DEV_ADMIN_USERNAME) {
      hashedPassword = process.env.DEV_ADMIN_PASSWORD_HASH || await hashPassword('admin123')
    } else if (username === process.env.DEV_VIEWER_USERNAME) {
      hashedPassword = process.env.DEV_VIEWER_PASSWORD_HASH || await hashPassword('viewer123')
    } else {
      return null
    }
    
    const isValidPassword = await verifyPassword(password, hashedPassword)
    if (!isValidPassword) {
      return null
    }
    
    // Update last login
    user.lastLogin = new Date()
    
    return user
  } catch (error) {
    console.error('Authentication failed:', error)
    return null
  }
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }
    
    // In production, fetch user from database
    const user = demoUsers.find(u => u.id === decoded.userId && u.isActive)
    return user || null
  } catch (error) {
    console.error('Get current user failed:', error)
    return null
  }
}

// Session management
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'
  const isSecure = process.env.SECURE_COOKIES === 'true' || isProduction
  
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/'
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete('auth-token')
}

// Authorization helpers
export function requireAuth(requiredRole?: 'admin' | 'viewer') {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return null // Allow access
  }
}

// Logout
export function logout(): NextResponse {
  const response = NextResponse.json({ success: true })
  clearAuthCookie(response)
  return response
}