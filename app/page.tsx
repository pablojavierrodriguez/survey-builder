"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, Check, Shield, Wrench, AlertTriangle, Database, Settings } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth-context"
import { isDatabaseConfigured } from "@/lib/database-validator"
import { SurveyProgress } from "@/components/ui/survey-progress"
import { SingleChoiceQuestion } from "@/components/ui/single-choice-question"
import { SurveySkeleton, ProgressIndicator, ErrorDisplay, LoadingOverlay } from "@/components/ui/loading-states"
import { motion, AnimatePresence } from "framer-motion"

interface SurveyData {
  role: string
  other_role: string
  seniority: string
  company_type: string
  company_size: string
  industry: string
  product_type: string
  customer_segment: string
  main_challenge: string
  daily_tools: string[]
  other_tool: string
  learning_methods: string[]
  salary_currency: string
  salary_min: string
  salary_max: string
  salary_average: string
  email: string
}

interface AppSettings {
  general: {
    maintenanceMode: boolean
    [key: string]: any
  }
  [key: string]: any
}

const roleOptions = [
  "Product Manager",
  "Product Owner",
  "Product Designer / UX/UI Designer (UXer)",
  "Product Engineer / Software Engineer (Developer)",
  "Data Analyst / Product Analyst",
  "Product Marketing Manager",
  "Engineering Manager / Tech Lead",
  "Design Manager / Design Lead",
  "QA Engineer / Test Engineer",
  "DevOps Engineer / Platform Engineer",
  "Technical Writer / Documentation",
  "Customer Success Manager",
  "Sales Engineer / Solutions Engineer",
  "Other",
]

const seniorityOptions = [
  "Junior (0-2 years)",
  "Mid-level (2-5 years)",
  "Senior (5-8 years)",
  "Staff/Principal (8+ years)",
  "Manager/Lead",
  "Director/VP",
  "C-level/Founder",
]

const companySizeOptions = [
  "Early-stage Startup (Pre-seed/Seed)",
  "Growth-stage Startup (Series A-C)",
  "Scale-up (Series D+)",
  "SME (Small/Medium Enterprise)",
  "Large Corporate (1000+ employees)",
  "Enterprise (10,000+ employees)",
  "Consultancy/Agency",
  "Freelance/Independent",
]

const industryOptions = [
  "Technology/Software",
  "Financial Services/Fintech",
  "Healthcare/Medtech",
  "E-commerce/Retail",
  "Education/Edtech",
  "Media/Entertainment",
  "Manufacturing/Industrial",
  "Consulting/Professional Services",
  "Government/Public Sector",
  "Non-profit/NGO",
  "Other",
]

const productTypeOptions = [
  "SaaS (B2B)",
  "SaaS (B2C)",
  "Mobile App",
  "Web Application",
  "E-commerce Platform",
  "API/Developer Tools",
  "Hardware + Software",
  "Services/Consulting",
  "Internal Tools",
  "Other",
]

const customerSegmentOptions = ["B2B Product", "B2C Product", "B2B2C Product", "Internal Product", "Mixed (B2B + B2C)"]

const toolOptions = [
  "Jira",
  "Figma",
  "Notion",
  "Miro",
  "Trello",
  "Asana",
  "Monday.com",
  "ClickUp",
  "Linear",
  "Slack",
  "Microsoft Teams",
  "Zoom",
  "Google Workspace",
  "Microsoft 365",
  "Confluence",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Sketch",
  "Adobe XD",
  "InVision",
  "Framer",
  "Webflow",
  "Airtable",
  "Coda",
  "Obsidian",
  "Roam Research",
  "Mural",
  "FigJam",
  "Whimsical",
  "Lucidchart",
  "Draw.io",
  "Canva",
  "Loom",
  "Other",
]

const learningOptions = ["Books", "Podcasts", "Courses", "Community", "Mentors", "Other"]

