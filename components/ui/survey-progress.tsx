'use client'

import { motion } from 'framer-motion'
import { Progress } from '@radix-ui/react-progress'

interface SurveyProgressProps {
  current: number
  total: number
  percentage: number
  className?: string
}

export function SurveyProgress({ current, total, percentage, className = '' }: SurveyProgressProps) {
  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={percentage} 
          className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </Progress>
      </div>

      {/* Progress Text */}
      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Pregunta {current} de {total}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-medium text-blue-600 dark:text-blue-400"
        >
          {percentage}% completado
        </motion.span>
      </div>
    </div>
  )
}