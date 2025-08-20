"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, Check, Shield, Wrench, Settings } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth-context"
import { useDebugMode } from "@/lib/use-debug-mode"
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

const companyTypeOptions = [
  "Startup (1-50 employees)",
  "Scale-up (51-200 employees)",
  "Mid-size company (201-1000 employees)",
  "Large enterprise (1000+ employees)",
  "Freelance/Independent",
  "Agency/Consultancy",
  "Other",
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
  const { user, userIsAdmin, clearCorruptedSession } = useAuth()
  const { debugMode } = useDebugMode()
  const [currentStep, setCurrentStep] = useState(1)
  // State for conditional inputs that were previously declared inside render
  const [otherRole, setOtherRole] = useState("")
  const [otherTool, setOtherTool] = useState("")
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
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [databaseStatus, setDatabaseStatus] = useState<"checking" | "configured" | "not-configured">("checking")
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [hasCheckedConfig, setHasCheckedConfig] = useState(false)

  const totalSteps = 12

  useEffect(() => {
    setIsMounted(true)

    // Load persisted survey data and completion status
    try {
      if (typeof window !== "undefined") {
        // Check if survey was completed
        const surveyCompleted = window.sessionStorage.getItem("survey_completed")
        if (surveyCompleted === "true") {
          setSubmitted(true)
        }

        // Load persisted survey data with safety checks
        const persistedData = localStorage.getItem("survey_data")
        if (persistedData) {
          try {
            const parsedData = JSON.parse(persistedData)
            
            // Check if data is stale (older than 24 hours)
            const isStale = parsedData._lastModified && (Date.now() - parsedData._lastModified > 24 * 60 * 60 * 1000)
            
            // Check if data is marked as draft
            const isDraft = parsedData._isDraft === true
            
            if (isStale) {
              console.log("📊 Persisted data is stale, clearing...")
              localStorage.removeItem("survey_data")
              localStorage.removeItem("survey_step")
            } else if (isDraft) {
              // Remove metadata before setting state
              const { _lastModified, _isDraft, ...cleanData } = parsedData
              setSurveyData(cleanData)
              
              // Restore conditional inputs
              if (cleanData.other_role) {
                setOtherRole(cleanData.other_role)
              }
              if (cleanData.other_tool) {
                setOtherTool(cleanData.other_tool)
              }
              
              console.log("📊 Survey data restored from localStorage (draft)")
            } else {
              console.log("📊 Persisted data is not a draft, clearing...")
              localStorage.removeItem("survey_data")
              localStorage.removeItem("survey_step")
            }
          } catch (parseError) {
            console.warn("Failed to parse persisted survey data:", parseError)
            localStorage.removeItem("survey_data")
            localStorage.removeItem("survey_step")
          }
        }

        // Load persisted step
        const persistedStep = localStorage.getItem("survey_step")
        if (persistedStep) {
          const step = parseInt(persistedStep, 10)
          if (step >= 1 && step <= totalSteps) {
            setCurrentStep(step)
            console.log("📊 Survey step restored:", step)
          }
        }
      }
    } catch (storageError) {
      console.warn("Failed to access localStorage/sessionStorage:", storageError)
    }

    // Check configuration status
    const checkConfig = async () => {
      try {
        const response = await fetch("/api/config/check")
        const data = await response.json()

        if (data.success) {
          setDatabaseStatus(data.configured ? "configured" : "not-configured")
        } else {
          setDatabaseStatus("not-configured")
        }
      } catch (error) {
        console.error("Error checking config:", error)
        setDatabaseStatus("not-configured")
      } finally {
        setIsLoading(false)
      }
    }

    checkConfig()
  }, [totalSteps])

  // Removed duplicate effect that changed step based on alternate key

  // Settings loading removed - not needed for basic functionality

  // Smart persistence helper function - only persist draft data, not submitted data
  const persistSurveyData = (data: SurveyData) => {
    try {
      if (typeof window !== "undefined" && !submitted) {
        // Only persist if survey is not submitted
        const draftData = {
          ...data,
          // Add timestamp to detect stale data
          _lastModified: Date.now(),
          _isDraft: true
        }
        localStorage.setItem("survey_data", JSON.stringify(draftData))
      }
    } catch (error) {
      console.warn("Failed to persist survey data:", error)
    }
  }

  const persistStep = (step: number) => {
    try {
      if (typeof window !== "undefined" && !submitted) {
        // Only persist step if survey is not submitted
        localStorage.setItem("survey_step", step.toString())
      }
    } catch (error) {
      console.warn("Failed to persist survey step:", error)
    }
  }

  const clearPersistedData = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("survey_data")
        localStorage.removeItem("survey_step")
        console.log("📊 Cleared persisted survey data")
      }
    } catch (error) {
      console.warn("Failed to clear persisted data:", error)
    }
  }

  // Handlers for single choice questions (no auto-advance)
  const handleRoleSelect = (role: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, role }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleSenioritySelect = (seniority: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, seniority }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleCompanyTypeSelect = (company_type: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, company_type }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleCompanySizeSelect = (company_size: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, company_size }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleIndustrySelect = (industry: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, industry }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleProductTypeSelect = (product_type: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, product_type }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleCustomerSegmentSelect = (customer_segment: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, customer_segment }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleOtherRoleChange = (other_role: string) => {
    // Keep role as "Other" until user continues; store typed value separately
    setOtherRole(other_role)
    setSurveyData((prev) => {
      const newData = { ...prev, other_role }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleChallengeChange = (main_challenge: string) => {
    setSurveyData((prev) => {
      const newData = { ...prev, main_challenge }
      persistSurveyData(newData)
      return newData
    })
  }

  const handleToolToggle = (tool: string) => {
    setSurveyData((prev) => {
      const currentlySelected = prev.daily_tools
      let next = currentlySelected.includes(tool)
        ? currentlySelected.filter((t) => t !== tool)
        : [...currentlySelected, tool]

      // Deduplicate just in case
      next = Array.from(new Set(next))

      // If removing Other, clear otherTool text for consistency
      if (!next.includes("Other")) {
        setOtherTool("")
      }

      return { ...prev, daily_tools: next }
    })
  }

  const handleLearningToggle = (method: string) => {
    setSurveyData((prev) => ({
      ...prev,
      learning_methods: prev.learning_methods.includes(method)
        ? prev.learning_methods.filter((m) => m !== method)
        : [...prev.learning_methods, method],
    }))
  }

  const handleEmailChange = (email: string) => {
    setSurveyData((prev) => ({ ...prev, email }))
  }

  const handleOtherToolChange = (other_tool: string) => {
    setSurveyData((prev) => ({ ...prev, other_tool }))
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: {
        // If "Other" was selected, require a non-empty custom role
        const selectedIsOther = surveyData.role === "Other"
        if (selectedIsOther) {
          return otherRole.trim().length > 0
        }
        return surveyData.role !== ""
      }
      case 2:
        return surveyData.seniority !== ""
      case 3:
        return surveyData.company_type !== ""
      case 4:
        return surveyData.company_size !== ""
      case 5:
        return surveyData.industry !== ""
      case 6:
        return surveyData.product_type !== ""
      case 7:
        return surveyData.customer_segment !== ""
      case 8:
        return surveyData.main_challenge.trim().length > 10
      case 9: {
        if (surveyData.daily_tools.length === 0) return false
        if (surveyData.daily_tools.includes("Other")) {
          return otherTool.trim().length > 0
        }
        return true
      }
      case 10:
        return surveyData.learning_methods.length > 0
      case 11:
        return true // Salary is optional
      case 12:
        return surveyData.email === "" || isValidEmail(surveyData.email)
      default:
        return false
    }
  }

  const submitSurvey = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log("🚀 Starting survey submission...")
      console.log("📊 Survey data:", surveyData)

      const payload = {
        response_data: surveyData,
        session_id:
          typeof window !== "undefined"
            ? window.sessionStorage?.getItem("survey_session_id") || crypto.randomUUID()
            : crypto.randomUUID(),
        user_agent: typeof window !== "undefined" ? window.navigator?.userAgent : "Unknown",
        ip_address: null, // Will be handled server-side if needed
      }

      console.log("📤 Sending payload:", payload)

      // Store session ID for future reference
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem("survey_session_id", payload.session_id)
      }

      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("📥 Response status:", response.status)
      console.log("📥 Response ok:", response.ok)

      const result = await response.json()
      console.log("📥 Response data:", result)

      if (response.ok && result.success) {
        console.log("✅ Survey submitted successfully!")
        setSubmitted(true)
        
        // Clear persisted draft data since survey is now submitted
        clearPersistedData()
        
        // Store success state for better UX
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.setItem("survey_completed", "true")
          window.sessionStorage.setItem("survey-completed", "true")
        }
      } else {
        const errorMessage = result.error || result.message || "Error submitting survey"
        console.error("❌ Submission failed:", errorMessage)
        setError(`Submission failed: ${errorMessage}`)
        console.error("Survey submission error:", result)
      }
    } catch (error) {
      console.error("❌ Error submitting survey:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const restartSurvey = () => {
    // Clear all persisted data
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem("survey_completed")
      window.sessionStorage.removeItem("survey-completed")
      window.sessionStorage.removeItem("survey_session_id")
    }
    
    // Clear localStorage data
    clearPersistedData()
    
    setSubmitted(false)
    setOtherRole("")
    setOtherTool("")
    setCurrentStep(1)
    setSurveyData({
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
      salary_currency: "ARS",
      salary_min: "",
      salary_max: "",
      salary_average: "",
      email: "",
    })
  }

  const handleNext = () => {
    if (!isStepValid(currentStep)) return
    // Normalize role on step 1 when custom role is provided
    if (currentStep === 1 && surveyData.role === "Other" && otherRole.trim().length > 0) {
      setSurveyData((prev) => ({ ...prev, role: otherRole }))
    }
    // Normalize tools on step 9 when "Other" is selected
    if (currentStep === 9 && surveyData.daily_tools.includes("Other") && otherTool.trim().length > 0) {
      const normalized = surveyData.daily_tools.map((t) => (t === "Other" ? otherTool : t))
      setSurveyData((prev) => ({ ...prev, daily_tools: normalized }))
    }
    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    persistStep(nextStep)
  }

  const handleAutoNext = () => {
    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    persistStep(nextStep)
  }

  const handlePrevious = () => {
    const prevStep = currentStep - 1
    setCurrentStep(prevStep)
    persistStep(prevStep)
  }

  // Centralized navigation logic
  const getNavigationConfig = () => {
    const hasPrevious = currentStep > 1
    const hasNext = currentStep < totalSteps
    const isRequired = currentStep !== 11 // Salary is optional (step 11)
    const isAutoAdvance = currentStep >= 1 && currentStep <= 6 // Single-choice questions
    const canProceedResult = isStepValid(currentStep)

    return {
      showBack: hasPrevious,
      showContinue: hasNext,
      continueDisabled: isRequired && !canProceedResult,
      isAutoAdvance,
    }
  }

  const renderQuestion = () => {
    const percentage = Math.round((currentStep / totalSteps) * 100)

    switch (currentStep) {
      case 1:
        return (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
            >
            <SingleChoiceQuestion
                question="What's your current role?"
                options={roleOptions}
                selectedValue={surveyData.role}
                onSelect={(value) => {
                  handleRoleSelect(value)
                  if (value !== "Other") {
                    handleAutoNext()
                  }
                }}
                autoAdvance={false}
                delay={500}
            />

            {surveyData.role === "Other" && (
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                >
                <input
                    type="text"
                    placeholder="Please specify your role..."
                    value={otherRole}
                    onChange={(e) => handleOtherRoleChange(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-500 dark:placeholder-gray-400
                    focus:border-blue-500 focus:outline-none"
                />
                </motion.div>
            )}
            </motion.div>
        )

      case 2:
        return (
          <SingleChoiceQuestion
            question="What's your seniority level?"
            options={seniorityOptions}
            selectedValue={surveyData.seniority}
            onSelect={handleSenioritySelect}
            onNext={handleAutoNext}
            autoAdvance={true}
            delay={500}
          />
        )

      case 3:
        return (
          <SingleChoiceQuestion
            question="What type of company do you work for?"
            options={companyTypeOptions}
            selectedValue={surveyData.company_type}
            onSelect={handleCompanyTypeSelect}
            onNext={handleAutoNext}
            autoAdvance={true}
            delay={500}
          />
        )

      case 4:
        return (
          <SingleChoiceQuestion
            question="What's your company size?"
            options={companySizeOptions}
            selectedValue={surveyData.company_size}
            onSelect={handleCompanySizeSelect}
            onNext={handleAutoNext}
            autoAdvance={true}
            delay={500}
          />
        )

      case 5:
        return (
          <SingleChoiceQuestion
            question="What industry do you work in?"
            options={industryOptions}
            selectedValue={surveyData.industry}
            onSelect={handleIndustrySelect}
            onNext={handleAutoNext}
            autoAdvance={true}
            delay={500}
          />
        )

      case 6:
        return (
          <SingleChoiceQuestion
            question="What type of product do you work on?"
            options={productTypeOptions}
            selectedValue={surveyData.product_type}
            onSelect={handleProductTypeSelect}
            onNext={handleAutoNext}
            autoAdvance={true}
            delay={500}
          />
        )

      case 7:
        return (
          <SingleChoiceQuestion
            question="What's your customer segment?"
            options={customerSegmentOptions}
            selectedValue={surveyData.customer_segment}
            onSelect={(value) =>
              setSurveyData((prev) => ({ ...prev, customer_segment: value }))
            }
            onNext={handleAutoNext}
            autoAdvance={true}
            delay={500}
          />
        );

      case 8:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white text-center leading-relaxed px-2"
            >
              What's your main product-related challenge?
            </motion.h2>
            <Textarea
              value={surveyData.main_challenge}
              onChange={(e) => handleChallengeChange(e.target.value)}
              placeholder="Describe your biggest challenge in product management, design, or development..."
              className="min-h-28 sm:min-h-32 text-sm sm:text-base md:text-lg p-3 sm:p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
            />
          </motion.div>
        )

      case 9:
        const handleFinalNext = () => {
            let tools = [...surveyData.daily_tools]
            if (tools.includes("Other")) {
            tools = tools.map(t => (t === "Other" ? otherTool : t))
            }
            setSurveyData(prev => ({ ...prev, daily_tools: tools }))
            handleNext()
        }

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {toolOptions.map((tool) => (
                <motion.button
                    key={tool}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleToolToggle(tool)}
                    className={`
                    p-3.5 sm:p-4 text-left rounded-xl border-2 transition-all duration-200
                    min-h-[52px] sm:min-h-[56px] flex items-center justify-between
                    ${
                        surveyData.daily_tools.includes(tool)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 shadow-sm"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white"
                    }
                    `}
                >
                    <span className="text-sm sm:text-base font-medium pr-2">{tool}</span>
                    {surveyData.daily_tools.includes(tool) && (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                </motion.button>
                ))}
            </div>

            {surveyData.daily_tools.includes("Other") && (
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                >
                <input
                    type="text"
                    placeholder="Please specify other tools..."
                    value={otherTool}
                    onChange={(e) => setOtherTool(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-500 dark:placeholder-gray-400
                    focus:border-blue-500 focus:outline-none"
                />
                </motion.div>
            )}

            <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                {surveyData.daily_tools.length} selected
            </div>

            {/* Use global Continue; no local button here */}
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
                    ${
                      surveyData.learning_methods.includes(method)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white"
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
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {surveyData.learning_methods.length} selected
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
              What's your salary range? (Optional)
            </motion.h2>
            <div className="max-w-lg mx-auto space-y-6">
              {/* Currency Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency:</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setSurveyData({
                        ...surveyData,
                        salary_currency: "ARS",
                        salary_min: "",
                        salary_max: "",
                        salary_average: "",
                      })
                    }
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
                    onClick={() =>
                      setSurveyData({
                        ...surveyData,
                        salary_currency: "USD",
                        salary_min: "",
                        salary_max: "",
                        salary_average: "",
                      })
                    }
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
                        const min = Number.parseInt(e.target.value) || 0
                        const max = Number.parseInt(surveyData.salary_max) || 0
                        const avg = min > 0 && max > 0 ? Math.round((min + max) / 2).toString() : ""
                        setSurveyData({
                          ...surveyData,
                          salary_min: e.target.value,
                          salary_average: avg,
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
                        const min = Number.parseInt(surveyData.salary_min) || 0
                        const max = Number.parseInt(e.target.value) || 0
                        const avg = min > 0 && max > 0 ? Math.round((min + max) / 2).toString() : ""
                        setSurveyData({
                          ...surveyData,
                          salary_max: e.target.value,
                          salary_average: avg,
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
                      const avg = Number.parseInt(e.target.value) || 0
                      setSurveyData({
                        ...surveyData,
                        salary_average: e.target.value,
                        salary_min: avg > 0 ? Math.round(avg * 0.85).toString() : "",
                        salary_max: avg > 0 ? Math.round(avg * 1.15).toString() : "",
                      })
                    }}
                    placeholder={
                      surveyData.salary_currency === "USD" ? "Average (e.g., 100000)" : "Average (e.g., 2500000)"
                    }
                    className="text-lg p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                  {surveyData.salary_average && surveyData.salary_min && surveyData.salary_max && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Auto-calculated range: {Number.parseInt(surveyData.salary_min).toLocaleString()} -{" "}
                      {Number.parseInt(surveyData.salary_max).toLocaleString()} {surveyData.salary_currency}
                    </p>
                  )}
                </div>
              </div>
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
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Survey Completed!</h2>
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Your responses have been successfully saved
                </p>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Thank you for participating! Your responses help us build better products and create more valuable content
              for the product community.
              {surveyData.email && " We'll follow up with you soon."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {userIsAdmin && (
                <Button onClick={() => (window.location.href = "/admin/dashboard")} className="px-8 py-3">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={restartSurvey} className="px-8 py-3 bg-transparent">
                Take Survey Again
              </Button>
            </div>
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
  // Show success screen once submitted
  if (submitted || (typeof window !== "undefined" && window.sessionStorage?.getItem("survey_completed") === "true")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950">
        <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {settings?.general?.surveyTitle || "My Survey"}
                </h1>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
                <ModeToggle />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 py-6 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto text-center space-y-6"
          >
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Survey Completed!</h2>
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-medium">✅ Your responses have been successfully saved</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {userIsAdmin && (
                <Button onClick={() => (window.location.href = "/admin/dashboard")} className="px-8 py-3">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={restartSurvey} className="px-8 py-3 bg-transparent">
                Take Survey Again
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          setError(null)
          // Reload page instead of calling loadSettings
          window.location.reload()
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración Requerida</h1>
          <p className="text-gray-600 dark:text-gray-400">
            La aplicación necesita ser configurada antes de poder usarla.
          </p>
          <Button onClick={() => (window.location.href = "/setup")} className="w-full">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Under Maintenance</h1>
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
      <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {settings?.general?.surveyTitle || "My Survey"}
              </h1>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
              <ModeToggle />
              {/* Login/Admin Panel Button */}
              {user ? (
                <Button
                  onClick={() => (window.location.href = "/admin/dashboard")}
                  size="sm"
                  className="px-2.5 sm:px-3 md:px-4 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                >
                  <Shield className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                  <span className="sm:hidden">Panel</span>
                </Button>
              ) : (
                <Button
                  onClick={() => (window.location.href = "/auth/login")}
                  size="sm"
                  className="px-2.5 sm:px-3 md:px-4 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                >
                  <Shield className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Login</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              )}

              {/* Debug button to clear corrupted session - only visible in debug mode */}
              {user && debugMode && (
                <Button
                  onClick={async () => {
                    await clearCorruptedSession()
                    window.location.reload()
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-1 px-2 h-7 text-xs"
                  title="Clear corrupted session (debug mode)"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-3 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl lg:max-w-4xl mx-auto">
          {/* Progress Bar */}
          {currentStep <= totalSteps && (
            <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
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

          {/* Centralized Navigation */}
          {currentStep < totalSteps && (
            <div className="mt-6 sm:mt-7 md:mt-8 flex justify-between items-center gap-3">
              {(() => {
                const navConfig = getNavigationConfig()
                return (
                  <>
                    {navConfig.showBack ? (
                      <Button
                        onClick={handlePrevious}
                        variant="outline"
                        size="sm"
                        className="px-3 sm:px-4 md:px-6 h-9 sm:h-10 md:h-11 text-sm bg-transparent"
                      >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Back
                      </Button>
                    ) : (
                      <div />
                    )}

                    {navConfig.showContinue && (
                      <Button
                        onClick={handleNext}
                        disabled={navConfig.continueDisabled}
                        size="sm"
                        className="px-3 sm:px-4 md:px-6 h-9 sm:h-10 md:h-11 text-sm"
                      >
                        Continue
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* Submit Button for Final Step */}
          {currentStep === totalSteps && (
            <div className="mt-8 text-center">
              <Button
                onClick={submitSurvey}
                disabled={isSubmitting || submitted}
                size="lg"
                className="px-12 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Submitting Survey...
                  </>
                ) : (
                  <>
                    Submit Survey
                    <Check className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 font-medium">❌ {error}</p>
                  <Button variant="outline" size="sm" onClick={() => setError(null)} className="mt-2">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isSubmitting} message="Submitting survey..." />
    </div>
  )
}
