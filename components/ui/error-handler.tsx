"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, AlertCircle } from "lucide-react"

interface ErrorHandlerProps {
  error: string | null
  onDismiss: () => void
  title?: string
}

export function ErrorHandler({ error, onDismiss, title = "Error" }: ErrorHandlerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onDismiss, 300) // Wait for animation
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [error, onDismiss])

  if (!error || !isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2">
      <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300)
            }}
            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <X className="h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Hook for managing errors
export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null)

  const showError = (message: string) => {
    setError(message)
  }

  const clearError = () => {
    setError(null)
  }

  return { error, showError, clearError }
}