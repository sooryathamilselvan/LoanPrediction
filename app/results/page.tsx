"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoanResultsDashboard } from "@/components/loan-results-dashboard"

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedResults = sessionStorage.getItem("loanPredictionResult")

    if (!storedResults) {
      // Redirect back to form if no results found
      router.push("/")
      return
    }

    try {
      const parsedResults = JSON.parse(storedResults)
      setResults(parsedResults)
    } catch (error) {
      console.error("Error parsing results:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <LoanResultsDashboard results={results} />
    </div>
  )
}
