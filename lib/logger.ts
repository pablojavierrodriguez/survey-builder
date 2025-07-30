// Structured logging utility
// In production, integrate with services like Sentry, LogRocket, or similar

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  sessionId?: string
  requestId?: string
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

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    }

    const formattedLog = this.formatLog(entry)

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog)
        }
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedLog)
        if (error && this.isDevelopment) {
          console.error('Stack trace:', error.stack)
        }
        break
    }

    // In production, send to external logging service
    if (!this.isDevelopment && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Integrate with external logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    // For now, just log to console in production
    console.log('EXTERNAL LOG:', JSON.stringify(entry))
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.CRITICAL, message, context, error)
  }

  // Request-specific logging
  logRequest(
    method: string,
    endpoint: string,
    ip: string,
    userAgent: string,
    userId?: string,
    sessionId?: string
  ) {
    this.info('API Request', {
      method,
      endpoint,
      ip,
      userAgent,
      userId,
      sessionId
    })
  }

  logResponse(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ) {
    this.info('API Response', {
      method,
      endpoint,
      statusCode,
      responseTime: `${responseTime}ms`,
      userId
    })
  }

  // Database-specific logging
  logDatabaseOperation(
    operation: string,
    table: string,
    success: boolean,
    error?: Error,
    context?: Record<string, any>
  ) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR
    const message = `Database ${operation} on ${table}`
    
    this.log(level, message, {
      operation,
      table,
      success,
      ...context
    }, error)
  }

  // Authentication-specific logging
  logAuthEvent(
    event: string,
    userId?: string,
    success: boolean,
    error?: Error,
    context?: Record<string, any>
  ) {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    const message = `Auth ${event}`
    
    this.log(level, message, {
      event,
      userId,
      success,
      ...context
    }, error)
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context)
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context)
export const logWarn = (message: string, context?: Record<string, any>) => logger.warn(message, context)
export const logError = (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context)
export const logCritical = (message: string, error?: Error, context?: Record<string, any>) => logger.critical(message, error, context)