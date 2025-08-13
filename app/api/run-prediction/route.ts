import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const inputData = await request.json()

    return new Promise((resolve) => {
      // Path to the Python script
      const scriptPath = path.join(process.cwd(), "scripts", "loan_prediction.py")

      // Spawn Python process
      const pythonProcess = spawn("python3", [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      })

      let outputData = ""
      let errorData = ""

      // Send input data to Python script
      pythonProcess.stdin.write(JSON.stringify(inputData))
      pythonProcess.stdin.end()

      // Collect output
      pythonProcess.stdout.on("data", (data) => {
        outputData += data.toString()
      })

      // Collect errors
      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString()
      })

      // Handle process completion
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python script error:", errorData)
          resolve(NextResponse.json({ error: "Prediction service failed", details: errorData }, { status: 500 }))
          return
        }

        try {
          const result = JSON.parse(outputData.trim())
          if (result.error) {
            resolve(NextResponse.json({ error: result.error }, { status: 500 }))
          } else {
            resolve(NextResponse.json(result))
          }
        } catch (parseError) {
          console.error("Failed to parse Python output:", outputData)
          resolve(NextResponse.json({ error: "Invalid prediction response" }, { status: 500 }))
        }
      })

      // Handle process errors
      pythonProcess.on("error", (error) => {
        console.error("Failed to start Python process:", error)
        resolve(NextResponse.json({ error: "Failed to start prediction service" }, { status: 500 }))
      })
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
