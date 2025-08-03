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
  "Desktop Application",
  "Game",
  "Other",
]

const customerSegmentOptions = [
  "B2B (Business to Business)",
  "B2C (Business to Consumer)",
  "B2B2C (Business to Business to Consumer)",
  "D2C (Direct to Consumer)",
  "Marketplace",
  "API/Developer Tools",
  "Enterprise",
  "SMB (Small & Medium Business)",
  "Other",
]

const challengeOptions = [
  "User Research & Understanding",
  "Product Strategy & Roadmapping",
  "Technical Implementation",
  "Design & UX",
  "Data Analysis & Metrics",
  "Stakeholder Management",
  "Resource Constraints",
  "Market Competition",
  "User Adoption & Engagement",
  "Performance & Scalability",
  "Other",
]

const toolOptions = [
  "Figma",
  "Sketch",
  "Adobe Creative Suite",
  "Notion",
  "Confluence",
  "Jira",
  "Linear",
  "Asana",
  "Trello",
  "Slack",
  "Discord",
  "Microsoft Teams",
  "Zoom",
  "Google Meet",
  "Miro",
  "Whimsical",
  "Loom",
  "UserTesting",
  "Hotjar",
  "Mixpanel",
  "Amplitude",
  "Google Analytics",
  "Tableau",
  "Looker",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Postman",
  "Other",
]

const learningOptions = [
  "Online Courses (Coursera, Udemy, etc.)",
  "Books & Reading",
  "Conferences & Meetups",
  "Mentorship",
  "On-the-job Learning",
  "Podcasts",
  "Blogs & Articles",
  "YouTube Channels",
  "Twitter/X",
  "LinkedIn Learning",
  "Other",
]

