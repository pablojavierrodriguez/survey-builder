"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, Eye, Settings, Edit3 } from "lucide-react"

interface SurveyQuestion {
  id: string
  type: "single-choice" | "multiple-choice" | "text" | "email"
  title: string
  description: string
  options?: string[]
  required: boolean
  order: number
}

interface SurveyConfig {
  title: string
  description: string
  thankYouMessage: string
  questions: SurveyQuestion[]
  isActive: boolean
}

export default function SurveyConfigPage() {
  const [config, setConfig] = useState<SurveyConfig>({
    title: "Product Community Survey",
    description: "Help us understand your background and challenges",
    thankYouMessage: "Thank you for your responses! Your input helps us build better products.",
    isActive: true,
    questions: [
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
          "Other",
        ],
        required: true,
        order: 1,
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
      },
    ],
  })

  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      type: "single-choice",
      title: "New Question",
      description: "Question description",
      options: ["Option 1", "Option 2"],
      required: true,
      order: config.questions.length + 1,
    }

    setConfig({
      ...config,
      questions: [...config.questions, newQuestion],
    })
    setEditingQuestion(newQuestion.id)
  }

  const updateQuestion = (questionId: string, updates: Partial<SurveyQuestion>) => {
    setConfig({
      ...config,
      questions: config.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
    })
  }

  const deleteQuestion = (questionId: string) => {
    setConfig({
      ...config,
      questions: config.questions.filter((q) => q.id !== questionId),
    })
  }

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const questions = [...config.questions]
    const index = questions.findIndex((q) => q.id === questionId)

    if (direction === "up" && index > 0) {
      ;[questions[index], questions[index - 1]] = [questions[index - 1], questions[index]]
    } else if (direction === "down" && index < questions.length - 1) {
      ;[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]
    }

    setConfig({ ...config, questions })
  }

  const saveConfig = async () => {
    setIsSaving(true)
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In production, this would save to your backend
    localStorage.setItem("survey_config", JSON.stringify(config))
    setIsSaving(false)
    alert("Survey configuration saved successfully!")
  }

  const previewSurvey = () => {
    window.open("/", "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Survey Configuration</h1>
        <div className="flex gap-2">
          <Button onClick={previewSurvey} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveConfig} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Survey Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Survey Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Survey Title</label>
              <Input
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Survey title"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={config.isActive}
                onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
              />
              <div>
                <label className="text-sm font-medium text-gray-700">Survey Active</label>
                <p className="text-xs text-gray-500">Enable/disable survey collection</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Survey description"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thank You Message</label>
            <Textarea
              value={config.thankYouMessage}
              onChange={(e) => setConfig({ ...config, thankYouMessage: e.target.value })}
              placeholder="Thank you message"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Survey Questions</CardTitle>
            <Button onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Q{index + 1}</Badge>
                    <Badge variant={question.required ? "default" : "secondary"}>
                      {question.required ? "Required" : "Optional"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {question.type.replace("-", " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveQuestion(question.id, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveQuestion(question.id, "down")}
                      disabled={index === config.questions.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingQuestion(editingQuestion === question.id ? null : question.id)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {editingQuestion === question.id ? (
                  <div className="space-y-3">
                    <Input
                      value={question.title}
                      onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                      placeholder="Question title"
                    />
                    <Input
                      value={question.description}
                      onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                      placeholder="Question description"
                    />

                    {(question.type === "single-choice" || question.type === "multiple-choice") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Options (one per line)</label>
                        <Textarea
                          value={question.options?.join("\n") || ""}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              options: e.target.value.split("\n").filter((o) => o.trim()),
                            })
                          }
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          rows={4}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={question.required}
                        onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                      />
                      <label className="text-sm text-gray-700">Required question</label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-medium text-gray-900">{question.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                    {question.options && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {question.options.slice(0, 3).map((option, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                        {question.options.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{question.options.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {config.questions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No questions configured. Click "Add Question" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
