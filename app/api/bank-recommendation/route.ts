import { type NextRequest, NextResponse } from "next/server"
import { getRecommendedBanks, getEligibleBanks, type UserProfile } from "@/lib/bank-recommendation-engine"

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    // Validate required fields
    const requiredFields = ["age", "income", "loanAmount", "loanTerm", "creditHistory", "propertyArea"]

    for (const field of requiredFields) {
      if (userData[field] === undefined || userData[field] === null) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const userProfile: UserProfile = {
      age: Number.parseInt(userData.age),
      income: Number.parseFloat(userData.income),
      coapplicantIncome: Number.parseFloat(userData.coapplicantIncome || "0"),
      creditHistory: Number.parseFloat(userData.creditHistory),
      selfEmployed: userData.selfEmployed === "Yes" || userData.selfEmployed === true,
      propertyArea: userData.propertyArea,
      loanAmount: Number.parseFloat(userData.loanAmount),
      loanTerm: Number.parseFloat(userData.loanTerm),
      loanType: userData.loanType || "home",
    }

    // Get all recommendations
    const allRecommendations = getRecommendedBanks(userProfile)

    // Get only eligible banks
    const eligibleRecommendations = getEligibleBanks(userProfile)

    // Categorize recommendations
    const highlyEligible = allRecommendations.filter((rec) => rec.eligibilityStatus === "Highly Eligible")
    const eligible = allRecommendations.filter((rec) => rec.eligibilityStatus === "Eligible")
    const conditionallyEligible = allRecommendations.filter((rec) => rec.eligibilityStatus === "Conditionally Eligible")
    const notEligible = allRecommendations.filter((rec) => rec.eligibilityStatus === "Not Eligible")

    // Generate improvement suggestions
    const improvementSuggestions = generateImprovementSuggestions(userProfile, allRecommendations)

    return NextResponse.json({
      userProfile,
      summary: {
        totalBanks: allRecommendations.length,
        highlyEligibleCount: highlyEligible.length,
        eligibleCount: eligible.length,
        conditionallyEligibleCount: conditionallyEligible.length,
        notEligibleCount: notEligible.length,
      },
      recommendations: {
        all: allRecommendations.map(formatRecommendation),
        highlyEligible: highlyEligible.map(formatRecommendation),
        eligible: eligible.map(formatRecommendation),
        conditionallyEligible: conditionallyEligible.map(formatRecommendation),
        notEligible: notEligible.map(formatRecommendation),
      },
      improvementSuggestions,
    })
  } catch (error) {
    console.error("Bank recommendation API error:", error)
    return NextResponse.json({ error: "Failed to generate bank recommendations" }, { status: 500 })
  }
}

function formatRecommendation(rec: any) {
  return {
    bankId: rec.bank.id,
    bankName: rec.bank.name,
    bankType: rec.bank.type,
    matchScore: rec.matchScore,
    eligibilityStatus: rec.eligibilityStatus,
    reasons: rec.reasons,
    improvements: rec.improvements,
    estimatedInterestRate: rec.estimatedInterestRate,
    estimatedEMI: rec.estimatedEMI,
    bankDetails: {
      established: rec.bank.established,
      headquarters: rec.bank.headquarters,
      website: rec.bank.website,
      customerCare: rec.bank.customerCare,
      branches: rec.bank.branches,
      rating: rec.bank.rating,
      specialPrograms: rec.bank.specialPrograms,
      strengths: rec.bank.strengths,
      digitalServices: rec.bank.digitalServices,
    },
    loanDetails: {
      processingTime: rec.bank.homeLoanCriteria.processingTime,
      interestRateRange: rec.bank.homeLoanCriteria.interestRateRange,
      maxLoanAmount: rec.bank.homeLoanCriteria.maxLoanAmount,
      requiredDocuments: rec.bank.homeLoanCriteria.requiredDocuments,
    },
  }
}

function generateImprovementSuggestions(userProfile: UserProfile, recommendations: any[]): string[] {
  const suggestions: string[] = []
  const totalIncome = userProfile.income + userProfile.coapplicantIncome

  // Analyze common improvement areas
  const allImprovements = recommendations.flatMap((rec) => rec.improvements)
  const improvementCounts = allImprovements.reduce(
    (acc, improvement) => {
      acc[improvement] = (acc[improvement] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Sort by frequency and add top suggestions
  const sortedImprovements = Object.entries(improvementCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([improvement]) => improvement)

  suggestions.push(...sortedImprovements)

  // Add specific suggestions based on user profile
  if (userProfile.creditHistory === 0) {
    suggestions.push("Build credit history by taking a small loan or credit card and repaying on time")
  }

  if (totalIncome < 30000) {
    suggestions.push("Consider adding a co-applicant to increase total household income")
  }

  const emiRatio = ((userProfile.loanAmount * 0.008) / totalIncome) * 100 // Rough EMI calculation
  if (emiRatio > 40) {
    suggestions.push("Consider reducing loan amount or increasing loan tenure to improve EMI-to-income ratio")
  }

  return [...new Set(suggestions)] // Remove duplicates
}
