'use client'

import { motion } from 'framer-motion'

// Skeleton component for loading states
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...(props as any)}
    />
  )
}

// Survey skeleton loading
export function SurveySkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Question skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
      </div>

      {/* Options skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

// Progress indicator for operations
export function ProgressIndicator({ 
  message = "Cargando...", 
  showSpinner = true 
}: { 
  message?: string
  showSpinner?: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-4 p-8"
    >
      {showSpinner && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      )}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-gray-600 dark:text-gray-400 text-center"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}

// Error boundary component
export function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: string
  onRetry?: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center space-y-4 p-8 text-center"
    >
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Algo salió mal
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          {error}
        </p>
      </div>

      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </motion.button>
      )}
    </motion.div>
  )
}

// Loading overlay for full-screen operations
export function LoadingOverlay({ 
  isVisible, 
  message = "Procesando..." 
}: { 
  isVisible: boolean
  message?: string 
}) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl"
      >
        <ProgressIndicator message={message} />
      </motion.div>
    </motion.div>
  )
}