export default function ProductSurvey() {
  const { user, userIsAdmin } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
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
    salary_currency: "USD",
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

  // Auto-advance handlers for single choice questions
  const handleRoleSelect = (role: string) => {
    setSurveyData(prev => ({ ...prev, role }))
    if (role === "Other") {
      setCurrentStep(2) // Go to "Other" role input
    } else {
      setCurrentStep(3) // Go to seniority
    }
  }

  const handleSenioritySelect = (seniority: string) => {
    setSurveyData(prev => ({ ...prev, seniority }))
    setCurrentStep(4)
  }

  const handleCompanySizeSelect = (company_size: string) => {
    setSurveyData(prev => ({ ...prev, company_size }))
    setCurrentStep(5)
  }

  const handleIndustrySelect = (industry: string) => {
    setSurveyData(prev => ({ ...prev, industry }))
    setCurrentStep(6)
  }

  const handleProductTypeSelect = (product_type: string) => {
    setSurveyData(prev => ({ ...prev, product_type }))
    setCurrentStep(7)
  }

  const handleCustomerSegmentSelect = (customer_segment: string) => {
    setSurveyData(prev => ({ ...prev, customer_segment }))
    setCurrentStep(8)
  }

  const handleChallengeSelect = (main_challenge: string) => {
    setSurveyData(prev => ({ ...prev, main_challenge }))
    setCurrentStep(9)
  }

  const handleSalaryCurrencySelect = (salary_currency: string) => {
    setSurveyData(prev => ({ ...prev, salary_currency }))
    setCurrentStep(10)
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
      case 1:
        return surveyData.role !== ""
      case 2:
        return surveyData.other_role !== ""
      case 3:
        return surveyData.seniority !== ""
      case 4:
        return surveyData.company_size !== ""
      case 5:
        return surveyData.industry !== ""
      case 6:
        return surveyData.product_type !== ""
      case 7:
        return surveyData.customer_segment !== ""
      case 8:
        return surveyData.main_challenge !== ""
      case 9:
        return surveyData.daily_tools.length > 0
      case 10:
        return surveyData.learning_methods.length > 0
      case 11:
        return surveyData.email !== "" && isValidEmail(surveyData.email)
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
      case 1:
        return (
          <SingleChoiceQuestion
            question="¿Cuál es tu rol principal en el equipo de producto?"
            options={roleOptions}
            onSelect={handleRoleSelect}
            autoAdvance={true}
            delay={800}
          />
        )

      case 2:
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
              ¿Cuál es tu rol específico?
            </motion.h2>
            <Input
              value={surveyData.other_role}
              onChange={(e) => handleOtherRoleChange(e.target.value)}
              placeholder="Describe tu rol..."
              className="w-full p-4 text-lg"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                disabled={!surveyData.other_role.trim()}
                className="px-8 py-3"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 3:
        return (
          <SingleChoiceQuestion
            question="¿Cuál es tu nivel de experiencia?"
            options={seniorityOptions}
            onSelect={handleSenioritySelect}
            autoAdvance={true}
            delay={800}
          />
        )

      case 4:
        return (
          <SingleChoiceQuestion
            question="¿En qué tipo de empresa trabajas?"
            options={companySizeOptions}
            onSelect={handleCompanySizeSelect}
            autoAdvance={true}
            delay={800}
          />
        )

      case 5:
        return (
          <SingleChoiceQuestion
            question="¿En qué industria trabajas?"
            options={industryOptions}
            onSelect={handleIndustrySelect}
            autoAdvance={true}
            delay={800}
          />
        )

      case 6:
        return (
          <SingleChoiceQuestion
            question="¿Qué tipo de producto desarrollas?"
            options={productTypeOptions}
            onSelect={handleProductTypeSelect}
            autoAdvance={true}
            delay={800}
          />
        )

      case 7:
        return (
          <SingleChoiceQuestion
            question="¿Cuál es tu segmento de clientes principal?"
            options={customerSegmentOptions}
            onSelect={handleCustomerSegmentSelect}
            autoAdvance={true}
            delay={800}
          />
        )

      case 8:
        return (
          <SingleChoiceQuestion
            question="¿Cuál es tu principal desafío en el trabajo?"
            options={challengeOptions}
            onSelect={handleChallengeSelect}
            autoAdvance={true}
            delay={800}
          />
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
              ¿Qué herramientas usas diariamente? (Selecciona todas las que apliquen)
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {surveyData.daily_tools.length} seleccionadas
              </span>
              <Button
                onClick={handleNext}
                disabled={surveyData.daily_tools.length === 0}
                className="px-8 py-3"
              >
                Continuar
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
              ¿Cómo aprendes y te mantienes actualizado? (Selecciona todas las que apliquen)
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {surveyData.learning_methods.length} seleccionadas
              </span>
              <Button
                onClick={handleNext}
                disabled={surveyData.learning_methods.length === 0}
                className="px-8 py-3"
              >
                Continuar
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
              ¿Cuál es tu email? (Opcional - para recibir resultados)
            </motion.h2>
            <Input
              type="email"
              value={surveyData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="tu@email.com"
              className="w-full p-4 text-lg"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Opcional - para recibir resultados
              </span>
              <Button
                onClick={handleNext}
                className="px-8 py-3"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 12:
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
              ¡Casi terminamos! Revisa tus respuestas
            </motion.h2>
            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Rol:</span>
                    <p className="text-gray-900 dark:text-white">{surveyData.role === "Other" ? surveyData.other_role : surveyData.role}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Experiencia:</span>
                    <p className="text-gray-900 dark:text-white">{surveyData.seniority}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Empresa:</span>
                    <p className="text-gray-900 dark:text-white">{surveyData.company_size}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Industria:</span>
                    <p className="text-gray-900 dark:text-white">{surveyData.industry}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Button
                onClick={submitSurvey}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Enviando..." : "Enviar Encuesta"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 13:
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
              ¡Gracias por completar la encuesta!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tus respuestas nos ayudarán a entender mejor la comunidad de productos.
              {surveyData.email && " Te enviaremos los resultados por email."}
            </p>
            {userIsAdmin && (
              <Button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="px-8 py-3"
              >
                Ver Dashboard
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
    return <ProgressIndicator message="Cargando encuesta..." />
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
            Mantenimiento en Curso
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            La aplicación está en mantenimiento. Por favor, vuelve más tarde.
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
              {userIsAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/admin/dashboard'}
                  className="hidden sm:flex"
                >
                  Admin Panel
                  <ArrowRight className="ml-2 h-4 w-4" />
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
          {currentStep > 1 && currentStep <= totalSteps && (
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="px-6 py-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSubmitting} message="Enviando encuesta..." />
    </div>
  )
}
