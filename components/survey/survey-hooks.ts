import { useState, useEffect } from "react"
import type { SurveyData } from "@/lib/types"

export function useSurveyData() {
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
    salary_currency: "ARS",
    salary_min: "",
    salary_max: "",
    salary_average: "",
    email: "",
  })

  const [otherRole, setOtherRole] = useState("")
  const [otherTool, setOtherTool] = useState("")

  // Smart persistence helper function - only persist draft data, not submitted data
  const persistSurveyData = (data: SurveyData, submitted: boolean) => {
    try {
      if (typeof window !== "undefined" && !submitted) {
        const draftData = {
          ...data,
          _lastModified: Date.now(),
          _isDraft: true
        }
        localStorage.setItem("survey_data", JSON.stringify(draftData))
      }
    } catch (error) {
      console.warn("Failed to persist survey data:", error)
    }
  }

  const persistStep = (step: number, submitted: boolean) => {
    try {
      if (typeof window !== "undefined" && !submitted) {
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
      }
    } catch (error) {
      console.warn("Failed to clear persisted data:", error)
    }
  }

  const loadPersistedData = (submitted: boolean) => {
    try {
      if (typeof window !== "undefined" && !submitted) {
        const persistedData = localStorage.getItem("survey_data")
        if (persistedData) {
          const parsedData = JSON.parse(persistedData)
          
          const isStale = parsedData._lastModified && (Date.now() - parsedData._lastModified > 24 * 60 * 60 * 1000)
          const isDraft = parsedData._isDraft === true
          
          if (isStale) {
            console.log("📊 Persisted data is stale, clearing...")
            localStorage.removeItem("survey_data")
            localStorage.removeItem("survey_step")
            return null
          } else if (isDraft) {
            const { _lastModified, _isDraft, ...cleanData } = parsedData
            setSurveyData(cleanData)
            
            if (cleanData.other_role) {
              setOtherRole(cleanData.other_role)
            }
            if (cleanData.other_tool) {
              setOtherTool(cleanData.other_tool)
            }
            
            console.log("📊 Survey data restored from localStorage (draft)")
            return cleanData
          } else {
            console.log("📊 Persisted data is not a draft, clearing...")
            localStorage.removeItem("survey_data")
            localStorage.removeItem("survey_step")
            return null
          }
        }
      }
    } catch (parseError) {
      console.warn("Failed to parse persisted survey data:", parseError)
      localStorage.removeItem("survey_data")
      localStorage.removeItem("survey_step")
    }
    return null
  }

  return {
    surveyData,
    setSurveyData,
    otherRole,
    setOtherRole,
    otherTool,
    setOtherTool,
    persistSurveyData,
    persistStep,
    clearPersistedData,
    loadPersistedData,
  }
}