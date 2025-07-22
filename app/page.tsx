"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, Check, Shield } from "lucide-react"
//import { env } from "@/lib/env"

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
  email: string
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
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    email: "",
  })

  const totalSteps = 11

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRoleSelect = (role: string) => {
    setSurveyData({ ...surveyData, role })
  }

  const handleCompanySelect = (company_type: string) => {
    setSurveyData({ ...surveyData, company_type })
  }

  const handleChallengeChange = (main_challenge: string) => {
    setSurveyData({ ...surveyData, main_challenge })
  }

  const handleToolToggle = (tool: string) => {
    const updatedTools = surveyData.daily_tools.includes(tool)
      ? surveyData.daily_tools.filter((t) => t !== tool)
      : [...surveyData.daily_tools, tool]
    setSurveyData({ ...surveyData, daily_tools: updatedTools })
  }

  const handleLearningToggle = (method: string) => {
    const updatedMethods = surveyData.learning_methods.includes(method)
      ? surveyData.learning_methods.filter((m) => m !== method)
      : [...surveyData.learning_methods, method]
    setSurveyData({ ...surveyData, learning_methods: updatedMethods })
  }

  const handleEmailChange = (email: string) => {
    setSurveyData({ ...surveyData, email })
  }

  const handleSenioritySelect = (seniority: string) => {
    setSurveyData({ ...surveyData, seniority })
  }

  const handleCompanySizeSelect = (company_size: string) => {
    setSurveyData({ ...surveyData, company_size })
  }

  const handleIndustrySelect = (industry: string) => {
    setSurveyData({ ...surveyData, industry })
  }

  const handleProductTypeSelect = (product_type: string) => {
    setSurveyData({ ...surveyData, product_type })
  }

  const handleCustomerSegmentSelect = (customer_segment: string) => {
    setSurveyData({ ...surveyData, customer_segment })
  }

  const handleOtherRoleChange = (other_role: string) => {
    setSurveyData({ ...surveyData, other_role })
  }

  const handleOtherToolChange = (other_tool: string) => {
    setSurveyData({ ...surveyData, other_tool })
  }

  const isValidEmail = (email: string) => {
    return email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return surveyData.role !== "" && (surveyData.role !== "Other" || surveyData.other_role.trim() !== "")
      case 1:
        return surveyData.seniority !== ""
      case 2:
        return surveyData.company_size !== ""
      case 3:
        return surveyData.industry !== ""
      case 4:
        return surveyData.product_type !== ""
      case 5:
        return surveyData.customer_segment !== ""
      case 6:
        return surveyData.main_challenge.trim() !== ""
      case 7:
        return (
          surveyData.daily_tools.length > 0 &&
          (!surveyData.daily_tools.includes("Other") || surveyData.other_tool.trim() !== "")
        )
      case 8:
        return surveyData.learning_methods.length > 0
      case 9:
        return isValidEmail(surveyData.email)
      default:
        return true
    }
  }

  /*const submitSurvey = async () => {
    setIsSubmitting(true)
    try {
      // Process tools array to include custom tool
      let finalTools = [...surveyData.daily_tools]
      if (surveyData.daily_tools.includes("Other") && surveyData.other_tool.trim()) {
        finalTools = finalTools.filter((tool) => tool !== "Other")
        finalTools.push(surveyData.other_tool.trim())
      }

      const payload = {
        role: surveyData.role,
        other_role: surveyData.role === "Other" ? surveyData.other_role : null,
        seniority: surveyData.seniority,
        company_type: surveyData.company_size,
        company_size: surveyData.company_size,
        industry: surveyData.industry,
        product_type: surveyData.product_type,
        customer_segment: surveyData.customer_segment,
        main_challenge: surveyData.main_challenge,
        daily_tools: finalTools,
        learning_methods: surveyData.learning_methods,
        email: surveyData.email || null,
        created_at: new Date().toISOString(),
      }

      console.log("Submitting payload:", payload)

      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/pc_survey_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        console.log("Survey submitted successfully")
        handleNext()
      } else {
        const errorText = await response.text()
        console.error("Failed to submit survey:", response.status, errorText)
        alert(`Failed to submit survey: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error("Error submitting survey:", error)
      alert("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  */
  
  //Submit local
  const submitSurvey = () => {
  try {
    const existing = JSON.parse(localStorage.getItem("survey") || "[]")
    const updated = [...existing, { ...surveyData, created_at: new Date().toISOString() }]
    localStorage.setItem("survey", JSON.stringify(updated))
    console.log("✅ Survey saved to localStorage:", updated)

    handleNext()
  } catch (error) {
    console.error("❌ Error saving to localStorage:", error)
    alert("Error saving survey locally.")
  }
}

  const renderQuestion = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What's your current role?</h2>
              <p className="text-lg text-gray-600">Help us understand your background</p>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.role === role
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-medium">{role}</span>
                </button>
              ))}
            </div>
            {surveyData.role === "Other" && (
              <div className="max-w-md mx-auto mt-4">
                <Input
                  value={surveyData.other_role}
                  onChange={(e) => handleOtherRoleChange(e.target.value)}
                  placeholder="Please specify your role..."
                  className="text-lg p-4 h-14 rounded-2xl border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )

      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What's your seniority level?</h2>
              <p className="text-lg text-gray-600">Help us understand your experience</p>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {seniorityOptions.map((seniority) => (
                <button
                  key={seniority}
                  onClick={() => handleSenioritySelect(seniority)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.seniority === seniority
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-medium">{seniority}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What type of company do you work for?</h2>
              <p className="text-lg text-gray-600">Tell us about your company size and stage</p>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {companySizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => handleCompanySizeSelect(size)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.company_size === size
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-medium">{size}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What industry do you work in?</h2>
              <p className="text-lg text-gray-600">Help us understand your market</p>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {industryOptions.map((industry) => (
                <button
                  key={industry}
                  onClick={() => handleIndustrySelect(industry)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.industry === industry
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-medium">{industry}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What type of product do you work on?</h2>
              <p className="text-lg text-gray-600">Tell us about your product category</p>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {productTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => handleProductTypeSelect(type)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.product_type === type
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-medium">{type}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What's your customer segment?</h2>
              <p className="text-lg text-gray-600">Who do you build products for?</p>
            </div>
            <div className="grid gap-3 max-w-md mx-auto">
              {customerSegmentOptions.map((segment) => (
                <button
                  key={segment}
                  onClick={() => handleCustomerSegmentSelect(segment)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.customer_segment === segment
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-medium">{segment}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What's your main product-related challenge?</h2>
              <p className="text-lg text-gray-600">Share what you're struggling with most</p>
            </div>
            <div className="max-w-lg mx-auto">
              <Textarea
                value={surveyData.main_challenge}
                onChange={(e) => handleChallengeChange(e.target.value)}
                placeholder="Describe your biggest challenge in product management, design, or development..."
                className="min-h-32 text-lg p-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 resize-none bg-transparent text-slate-500"
              />
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">What tools do you use daily?</h2>
              <p className="text-lg text-gray-600">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              {toolOptions.map((tool) => (
                <button
                  key={tool}
                  onClick={() => handleToolToggle(tool)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.daily_tools.includes(tool)
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{tool}</span>
                    {surveyData.daily_tools.includes(tool) && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>
            {surveyData.daily_tools.includes("Other") && (
              <div className="max-w-md mx-auto mt-4">
                <Input
                  value={surveyData.other_tool}
                  onChange={(e) => handleOtherToolChange(e.target.value)}
                  placeholder="Please specify the tool..."
                  className="text-lg p-4 h-14 rounded-2xl border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )

      case 8:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">How do you learn about product?</h2>
              <p className="text-lg text-gray-600">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {learningOptions.map((method) => (
                <button
                  key={method}
                  onClick={() => handleLearningToggle(method)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 ${
                    surveyData.learning_methods.includes(method)
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{method}</span>
                    {surveyData.learning_methods.includes(method) && <Check className="w-5 h-5 text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">Your email</h2>
              <p className="text-lg text-gray-600">Optional - only if you'd like us to follow up</p>
            </div>
            <div className="max-w-md mx-auto">
              <Input
                type="email"
                value={surveyData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="your@email.com"
                className={`text-lg p-4 h-14 rounded-2xl border-2 bg-transparent text-slate-500 ${
                  !isValidEmail(surveyData.email)
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {!isValidEmail(surveyData.email) && (
                <p className="text-red-500 text-sm mt-2">Please enter a valid email address</p>
              )}
            </div>
          </div>
        )

      case 10:
        return (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900">Thank you!</h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Your responses help us build better products and create more valuable content for the product community.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Admin Login Button */}
      <div className="fixed top-4 right-4 z-10">
        <Button
          onClick={() => window.open("/auth/login", "_blank")}
          variant="outline"
          size="sm"
          className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white/90 text-slate-600"
        >
          <Shield className="w-4 h-4 mr-2" />
          Admin Login
        </Button>
      </div>

      <Card className="w-full max-w-2xl bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
        <CardContent className="p-8 md:p-12">
          {/* Progress bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">
                {currentStep < totalSteps - 1 ? `${currentStep + 1} of ${totalSteps - 1}` : "Complete"}
              </span>
              <span className="text-sm font-medium text-gray-500">
                {Math.round(((currentStep + 1) / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Question content */}
          <div className="mb-12">{renderQuestion()}</div>

          {/* Navigation buttons */}
          {currentStep < totalSteps - 1 && (
            <div className="flex justify-between items-center">
              <Button
                variant="primary"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep === 9 ? (
                <Button
                  onClick={submitSurvey}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-2xl disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-2xl disabled:opacity-50"
                >
                  Next
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
