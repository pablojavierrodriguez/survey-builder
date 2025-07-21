"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Save, Eye, EyeOff, AlertCircle } from "lucide-react"

interface SurveyQuestion {
  id: string
  type: "single-choice" | "multiple-choice" | "text" | "email"
  title: string
  description: string
  options?: string[]
  required: boolean
  order: number
  isVisible: boolean
}

interface SurveyConfig {
  title: string
  description: string
  thankYouMessage: string
  questions: SurveyQuestion[]
  isActive: boolean
}

const defaultQuestions: SurveyQuestion[] = [
  {
    id: "1",
    type: "single-choice",
    title: "What's your current role?",
    description: "Help us understand your background",
    options: [
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
    ],
    required: true,
    order: 1,
    isVisible: true,
  },
  {
    id: "2",
    type: "single-choice",
    title: "What's your seniority level?",
    description: "Help us understand your experience",
    options: [
      "Junior (0-2 years)",
      "Mid-level (2-5 years)",
      "Senior (5-8 years)",
      "Staff/Principal (8+ years)",
      "Manager/Lead",
      "Director/VP",
      "C-level/Founder",
    ],
    required: true,
    order: 2,
    isVisible: true,
  },
  {
    id: "3",
    type: "single-choice",
    title: "What type of company do you work for?",
    description: "Tell us about your company size and stage",
    options: [
      "Early-stage Startup (Pre-seed/Seed)",
      "Growth-stage Startup (Series A-C)",
      "Scale-up (Series D+)",
      "SME (Small/Medium Enterprise)",
      "Large Corporate (1000+ employees)",
      "Enterprise (10,000+ employees)",
      "Consultancy/Agency",
      "Freelance/Independent",
    ],
    required: true,
    order: 3,
    isVisible: true,
  },
  {
    id: "4",
    type: "single-choice",
    title: "What industry do you work in?",
    description: "Help us understand your market",
    options: [
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
    ],
    required: true,
    order: 4,
    isVisible: true,
  },
  {
    id: "5",
    type: "single-choice",
    title: "What type of product do you work on?",
    description: "Tell us about your product category",
    options: [
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
    ],
    required: true,
    order: 5,
    isVisible: true,
  },
  {
    id: "6",
    type: "single-choice",
    title: "What's your customer segment?",
    description: "Who do you build products for?",
    options: ["B2B Product", "B2C Product", "B2B2C Product", "Internal Product", "Mixed (B2B + B2C)"],
    required: true,
    order: 6,
    isVisible: true,
  },
  {
    id: "7",
    type: "text",
    title: "What's your main product-related challenge?",
    description: "Share what you're struggling with most",
    required: true,
    order: 7,
    isVisible: true,
  },
  {
    id: "8",
    type: "multiple-choice",
    title: "What tools do you use daily?",
    description: "Select all that apply",
    options: [
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
    ],
    required: true,
    order: 8,
    isVisible: true,
  },
  {
    id: "9",
    type: "multiple-choice",
    title: "How do you learn about product?",
    description: "Select all that apply",
    options: ["Books", "Podcasts", "Courses", "Community", "Mentors", "Other"],
    required: true,
    order: 9,
    isVisible: true,
  },
  {
    id: "10",
    type: "email",
    title: "Your email",
    description: "Optional - only if you'd like us to follow up",
    required: false,
    order: 10,
    isVisible: true,
  },
]

