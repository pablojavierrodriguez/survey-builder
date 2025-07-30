// Structured logging utility
// In production, integrate with services like Sentry, LogRocket, or similar

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
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
}

class Logger {
  private level: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.level = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date().toISOString()
    const levelName = LogLevel[entry.level]
    
    let message = `[${timestamp}] ${levelName}: ${entry.message}`
    
    if (entry.context) {
      message += ` | Context: ${JSON.stringify(entry.context)}`
    }
    
    if (entry.error) {
      message += ` | Error: ${entry.error.message}`
      if (entry.error.stack && this.isDevelopment) {
        message += ` | Stack: ${entry.error.stack}`
      }
    }
    
    if (entry.requestId) {
      message += ` | RequestID: ${entry.requestId}`
    }
    
    if (entry.userId) {
      message += ` | UserID: ${entry.userId}`
    }
    
    if (entry.endpoint) {
      message += ` | Endpoint: ${entry.endpoint}`
    }
    
    return message
  }

  private log(level: LogLevel, message: string, options: Partial<LogEntry> = {}) {
    if (level < this.level) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...options
    }

    const formattedMessage = this.formatMessage(entry)

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage)
        break
      case LogLevel.FATAL:
        console.error(`FATAL: ${formattedMessage}`)
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
    console.log('External logging:', entry)
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, { context })
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, { context })
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, { context })
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, { error, context })
  }

  fatal(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, { error, context })
  }

  // Request-specific logging
  request(requestId: string, endpoint: string, userId?: string) {
    return {
      debug: (message: string, context?: Record<string, any>) => {
        this.log(LogLevel.DEBUG, message, { context, requestId, endpoint, userId })
      },
      info: (message: string, context?: Record<string, any>) => {
        this.log(LogLevel.INFO, message, { context, requestId, endpoint, userId })
      },
      warn: (message: string, context?: Record<string, any>) => {
        this.log(LogLevel.WARN, message, { context, requestId, endpoint, userId })
      },
      error: (message: string, error?: Error, context?: Record<string, any>) => {
        this.log(LogLevel.ERROR, message, { error, context, requestId, endpoint, userId })
      }
    }
  }
}

// Global logger instance
export const logger = new Logger()

// Helper function to generate request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Middleware helper for Express/Next.js
export function withLogging(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    const requestId = generateRequestId()
    const url = new URL(request.url)
    const endpoint = `${request.method} ${url.pathname}`
    
    const requestLogger = logger.request(requestId, endpoint)
    
    requestLogger.info('Request started', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    })
    
    try {
      const result = await handler(request, ...args)
      requestLogger.info('Request completed successfully')
      return result
    } catch (error) {
      requestLogger.error('Request failed', error as Error)
      throw error
    }
  }
}