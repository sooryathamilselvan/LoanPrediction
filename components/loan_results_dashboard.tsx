"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Building2,
  Phone,
  Globe,
  Clock,
  Percent,
  IndianRupee,
  Users,
  FileText,
  ArrowLeft,
  Award,
  Lightbulb,
  Brain,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface LoanResults {
  prediction: number
  probability: number
  applicantData: {
    name: string
    age: number
    totalIncome: number
    loanAmount: number
    loanTerm: number
    creditHistory: number
    propertyArea: string
    loanPurpose: string
  }
  metrics: {
    loanToIncomeRatio: number
    monthlyEMI: number
    emiToIncomeRatio: number
  }
  bankRecommendations: Array<{
    bankId: string
    bankName: string
    bankType: string
    matchScore: number
    eligibilityStatus: string
    reasons: string[]
    improvements: string[]
    estimatedInterestRate: number
    estimatedEMI: number
    processingTime: string
    customerCare: string
    website: string
    specialPrograms: string[]
    digitalServices: string[]
  }>
}

interface LoanResultsDashboardProps {
  results: LoanResults
}

export function LoanResultsDashboard({ results }: LoanResultsDashboardProps) {
  const router = useRouter()
  const [aiInsights, setAiInsights] = useState<string>("")
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [chatQuestion, setChatQuestion] = useState("")
  const [chatResponse, setChatResponse] = useState("")
  const [loadingChat, setLoadingChat] = useState(false)

  useEffect(() => {
    fetchAiInsights()
  }, [])

  const fetchAiInsights = async () => {
    setLoadingInsights(true)
    try {
      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: {
            applicantIncome: results.applicantData.totalIncome,
            creditHistory: results.applicantData.creditHistory,
            loanAmount: results.applicantData.loanAmount,
            selfEmployed: false,
            propertyArea: results.applicantData.propertyArea,
          },
          prediction: {
            approved: results.prediction === 1,
            confidence: results.probability,
          },
          bankRecommendations: {
            eligible: results.bankRecommendations.filter(
              (b) => b.eligibilityStatus === "Highly Eligible" || b.eligibilityStatus === "Eligible",
            ),
          },
        }),
      })
      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      console.error("Failed to fetch AI insights:", error)
      setAiInsights("Unable to generate insights at this time.")
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatQuestion.trim()) return

    setLoadingChat(true)
    try {
      const response = await fetch("/api/chat-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: chatQuestion,
          userContext: {
            income: results.applicantData.totalIncome,
            creditHistory: results.applicantData.creditHistory === 1 ? "Good" : "Poor",
            employment: "Employed",
          },
        }),
      })
      const data = await response.json()
      setChatResponse(data.response)
      setChatQuestion("")
    } catch (error) {
      console.error("Failed to get chat response:", error)
      setChatResponse("Sorry, I couldn't process your question right now.")
    } finally {
      setLoadingChat(false)
    }
  }

  const getPredictionStatus = () => {
    if (results.prediction === 1) {
      return {
        status: "Approved",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      }
    } else {
      return {
        status: "Needs Review",
        icon: AlertCircle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      }
    }
  }

  const getEligibilityColor = (status: string) => {
    switch (status) {
      case "Highly Eligible":
        return "bg-green-100 text-green-800 border-green-200"
      case "Eligible":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Conditionally Eligible":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-red-100 text-red-800 border-red-200"
    }
  }

  const getEligibilityIcon = (status: string) => {
    switch (status) {
      case "Highly Eligible":
        return <CheckCircle className="h-4 w-4" />
      case "Eligible":
        return <CheckCircle className="h-4 w-4" />
      case "Conditionally Eligible":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <XCircle className="h-4 w-4" />
    }
  }

  const predictionInfo = getPredictionStatus()
  const PredictionIcon = predictionInfo.icon

  const eligibleBanks = results.bankRecommendations.filter(
    (bank) => bank.eligibilityStatus === "Highly Eligible" || bank.eligibilityStatus === "Eligible",
  )

  const conditionalBanks = results.bankRecommendations.filter(
    (bank) => bank.eligibilityStatus === "Conditionally Eligible",
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Analysis Results</h1>
          <p className="text-gray-600">Comprehensive analysis for {results.applicantData.name}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          New Application
        </Button>
      </div>

      {/* Prediction Summary */}
      <Card className={`mb-8 ${predictionInfo.bgColor} ${predictionInfo.borderColor} border-2`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <PredictionIcon className={`h-8 w-8 ${predictionInfo.color}`} />
            <div>
              <CardTitle className={`text-2xl ${predictionInfo.color}`}>Loan {predictionInfo.status}</CardTitle>
              <CardDescription className="text-lg">
                Confidence: {Math.round(results.probability * 100)}%
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ₹{results.applicantData.loanAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Loan Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">₹{results.metrics.monthlyEMI.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Monthly EMI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{results.metrics.emiToIncomeRatio}%</div>
              <div className="text-sm text-gray-600">EMI to Income</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{results.applicantData.loanTerm} months</div>
              <div className="text-sm text-gray-600">Loan Term</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Card */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="h-6 w-6" />
            AI-Powered Financial Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your profile and current market conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInsights ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your profile...
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-gray-700">{aiInsights}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Bank Recommendations ({eligibleBanks.length})</TabsTrigger>
          <TabsTrigger value="conditional">Conditional ({conditionalBanks.length})</TabsTrigger>
          <TabsTrigger value="profile">Your Profile</TabsTrigger>
          <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
        </TabsList>

        {/* Bank Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6">
            {eligibleBanks.length > 0 ? (
              eligibleBanks.map((bank) => (
                <Card key={bank.bankId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-xl">{bank.bankName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant="secondary">{bank.bankType}</Badge>
                            <Badge className={getEligibilityColor(bank.eligibilityStatus)}>
                              {getEligibilityIcon(bank.eligibilityStatus)}
                              {bank.eligibilityStatus}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{bank.matchScore}%</div>
                        <div className="text-sm text-gray-600">Match Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-semibold">{bank.estimatedInterestRate}%</div>
                          <div className="text-sm text-gray-600">Interest Rate</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-semibold">₹{bank.estimatedEMI.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Monthly EMI</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-semibold">{bank.processingTime}</div>
                          <div className="text-sm text-gray-600">Processing Time</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Why You're Eligible
                        </h4>
                        <ul className="space-y-1">
                          {bank.reasons.map((reason, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {bank.specialPrograms.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Special Programs
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {bank.specialPrograms.map((program, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {program}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-4 text-sm">
                      <a
                        href={bank.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="h-4 w-4" />
                        Visit Website
                      </a>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {bank.customerCare}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Direct Matches Found</h3>
                  <p className="text-gray-600 mb-4">
                    Based on your current profile, you may need to improve certain criteria to qualify for loans.
                  </p>
                  <Button onClick={() => document.querySelector('[value="conditional"]')?.click()}>
                    View Conditional Options
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Conditional Recommendations Tab */}
        <TabsContent value="conditional" className="space-y-6">
          <div className="grid gap-6">
            {conditionalBanks.length > 0 ? (
              conditionalBanks.map((bank) => (
                <Card key={bank.bankId} className="border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-yellow-600" />
                        <div>
                          <CardTitle className="text-xl">{bank.bankName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant="secondary">{bank.bankType}</Badge>
                            <Badge className={getEligibilityColor(bank.eligibilityStatus)}>
                              {getEligibilityIcon(bank.eligibilityStatus)}
                              {bank.eligibilityStatus}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-600">{bank.matchScore}%</div>
                        <div className="text-sm text-gray-600">Match Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-semibold">{bank.estimatedInterestRate}%</div>
                          <div className="text-sm text-gray-600">Interest Rate</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-semibold">₹{bank.estimatedEMI.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Monthly EMI</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-semibold">{bank.processingTime}</div>
                          <div className="text-sm text-gray-600">Processing Time</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {bank.improvements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Improvements Needed
                        </h4>
                        <ul className="space-y-1">
                          {bank.improvements.map((improvement, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Separator />

                    <div className="flex flex-wrap gap-4 text-sm">
                      <a
                        href={bank.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="h-4 w-4" />
                        Visit Website
                      </a>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {bank.customerCare}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Great Profile!</h3>
                  <p className="text-gray-600">
                    You meet the criteria for most banks. Check the recommendations tab for your best options.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{results.applicantData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-semibold">{results.applicantData.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Income:</span>
                  <span className="font-semibold">₹{results.applicantData.totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit History:</span>
                  <Badge
                    className={
                      results.applicantData.creditHistory === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {results.applicantData.creditHistory === 1 ? "Good" : "Poor"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Area:</span>
                  <span className="font-semibold">{results.applicantData.propertyArea}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Amount:</span>
                  <span className="font-semibold">₹{results.applicantData.loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Term:</span>
                  <span className="font-semibold">{results.applicantData.loanTerm} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="font-semibold">{results.applicantData.loanPurpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly EMI:</span>
                  <span className="font-semibold">₹{results.metrics.monthlyEMI.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">EMI to Income Ratio:</span>
                  <span className="font-semibold">{results.metrics.emiToIncomeRatio}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Financial Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>EMI to Income Ratio</span>
                    <span>{results.metrics.emiToIncomeRatio}%</span>
                  </div>
                  <Progress value={Math.min(results.metrics.emiToIncomeRatio, 100)} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">
                    {results.metrics.emiToIncomeRatio <= 40
                      ? "Excellent"
                      : results.metrics.emiToIncomeRatio <= 50
                        ? "Good"
                        : "Needs Improvement"}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Loan to Income Ratio</span>
                    <span>{results.metrics.loanToIncomeRatio}</span>
                  </div>
                  <Progress value={Math.min(results.metrics.loanToIncomeRatio * 10, 100)} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">
                    {results.metrics.loanToIncomeRatio <= 5
                      ? "Excellent"
                      : results.metrics.loanToIncomeRatio <= 8
                        ? "Good"
                        : "High Risk"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Advisor Tab */}
        <TabsContent value="advisor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Ask Your AI Loan Advisor
              </CardTitle>
              <CardDescription>
                Get personalized advice about loans, banking, and improving your financial profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Ask about loan terms, interest rates, eligibility requirements..."
                  className="flex-1"
                />
                <Button type="submit" disabled={loadingChat || !chatQuestion.trim()}>
                  {loadingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>

              {chatResponse && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-line text-gray-700">{chatResponse}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 className="font-semibold mb-2">Quick Questions:</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatQuestion("How can I improve my credit score?")}
                      className="w-full justify-start text-left"
                    >
                      How can I improve my credit score?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatQuestion("What documents do I need for loan application?")}
                      className="w-full justify-start text-left"
                    >
                      What documents do I need?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatQuestion("How to reduce my EMI burden?")}
                      className="w-full justify-start text-left"
                    >
                      How to reduce my EMI burden?
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Loan Tips:</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatQuestion("What's the difference between fixed and floating rates?")}
                      className="w-full justify-start text-left"
                    >
                      Fixed vs Floating rates?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatQuestion("Should I prepay my loan?")}
                      className="w-full justify-start text-left"
                    >
                      Should I prepay my loan?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChatQuestion("How to negotiate better loan terms?")}
                      className="w-full justify-start text-left"
                    >
                      How to negotiate better terms?
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
