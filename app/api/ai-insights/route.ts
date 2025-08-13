import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userProfile, prediction, bankRecommendations } = await request.json()

    const prompt = `
    Based on this loan application profile:
    - Income: ₹${userProfile.applicantIncome}
    - Credit History: ${userProfile.creditHistory}
    - Loan Amount: ₹${userProfile.loanAmount}
    - Employment: ${userProfile.selfEmployed ? "Self-employed" : "Employed"}
    - Property Area: ${userProfile.propertyArea}
    
    Prediction: ${prediction.approved ? "Approved" : "Rejected"} (${Math.round(prediction.confidence * 100)}% confidence)
    
    Eligible Banks: ${bankRecommendations.eligible.length}
    
    Provide personalized financial advice in 3-4 bullet points to help improve their loan prospects. Be specific and actionable.
    `

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      maxTokens: 300,
    })

    return NextResponse.json({ insights: text })
  } catch (error) {
    console.error("AI Insights error:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
