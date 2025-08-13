import { type NextRequest, NextResponse } from "next/server"
import { getTopRecommendations, type UserProfile } from "@/lib/bank-recommendation-engine"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Validate required fields
    const requiredFields = [
      "gender",
      "maritalStatus",
      "dependents",
      "education",
      "selfEmployed",
      "applicantIncome",
      "loanAmount",
      "loanTerm",
      "creditHistory",
      "propertyArea",
    ]

    for (const field of requiredFields) {
      if (!formData[field] && formData[field] !== "0") {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Prepare data for Python script
    const predictionData = {
      Gender: formData.gender,
      Married: formData.maritalStatus === "Married" ? "Yes" : "No",
      Dependents: formData.dependents,
      Education: formData.education,
      Self_Employed: formData.selfEmployed,
      ApplicantIncome: Number.parseFloat(formData.applicantIncome),
      CoapplicantIncome: Number.parseFloat(formData.coapplicantIncome || "0"),
      LoanAmount: Number.parseFloat(formData.loanAmount),
      Loan_Amount_Term: Number.parseFloat(formData.loanTerm),
      Credit_History: Number.parseFloat(formData.creditHistory),
      Property_Area: formData.propertyArea,
    }

    // Call Python prediction script
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/run-prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(predictionData),
    })

    if (!response.ok) {
      throw new Error("Prediction service failed")
    }

    const predictionResult = await response.json()

    // Calculate additional metrics
    const totalIncome = predictionData.ApplicantIncome + predictionData.CoapplicantIncome
    const loanToIncomeRatio = (predictionData.LoanAmount * 1000) / (totalIncome * 12) // Convert to annual
    const monthlyEMI = calculateEMI(predictionData.LoanAmount * 1000, 8.5, predictionData.Loan_Amount_Term)
    const emiToIncomeRatio = (monthlyEMI / totalIncome) * 100

    const userProfile: UserProfile = {
      age: Number.parseInt(formData.age) || 30,
      income: predictionData.ApplicantIncome,
      coapplicantIncome: predictionData.CoapplicantIncome,
      creditHistory: predictionData.Credit_History,
      selfEmployed: formData.selfEmployed === "Yes",
      propertyArea: predictionData.Property_Area,
      loanAmount: predictionData.LoanAmount * 1000, // Convert to actual amount
      loanTerm: predictionData.Loan_Amount_Term,
      loanType: determineLoanType(formData.loanPurpose),
    }

    const bankRecommendations = getTopRecommendations(userProfile, 8)

    return NextResponse.json({
      prediction: predictionResult.prediction,
      probability: predictionResult.probability,
      applicantData: {
        name: formData.fullName,
        age: userProfile.age,
        totalIncome,
        loanAmount: predictionData.LoanAmount,
        loanTerm: predictionData.Loan_Amount_Term,
        creditHistory: predictionData.Credit_History,
        propertyArea: predictionData.Property_Area,
        loanPurpose: formData.loanPurpose,
      },
      metrics: {
        loanToIncomeRatio: Math.round(loanToIncomeRatio * 100) / 100,
        monthlyEMI: Math.round(monthlyEMI),
        emiToIncomeRatio: Math.round(emiToIncomeRatio * 100) / 100,
      },
      bankRecommendations: bankRecommendations.map((rec) => ({
        bankId: rec.bank.id,
        bankName: rec.bank.name,
        bankType: rec.bank.type,
        matchScore: rec.matchScore,
        eligibilityStatus: rec.eligibilityStatus,
        reasons: rec.reasons,
        improvements: rec.improvements,
        estimatedInterestRate: rec.estimatedInterestRate,
        estimatedEMI: rec.estimatedEMI,
        processingTime: rec.bank.homeLoanCriteria.processingTime,
        customerCare: rec.bank.customerCare,
        website: rec.bank.website,
        specialPrograms: rec.bank.specialPrograms,
        digitalServices: rec.bank.digitalServices,
      })),
    })
  } catch (error) {
    console.error("Prediction API error:", error)
    return NextResponse.json({ error: "Failed to process prediction request" }, { status: 500 })
  }
}

// Calculate EMI using standard formula
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / (12 * 100)
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  return emi
}

function determineLoanType(loanPurpose: string): UserProfile["loanType"] {
  if (!loanPurpose) return "home"

  const purpose = loanPurpose.toLowerCase()
  if (purpose.includes("home") || purpose.includes("house") || purpose.includes("property")) {
    return "home"
  } else if (purpose.includes("business") || purpose.includes("commercial")) {
    return "business"
  } else {
    return "personal"
  }
}
