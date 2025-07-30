// Structured logging utility
// In production, integrate with services like Sentry, LogRocket, or similar

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  sessionId?: string
  requestId?: string
  clientIP?: string
  userAgent?: string
  endpoint?: string
  method?: string
  responseTime?: number
  statusCode?: number
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
      level,
      message,
      timestamp: new Date().toISOString(),
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
      case LogLevel.FATAL:
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
    console.error('EXTERNAL LOG:', JSON.stringify(entry))
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.WARN, message, context, error)
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  fatal(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.FATAL, message, context, error)
  }

  // Request-specific logging
  logRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    clientIP?: string,
    userId?: string,
    error?: Error
  ) {
    const context = {
      method,
      endpoint,
      statusCode,
      responseTime: `${responseTime}ms`,
      clientIP,
      userId
    }

    if (error) {
      this.error(`Request failed: ${method} ${endpoint}`, context, error)
    } else if (statusCode >= 400) {
      this.warn(`Request warning: ${method} ${endpoint}`, context)
    } else {
      this.info(`Request completed: ${method} ${endpoint}`, context)
    }
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    success: boolean,
    duration: number,
    error?: Error
  ) {
    const context = {
      operation,
      table,
      success,
      duration: `${duration}ms`
    }

    if (error) {
      this.error(`Database operation failed: ${operation} on ${table}`, context, error)
    } else {
      this.info(`Database operation completed: ${operation} on ${table}`, context)
    }
  }

  // Authentication logging
  logAuthEvent(
    event: string,
    userId?: string,
    email?: string,
    success: boolean,
    error?: Error
  ) {
    const context = {
      event,
      userId,
      email,
      success
    }

    if (error) {
      this.error(`Authentication failed: ${event}`, context, error)
    } else {
      this.info(`Authentication event: ${event}`, context)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context)
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context)
export const logWarn = (message: string, context?: Record<string, any>, error?: Error) => logger.warn(message, context, error)
export const logError = (message: string, context?: Record<string, any>, error?: Error) => logger.error(message, context, error)
export const logFatal = (message: string, context?: Record<string, any>, error?: Error) => logger.fatal(message, context, error)