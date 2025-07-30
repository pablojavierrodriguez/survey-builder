// Structured logging system with external service integration
// In production, integrate with services like Sentry, LogRocket, or DataDog

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
  duration?: number
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableExternal: boolean
  externalService?: 'sentry' | 'logrocket' | 'datadog'
  externalConfig?: Record<string, any>
}

class Logger {
  private config: LoggerConfig
  private requestIdCounter = 0

  constructor(config: LoggerConfig) {
    this.config = config
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel)
    const configLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= configLevelIndex
  }

  private formatLogEntry(entry: Omit<LogEntry, 'timestamp'>): LogEntry {
    return {
      ...entry,
      timestamp: new Date().toISOString()
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    if (!this.config.enableExternal || !this.config.externalService) {
      return
    }

    try {
      switch (this.config.externalService) {
        case 'sentry':
          // Integration with Sentry
          if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureMessage(entry.message, {
              level: entry.level,
              extra: entry.context,
              tags: {
                endpoint: entry.endpoint,
                method: entry.method,
                userId: entry.userId
              }
            })
          }
          break

        case 'logrocket':
          // Integration with LogRocket
          if (typeof window !== 'undefined' && (window as any).LogRocket) {
            (window as any).LogRocket.track(entry.level, {
              message: entry.message,
              ...entry.context
            })
          }
          break

        case 'datadog':
          // Integration with DataDog
          if (typeof window !== 'undefined' && (window as any).DD_LOGS) {
            (window as any).DD_LOGS.logger.log(entry.message, entry.context, entry.level)
          }
          break
      }
    } catch (error) {
      // Fallback to console if external service fails
      console.error('Failed to send log to external service:', error)
    }
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) {
      return
    }

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    const errorStr = entry.error ? `\nError: ${entry.error.stack || entry.error.message}` : ''

    const message = `${prefix} ${entry.message}${contextStr}${errorStr}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message)
        break
      case LogLevel.INFO:
        console.info(message)
        break
      case LogLevel.WARN:
        console.warn(message)
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message)
        break
    }
  }

  private async log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    if (!this.shouldLog(level)) {
      return
    }

    const entry = this.formatLogEntry({
      level,
      message,
      context,
      error
    })

    // Log to console
    this.logToConsole(entry)

    // Send to external service
    await this.sendToExternalService(entry)
  }

  // Public logging methods
  async debug(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context)
  }

  async info(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.INFO, message, context)
  }

  async warn(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    await this.log(LogLevel.WARN, message, context, error)
  }

  async error(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    await this.log(LogLevel.ERROR, message, context, error)
  }

  async critical(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    await this.log(LogLevel.CRITICAL, message, context, error)
  }

  // Request-specific logging
  createRequestLogger(request: Request, userId?: string, sessionId?: string) {
    const requestId = this.generateRequestId()
    const startTime = Date.now()

    return {
      requestId,
      startTime,
      
      async log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): Promise<void> {
        const duration = Date.now() - startTime
        const entry = this.formatLogEntry({
          level,
          message,
          context,
          error,
          userId,
          sessionId,
          requestId,
          endpoint: new URL(request.url).pathname,
          method: request.method,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          duration
        })

        if (this.shouldLog(level)) {
          this.logToConsole(entry)
          await this.sendToExternalService(entry)
        }
      },

      async debug(message: string, context?: Record<string, any>): Promise<void> {
        await this.log(LogLevel.DEBUG, message, context)
      },

      async info(message: string, context?: Record<string, any>): Promise<void> {
        await this.log(LogLevel.INFO, message, context)
      },

      async warn(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
        await this.log(LogLevel.WARN, message, context, error)
      },

      async error(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
        await this.log(LogLevel.ERROR, message, context, error)
      },

      async critical(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
        await this.log(LogLevel.CRITICAL, message, context, error)
      }
    }
  }

  // Performance logging
  async logPerformance(operation: string, duration: number, context?: Record<string, any>): Promise<void> {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO
    await this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation,
      duration
    })
  }

  // Database operation logging
  async logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, context?: Record<string, any>): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR
    await this.log(level, `Database ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      duration,
      success
    })
  }

  // Authentication logging
  async logAuthEvent(event: string, userId?: string, success: boolean, context?: Record<string, any>): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    await this.log(level, `Auth event: ${event}`, {
      ...context,
      event,
      userId,
      success
    })
  }

  // Configuration logging
  async logConfigEvent(event: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.INFO, `Config event: ${event}`, context)
  }
}

// Global logger instance
const logger = new Logger({
  level: (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG) as LogLevel,
  enableConsole: true,
  enableExternal: process.env.NODE_ENV === 'production',
  externalService: process.env.LOG_EXTERNAL_SERVICE as 'sentry' | 'logrocket' | 'datadog' | undefined,
  externalConfig: process.env.LOG_EXTERNAL_CONFIG ? JSON.parse(process.env.LOG_EXTERNAL_CONFIG) : undefined
})

export default logger

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context)
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context)
export const logWarn = (message: string, context?: Record<string, any>, error?: Error) => logger.warn(message, context, error)
export const logError = (message: string, context?: Record<string, any>, error?: Error) => logger.error(message, context, error)
export const logCritical = (message: string, context?: Record<string, any>, error?: Error) => logger.critical(message, context, error)
export const createRequestLogger = (request: Request, userId?: string, sessionId?: string) => logger.createRequestLogger(request, userId, sessionId)