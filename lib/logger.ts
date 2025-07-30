// Structured logging for better error tracking and monitoring

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
  requestId?: string
  userId?: string
  endpoint?: string
  ip?: string
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
    
    // In development, log to console with colors
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.CRITICAL]: '\x1b[35m' // Magenta
      }
      
      console.log(`${colors[level]}${formattedLog}\x1b[0m`)
      
      if (error && error.stack) {
        console.error(`${colors[level]}${error.stack}\x1b[0m`)
      }
    } else {
      // In production, log as JSON for structured logging
      console.log(JSON.stringify(entry))
    }
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

  critical(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.CRITICAL, message, context, error)
  }

  // Request-specific logging
  logRequest(requestId: string, method: string, url: string, ip: string, userId?: string) {
    this.info('Request started', {
      requestId,
      method,
      url,
      ip,
      userId
    })
  }

  logResponse(requestId: string, statusCode: number, duration: number) {
    this.info('Request completed', {
      requestId,
      statusCode,
      duration: `${duration}ms`
    })
  }

  logDatabaseOperation(operation: string, table: string, success: boolean, duration?: number, error?: Error) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR
    const context = {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined
    }
    
    this.log(level, `Database operation: ${operation}`, context, error)
  }

  logAuthEvent(event: string, userId?: string, success: boolean, error?: Error) {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    const context = {
      event,
      userId,
      success
    }
    
    this.log(level, `Authentication event: ${event}`, context, error)
  }

  logConfigChange(setting: string, oldValue: any, newValue: any, userId?: string) {
    this.info('Configuration changed', {
      setting,
      oldValue,
      newValue,
      userId
    })
  }
}

// Global logger instance
export const logger = new Logger()

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context)
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context)
export const logWarn = (message: string, context?: Record<string, any>, error?: Error) => logger.warn(message, context, error)
export const logError = (message: string, context?: Record<string, any>, error?: Error) => logger.error(message, context, error)
export const logCritical = (message: string, context?: Record<string, any>, error?: Error) => logger.critical(message, context, error)