export default function SurveyConfigPage() {
  const [config, setConfig] = useState<SurveyConfig>({
    title: "Product Community Survey",
    description: "Help us understand the product community better",
    thankYouMessage: "Thank you for your valuable feedback!",
    questions: defaultQuestions,
    isActive: true,
  })
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem("survey_config")
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)
      } catch (error) {
        console.error("Error loading survey config:", error)
      }
    }
  }, [])

  const saveConfig = () => {
    setSaveStatus("saving")
    try {
      localStorage.setItem("survey_config", JSON.stringify(config))
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("Error saving survey config:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }
  }

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      type: "text",
      title: "New Question",
      description: "Question description",
      required: true,
      order: config.questions.length + 1,
      isVisible: true,
    }
    setEditingQuestion(newQuestion)
    setIsDialogOpen(true)
  }

  const editQuestion = (question: SurveyQuestion) => {
    setEditingQuestion({ ...question })
    setIsDialogOpen(true)
  }

  const deleteQuestion = (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      const updatedQuestions = config.questions
        .filter((q) => q.id !== questionId)
        .map((q, index) => ({ ...q, order: index + 1 }))
      setConfig({ ...config, questions: updatedQuestions })
    }
  }

  const saveQuestion = () => {
    if (!editingQuestion) return

    const existingIndex = config.questions.findIndex((q) => q.id === editingQuestion.id)
    let updatedQuestions

    if (existingIndex >= 0) {
      // Update existing question
      updatedQuestions = [...config.questions]
      updatedQuestions[existingIndex] = editingQuestion
    } else {
      // Add new question
      updatedQuestions = [...config.questions, editingQuestion]
    }

    setConfig({ ...config, questions: updatedQuestions })
    setIsDialogOpen(false)
    setEditingQuestion(null)
  }

  const toggleQuestionVisibility = (questionId: string) => {
    const updatedQuestions = config.questions.map((q) => (q.id === questionId ? { ...q, isVisible: !q.isVisible } : q))
    setConfig({ ...config, questions: updatedQuestions })
  }

  const addOption = () => {
    if (!editingQuestion) return
    const newOptions = [...(editingQuestion.options || []), "New Option"]
    setEditingQuestion({ ...editingQuestion, options: newOptions })
  }

  const updateOption = (index: number, value: string) => {
    if (!editingQuestion) return
    const newOptions = [...(editingQuestion.options || [])]
    newOptions[index] = value
    setEditingQuestion({ ...editingQuestion, options: newOptions })
  }

  const removeOption = (index: number) => {
    if (!editingQuestion) return
    const newOptions = editingQuestion.options?.filter((_, i) => i !== index) || []
    setEditingQuestion({ ...editingQuestion, options: newOptions })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Survey Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage survey settings and questions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={saveConfig}
            disabled={saveStatus === "saving"}
            className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {saveStatus === "error" && (
        <Alert variant="destructive" className="dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="dark:text-red-400">
            Failed to save configuration. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Survey Settings */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-50">Survey Settings</CardTitle>
          <CardDescription className="dark:text-gray-400">Configure basic survey information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Survey Title</label>
              <Input
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="dark:bg-gray-900 dark:text-gray-50 dark:border-gray-700"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.isActive}
                onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Survey Active</label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Survey Description</label>
            <Textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="dark:bg-gray-900 dark:text-gray-50 dark:border-gray-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thank You Message</label>
            <Textarea
              value={config.thankYouMessage}
              onChange={(e) => setConfig({ ...config, thankYouMessage: e.target.value })}
              className="dark:bg-gray-900 dark:text-gray-50 dark:border-gray-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-gray-50">Survey Questions</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Manage survey questions and their visibility ({config.questions.filter((q) => q.isVisible).length} of{" "}
                {config.questions.length} visible)
              </CardDescription>
            </div>
            <Button onClick={addQuestion} className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.questions
              .sort((a, b) => a.order - b.order)
              .map((question) => (
                <div
                  key={question.id}
                  className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={question.isVisible ? "default" : "secondary"} className="text-xs">
                        {question.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                      <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-400">
                        {question.type}
                      </Badge>
                      {question.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-50 truncate">{question.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{question.description}</p>
                    {question.options && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{question.options.length} options</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleQuestionVisibility(question.id)}
                      className="dark:text-gray-50 dark:hover:bg-gray-700"
                    >
                      {question.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editQuestion(question)}
                      className="dark:text-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Question Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-50">
              {editingQuestion?.id && config.questions.find((q) => q.id === editingQuestion.id)
                ? "Edit Question"
                : "Add Question"}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Configure the question settings and options
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Type</label>
                  <Select
                    value={editingQuestion.type}
                    onValueChange={(value: any) => setEditingQuestion({ ...editingQuestion, type: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-900 dark:text-gray-50 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="single-choice" className="dark:text-gray-50">
                        Single Choice
                      </SelectItem>
                      <SelectItem value="multiple-choice" className="dark:text-gray-50">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="text" className="dark:text-gray-50">
                        Text
                      </SelectItem>
                      <SelectItem value="email" className="dark:text-gray-50">
                        Email
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingQuestion.required}
                      onCheckedChange={(checked) => setEditingQuestion({ ...editingQuestion, required: checked })}
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Required</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingQuestion.isVisible}
                      onCheckedChange={(checked) => setEditingQuestion({ ...editingQuestion, isVisible: checked })}
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visible</label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Title</label>
                <Input
                  value={editingQuestion.title}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                  className="dark:bg-gray-900 dark:text-gray-50 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Description</label>
                <Textarea
                  value={editingQuestion.description}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, description: e.target.value })}
                  className="dark:bg-gray-900 dark:text-gray-50 dark:border-gray-700"
                />
              </div>
              {(editingQuestion.type === "single-choice" || editingQuestion.type === "multiple-choice") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 bg-transparent"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {editingQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 dark:bg-gray-900 dark:text-gray-50 dark:border-gray-700"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 bg-transparent"
                >
                  Cancel
                </Button>
                <Button onClick={saveQuestion} className="dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700">
                  Save Question
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