export default function ProductSurvey() {
  const { user, userIsAdmin } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [surveyData, setSurveyData] = useState<SurveyData>({
    role: "",
    other_role: "",
    seniority: "",
    company_type: "",
    company_size: "",
    industry: "",
    product_type: "",
    customer_segment: "",
    main_challenge: "",
    daily_tools: [],
    other_tool: "",
    learning_methods: [],
    salary_currency: "ARS", // Default to Argentine Pesos
    salary_min: "",
    salary_max: "",
    salary_average: "",
    email: "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [databaseStatus, setDatabaseStatus] = useState<"checking" | "configured" | "not-configured">("checking")
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false)

  const totalSteps = 12

  useEffect(() => {
    setIsMounted(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/config/check')
      const result = await response.json()
      
      if (!result.configured) {
        setDatabaseStatus("not-configured")
        setIsLoading(false)
        return
      }

      setDatabaseStatus("configured")
      
      // Load app settings
      const settingsResponse = await fetch('/api/admin/settings')
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings(settingsData)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading settings:', error)
      setError('Error loading configuration')
      setIsLoading(false)
    }
  }

  // Handlers for single choice questions (no auto-advance)
  const handleRoleSelect = (role: string) => {
    setSurveyData(prev => ({ ...prev, role }))
  }

  const handleSenioritySelect = (seniority: string) => {
    setSurveyData(prev => ({ ...prev, seniority }))
  }

  const handleCompanySizeSelect = (company_size: string) => {
    setSurveyData(prev => ({ ...prev, company_size }))
  }

  const handleIndustrySelect = (industry: string) => {
    setSurveyData(prev => ({ ...prev, industry }))
  }

  const handleProductTypeSelect = (product_type: string) => {
    setSurveyData(prev => ({ ...prev, product_type }))
  }

  const handleCustomerSegmentSelect = (customer_segment: string) => {
    setSurveyData(prev => ({ ...prev, customer_segment }))
  }

  // Manual navigation handlers
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleOtherRoleChange = (other_role: string) => {
    setSurveyData(prev => ({ ...prev, other_role }))
  }

  const handleChallengeChange = (main_challenge: string) => {
    setSurveyData(prev => ({ ...prev, main_challenge }))
  }

  const handleToolToggle = (tool: string) => {
    setSurveyData(prev => ({
      ...prev,
      daily_tools: prev.daily_tools.includes(tool)
        ? prev.daily_tools.filter(t => t !== tool)
        : [...prev.daily_tools, tool]
    }))
  }

  const handleLearningToggle = (method: string) => {
    setSurveyData(prev => ({
      ...prev,
      learning_methods: prev.learning_methods.includes(method)
        ? prev.learning_methods.filter(m => m !== method)
        : [...prev.learning_methods, method]
    }))
  }

  const handleEmailChange = (email: string) => {
    setSurveyData(prev => ({ ...prev, email }))
  }

  const handleOtherToolChange = (other_tool: string) => {
    setSurveyData(prev => ({ ...prev, other_tool }))
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return surveyData.role !== ""
      case 1:
        return surveyData.other_role !== ""
      case 2:
        return surveyData.seniority !== ""
      case 3:
        return surveyData.company_size !== ""
      case 4:
        return surveyData.industry !== ""
      case 5:
        return surveyData.product_type !== ""
      case 6:
        return surveyData.customer_segment !== ""
      case 7:
        return surveyData.main_challenge.trim().length > 10
      case 8:
        return surveyData.daily_tools.length > 0
      case 9:
        return surveyData.learning_methods.length > 0
      case 10:
        return true // Salary is optional
      case 11:
        return surveyData.email === "" || isValidEmail(surveyData.email)
      default:
        return true
    }
  }

  const submitSurvey = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      })

      if (response.ok) {
        // Success - show completion message
        setCurrentStep(totalSteps + 1) // Show completion step
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error submitting survey')
      }
    } catch (error) {
      console.error('Error submitting survey:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = () => {
    const percentage = Math.round((currentStep / totalSteps) * 100)

    switch (currentStep) {
      case 0:
        return (
          <SingleChoiceQuestion
            question="What's your current role?"
            options={roleOptions}
            onSelect={handleRoleSelect}
            onNext={handleNext}
            showBackButton={false}
            autoAdvance={true}
            delay={500}
          />
        )

      case 1:
        return (
          <SingleChoiceQuestion
            question="What's your seniority level?"
            options={seniorityOptions}
            onSelect={handleSenioritySelect}
            onNext={handleNext}
            onBack={handlePrevious}
            showBackButton={true}
            autoAdvance={true}
            delay={500}
          />
        )

      case 2:
        return (
          <SingleChoiceQuestion
            question="What type of company do you work for?"
            options={companySizeOptions}
            onSelect={handleCompanySizeSelect}
            onNext={handleNext}
            onBack={handlePrevious}
            showBackButton={true}
            autoAdvance={true}
            delay={500}
          />
        )

      case 3:
        return (
          <SingleChoiceQuestion
            question="What industry do you work in?"
            options={industryOptions}
            onSelect={handleIndustrySelect}
            onNext={handleNext}
            onBack={handlePrevious}
            showBackButton={true}
            autoAdvance={true}
            delay={500}
          />
        )

      case 4:
        return (
          <SingleChoiceQuestion
            question="What type of product do you work on?"
            options={productTypeOptions}
            onSelect={handleProductTypeSelect}
            onNext={handleNext}
            onBack={handlePrevious}
            showBackButton={true}
            autoAdvance={true}
            delay={500}
          />
        )

      case 5:
        return (
          <SingleChoiceQuestion
            question="What's your customer segment?"
            options={customerSegmentOptions}
            onSelect={handleCustomerSegmentSelect}
            onNext={handleNext}
            onBack={handlePrevious}
            showBackButton={true}
            autoAdvance={true}
            delay={500}
          />
        )

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center"
            >
              What's your main product-related challenge?
            </motion.h2>
            <Textarea
              value={surveyData.main_challenge}
              onChange={(e) => handleChallengeChange(e.target.value)}
              placeholder="Describe your biggest challenge in product management, design, or development..."
              className="min-h-32 text-lg p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="px-6 py-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!surveyData.main_challenge.trim() || surveyData.main_challenge.trim().length < 10}
                className="px-8 py-3"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 7:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center"
            >
              What tools do you use daily? (Select all that apply)
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {toolOptions.map((tool) => (
                <motion.button
                  key={tool}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToolToggle(tool)}
                  className={`
                    p-4 text-left rounded-xl border-2 transition-all duration-200
                    min-h-[56px] flex items-center justify-between
                    ${surveyData.daily_tools.includes(tool)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
                    }
                  `}
                >
                  <span className="text-base font-medium">{tool}</span>
                  {surveyData.daily_tools.includes(tool) && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </motion.button>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {surveyData.daily_tools.length} selected
                </span>
              </div>
              <Button
                onClick={handleNext}
                disabled={surveyData.daily_tools.length === 0}
                className="px-8 py-3"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 8:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center"
            >
              What tools do you use daily? (Select all that apply)
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {toolOptions.map((tool) => (
                <motion.button
                  key={tool}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToolToggle(tool)}
                  className={`
                    p-4 text-left rounded-xl border-2 transition-all duration-200
                    min-h-[56px] flex items-center justify-between
                    ${surveyData.daily_tools.includes(tool)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
                    }
                  `}
                >
                  <span className="text-base font-medium">{tool}</span>
                  {surveyData.daily_tools.includes(tool) && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </motion.button>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {surveyData.daily_tools.length} selected
                </span>
              </div>
              <Button
                onClick={handleNext}
                disabled={surveyData.daily_tools.length === 0}
                className="px-8 py-3"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 9:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center"
            >
              How do you learn about product? (Select all that apply)
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {learningOptions.map((method) => (
                <motion.button
                  key={method}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLearningToggle(method)}
                  className={`
                    p-4 text-left rounded-xl border-2 transition-all duration-200
                    min-h-[56px] flex items-center justify-between
                    ${surveyData.learning_methods.includes(method)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
                    }
                  `}
                >
                  <span className="text-base font-medium">{method}</span>
                  {surveyData.learning_methods.includes(method) && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </motion.button>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  className="px-6 py-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {surveyData.learning_methods.length} selected
                </span>
              </div>
              <Button
                onClick={handleNext}
                disabled={surveyData.learning_methods.length === 0}
                className="px-8 py-3"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 10:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center"
            >
              What's your salary range? (Optional)
            </motion.h2>
            <div className="max-w-lg mx-auto space-y-6">
              {/* Currency Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency:</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSurveyData({ ...surveyData, salary_currency: "ARS", salary_min: "", salary_max: "", salary_average: "" })}
                    className={`flex-1 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      surveyData.salary_currency === "ARS"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇦🇷</span>
                      <span className="font-medium">Argentine Pesos</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurveyData({ ...surveyData, salary_currency: "USD", salary_min: "", salary_max: "", salary_average: "" })}
                    className={`flex-1 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      surveyData.salary_currency === "USD"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇺🇸</span>
                      <span className="font-medium">US Dollars</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Salary Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Salary Range</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={surveyData.salary_min}
                      onChange={(e) => {
                        const min = parseInt(e.target.value) || 0
                        const max = parseInt(surveyData.salary_max) || 0
                        const avg = min > 0 && max > 0 ? Math.round((min + max) / 2).toString() : ""
                        setSurveyData({ 
                          ...surveyData, 
                          salary_min: e.target.value,
                          salary_average: avg
                        })
                      }}
                      placeholder={surveyData.salary_currency === "USD" ? "Min (e.g., 80000)" : "Min (e.g., 2000000)"}
                      className="text-lg p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      value={surveyData.salary_max}
                      onChange={(e) => {
                        const min = parseInt(surveyData.salary_min) || 0
                        const max = parseInt(e.target.value) || 0
                        const avg = min > 0 && max > 0 ? Math.round((min + max) / 2).toString() : ""
                        setSurveyData({ 
                          ...surveyData, 
                          salary_max: e.target.value,
                          salary_average: avg
                        })
                      }}
                      placeholder={surveyData.salary_currency === "USD" ? "Max (e.g., 120000)" : "Max (e.g., 3000000)"}
                      className="text-lg p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    OR
                  </span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Salary</label>
                  <Input
                    type="number"
                    value={surveyData.salary_average}
                    onChange={(e) => {
                      const avg = parseInt(e.target.value) || 0
                      setSurveyData({ 
                        ...surveyData, 
                        salary_average: e.target.value,
                        salary_min: avg > 0 ? Math.round(avg * 0.85).toString() : "",
                        salary_max: avg > 0 ? Math.round(avg * 1.15).toString() : ""
                      })
                    }}
                    placeholder={surveyData.salary_currency === "USD" ? "Average (e.g., 100000)" : "Average (e.g., 2500000)"}
                    className="text-lg p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  {surveyData.salary_average && surveyData.salary_min && surveyData.salary_max && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Auto-calculated range: {parseInt(surveyData.salary_min).toLocaleString()} - {parseInt(surveyData.salary_max).toLocaleString()} {surveyData.salary_currency}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="px-6 py-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="px-8 py-3"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 11:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center"
            >
              Your email (Optional)
            </motion.h2>
            <Input
              type="email"
              value={surveyData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="your@email.com"
              className={`w-full p-4 text-lg rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                surveyData.email && !isValidEmail(surveyData.email)
                  ? "border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400"
                  : "border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
              }`}
            />
            {surveyData.email && !isValidEmail(surveyData.email) && (
              <p className="text-red-500 dark:text-red-400 text-sm">Please enter a valid email address</p>
            )}
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="px-6 py-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="px-8 py-3"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 12:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Thank you!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your responses help us build better products and create more valuable content for the product community.
              {surveyData.email && " We'll follow up with you soon."}
            </p>
            {userIsAdmin && (
              <Button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="px-8 py-3"
              >
                View Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </motion.div>
        )

      default:
        return null
    }
  }

  if (!isMounted) {
    return <SurveySkeleton />
  }

  if (isLoading) {
    return <ProgressIndicator message="Loading survey..." />
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={() => {
          setError(null)
          loadSettings()
        }}
      />
    )
  }

  if (databaseStatus === "not-configured") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuración Requerida
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            La aplicación necesita ser configurada antes de poder usarla.
          </p>
          <Button
            onClick={() => window.location.href = '/setup'}
            className="w-full"
          >
            Configurar Aplicación
            <Settings className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (settings?.general?.maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Under Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The application is under maintenance. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Product Community Survey
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ModeToggle />
              {/* Debug info */}
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                User: {user ? 'Yes' : 'No'} | Admin: {userIsAdmin ? 'Yes' : 'No'}
              </div>
              {userIsAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/admin/dashboard'}
                  className="hidden sm:flex"
                >
                  Admin Panel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/auth/login'}
                  className="hidden sm:flex"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          {currentStep <= totalSteps && (
            <div className="mb-8">
              <SurveyProgress
                current={currentStep}
                total={totalSteps}
                percentage={Math.round((currentStep / totalSteps) * 100)}
              />
            </div>
          )}

          {/* Question Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderQuestion()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {currentStep > 0 && currentStep <= totalSteps && (
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="px-6 py-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSubmitting} message="Submitting survey..." />
    </div>
  )
}
