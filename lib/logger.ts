// Structured logging for better error tracking and monitoring

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  requestId?: string
  userId?: string
  endpoint?: string
  method?: string
  ip?: string
  userAgent?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(entry: LogEntry): string {
    const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      return `${base} | Context: ${JSON.stringify(entry.context)}`
    }
    
    return base
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      requestId: context?.requestId,
      userId: context?.userId,
      endpoint: context?.endpoint,
      method: context?.method,
      ip: context?.ip,
      userAgent: context?.userAgent,
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      const entry = this.createEntry(LogLevel.DEBUG, message, context)
      console.log(this.formatLog(entry))
    }
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createEntry(LogLevel.INFO, message, context)
    console.log(this.formatLog(entry))
  }

  warn(message: string, context?: Record<string, any>, error?: Error) {
    const entry = this.createEntry(LogLevel.WARN, message, context, error)
    console.warn(this.formatLog(entry))
    if (error && this.isDevelopment) {
      console.warn('Stack trace:', error.stack)
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    const entry = this.createEntry(LogLevel.ERROR, message, context, error)
    console.error(this.formatLog(entry))
    if (error && this.isDevelopment) {
      console.error('Stack trace:', error.stack)
    }
  }

  fatal(message: string, context?: Record<string, any>, error?: Error) {
    const entry = this.createEntry(LogLevel.FATAL, message, context, error)
    console.error(this.formatLog(entry))
    if (error) {
      console.error('Stack trace:', error.stack)
    }
  }

  // Request-specific logging
  logRequest(
    method: string,
    endpoint: string,
    ip: string,
    userAgent: string,
    requestId: string,
    userId?: string
  ) {
    this.info('Request received', {
      method,
      endpoint,
      ip,
      userAgent,
      requestId,
      userId
    })
  }

  logResponse(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    requestId: string,
    userId?: string
  ) {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    const entry = this.createEntry(level, 'Response sent', {
      method,
      endpoint,
      statusCode,
      responseTime: `${responseTime}ms`,
      requestId,
      userId
    })
    
    if (level === LogLevel.WARN) {
      console.warn(this.formatLog(entry))
    } else {
      console.log(this.formatLog(entry))
    }
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    success: boolean,
    duration: number,
    context?: Record<string, any>
  ) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR
    const entry = this.createEntry(level, `Database ${operation}`, {
      table,
      success,
      duration: `${duration}ms`,
      ...context
    })
    
    if (level === LogLevel.ERROR) {
      console.error(this.formatLog(entry))
    } else {
      console.log(this.formatLog(entry))
    }
  }

  // Authentication logging
  logAuthEvent(
    event: 'login' | 'logout' | 'signup' | 'password_reset' | 'failed_login',
    userId?: string,
    email?: string,
    success: boolean,
    context?: Record<string, any>
  ) {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    const entry = this.createEntry(level, `Auth event: ${event}`, {
      userId,
      email,
      success,
      ...context
    })
    
    if (level === LogLevel.WARN) {
      console.warn(this.formatLog(entry))
    } else {
      console.log(this.formatLog(entry))
    }
  }

  // Configuration logging
  logConfigChange(
    setting: string,
    oldValue: any,
    newValue: any,
    userId?: string
  ) {
    this.info('Configuration changed', {
      setting,
      oldValue: typeof oldValue === 'object' ? '[Object]' : oldValue,
      newValue: typeof newValue === 'object' ? '[Object]' : newValue,
      userId
    })
  }
}

// Global logger instance
export const logger = new Logger()

// Helper function to generate request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Middleware helper for request logging
export function createRequestLogger(requestId: string) {
  return {
    logRequest: (method: string, endpoint: string, ip: string, userAgent: string, userId?: string) => {
      logger.logRequest(method, endpoint, ip, userAgent, requestId, userId)
    },
    logResponse: (method: string, endpoint: string, statusCode: number, responseTime: number, userId?: string) => {
      logger.logResponse(method, endpoint, statusCode, responseTime, requestId, userId)
    },
    debug: (message: string, context?: Record<string, any>) => {
      logger.debug(message, { ...context, requestId })
    },
    info: (message: string, context?: Record<string, any>) => {
      logger.info(message, { ...context, requestId })
    },
    warn: (message: string, context?: Record<string, any>, error?: Error) => {
      logger.warn(message, { ...context, requestId }, error)
    },
    error: (message: string, context?: Record<string, any>, error?: Error) => {
      logger.error(message, { ...context, requestId }, error)
    }
  }
}