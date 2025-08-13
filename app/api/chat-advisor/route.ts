import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { question, userContext } = await request.json()

    const prompt = `
    You are a helpful loan advisor for Indian banking. User context:
    - Income: ₹${userContext?.income || "Not provided"}
    - Credit History: ${userContext?.creditHistory || "Not provided"}
    - Employment: ${userContext?.employment || "Not provided"}
    
    User question: ${question}
    
    Provide helpful, accurate advice about loans and banking in India. Keep responses concise and actionable.
    `

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
      maxTokens: 200,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Chat advisor error:", error)
    return NextResponse.json({ error: "Failed to get advice" }, { status: 500 })
  }
}
