'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SingleChoiceQuestionProps {
  question: string
  options: string[]
  selectedValue?: string
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
  selectedValue = "",
  onSelect,
  onNext,
  onBack,
  showBackButton = false,
  autoAdvance = true,
  delay = 1000,
  className = ''
}: SingleChoiceQuestionProps) {
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [justSelected, setJustSelected] = useState(false)

  const handleOptionSelect = (option: string) => {
    if (selectedValue === option || isAdvancing) return // Prevent multiple selections
    
    // Always call onSelect first to update the parent state
    onSelect(option)
    setJustSelected(true)

    // Auto-advance after delay, even with manual navigation available
    if (autoAdvance) {
      setIsAdvancing(true)
      setTimeout(() => {
        if (onNext) {
          onNext()
        }
        setIsAdvancing(false)
        setJustSelected(false)
      }, delay)
    } else {
      // Reset justSelected after a short delay if no auto-advance
      setTimeout(() => {
        setJustSelected(false)
      }, 1000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full max-w-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 ${className}`}
    >
      {/* Question */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center leading-relaxed px-2"
      >
        {question}
      </motion.h2>

      {/* Options */}
      <div className="space-y-2.5 sm:space-y-3">
        <AnimatePresence>
          {options.map((option, index) => (
            <motion.button
              key={option}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleOptionSelect(option)}
              disabled={selectedValue === option || isAdvancing}
              className={`
                w-full p-3.5 sm:p-4 md:p-5 text-left rounded-xl border-2 transition-all duration-200
                min-h-[52px] sm:min-h-[56px] md:min-h-[64px] flex items-center justify-between
                ${selectedValue === option
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
                }
                ${selectedValue && selectedValue !== option
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-sm active:shadow-md'
                }
                ${isAdvancing ? 'pointer-events-none' : ''}
              `}
            >
              <span className="text-sm sm:text-base md:text-lg font-medium leading-relaxed pr-2">
                {option}
              </span>
              
              {/* Check Icon */}
              <AnimatePresence>
                {selectedValue === option && (
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

      

      {/* Auto-advance indicator */}
      {selectedValue && autoAdvance && justSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pt-2"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
            <span>Avanzando automáticamente...</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}