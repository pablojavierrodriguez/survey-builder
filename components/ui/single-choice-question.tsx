'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SingleChoiceQuestionProps {
  question: string
  options: string[]
  onSelect: (option: string) => void
  onNext?: () => void
  onBack?: () => void
  showBackButton?: boolean
  autoAdvance?: boolean
  delay?: number
  className?: string
}

export function SingleChoiceQuestion({
  question,
  options,
  onSelect,
  onNext,
  onBack,
  showBackButton = false,
  autoAdvance = true,
  delay = 1000,
  className = ''
}: SingleChoiceQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const handleOptionSelect = (option: string) => {
    if (selectedOption || isAdvancing) return // Prevent multiple selections
    
    setSelectedOption(option)

    // Auto-advance only if no manual navigation is provided
    if (autoAdvance && !onNext) {
      setIsAdvancing(true)
      setTimeout(() => {
        onSelect(option)
        setSelectedOption(null)
        setIsAdvancing(false)
      }, delay)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full max-w-2xl mx-auto space-y-6 ${className}`}
    >
      {/* Question */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center leading-relaxed"
      >
        {question}
      </motion.h2>

      {/* Options */}
      <div className="space-y-3">
        <AnimatePresence>
          {options.map((option, index) => (
            <motion.button
              key={option}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect(option)}
              disabled={selectedOption !== null || isAdvancing}
              className={`
                w-full p-4 md:p-5 text-left rounded-xl border-2 transition-all duration-200
                min-h-[56px] md:min-h-[64px] flex items-center justify-between
                ${selectedOption === option
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
                }
                ${selectedOption && selectedOption !== option
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md'
                }
                ${isAdvancing ? 'pointer-events-none' : ''}
              `}
            >
              <span className="text-base md:text-lg font-medium leading-relaxed">
                {option}
              </span>
              
              {/* Check Icon */}
              <AnimatePresence>
                {selectedOption === option && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="flex-shrink-0"
                  >
                    <Check className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-4">
        {/* Back button */}
        {showBackButton && onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="px-6 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        
        {/* Spacer when no back button */}
        {!showBackButton && <div />}
        
        {/* Next button - always visible when option is selected */}
        {selectedOption && (
          <Button
            onClick={() => {
              if (onNext) {
                onNext()
              } else {
                onSelect(selectedOption)
              }
            }}
            disabled={isAdvancing}
            className="px-6 py-2"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Auto-advance indicator */}
      {selectedOption && autoAdvance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400"
          >
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
            <span>Avanzando automáticamente...</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}