import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert the image to binary data
    const imageBuffer = await image.arrayBuffer()

    // Call Hugging Face Inference API for facial expression recognition
    const response = await fetch("https://api-inference.huggingface.co/models/Rajaram1996/FacialEmoRecog", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/octet-stream", // Important: Send as binary data
      },
      body: imageBuffer, // Send the raw binary data
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Hugging Face API error:", error)
      return NextResponse.json({ error: "Failed to analyze expression" }, { status: 500 })
    }

    const result = await response.json()
    console.log("Hugging Face API response:", JSON.stringify(result))

    // Process the result to get the expression
    let expression = "neutral"

    try {
      // The model might return different formats, so we handle multiple possibilities
      if (Array.isArray(result)) {
        // Format: [{"label": "happy", "score": 0.9}, ...]
        if (result.length > 0) {
          // Sort by score and get the highest
          const sorted = [...result].sort((a, b) => b.score - a.score)
          if (sorted[0] && sorted[0].label) {
            expression = mapExpression(sorted[0].label)
          }
        }
      } else if (typeof result === "object" && result !== null) {
        // Format: {"happy": 0.9, "sad": 0.1, ...}
        let highestScore = 0
        for (const [emotion, score] of Object.entries(result)) {
          if (typeof score === "number" && score > highestScore) {
            highestScore = score
            expression = mapExpression(emotion)
          }
        }
      }
    } catch (err) {
      console.error("Error processing expression result:", err)
      // Fall back to neutral if we can't parse the result
    }

    return NextResponse.json({ expression })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to map model-specific emotion labels to our standardized set
function mapExpression(label: string): string {
  const lowerLabel = label.toLowerCase()

  if (lowerLabel.includes("happy") || lowerLabel.includes("joy")) {
    return "happy"
  } else if (lowerLabel.includes("sad") || lowerLabel.includes("unhappy")) {
    return "sad"
  } else if (lowerLabel.includes("angry") || lowerLabel.includes("anger")) {
    return "angry"
  } else if (lowerLabel.includes("surprise") || lowerLabel.includes("surprised")) {
    return "surprised"
  } else if (lowerLabel.includes("fear") || lowerLabel.includes("fearful")) {
    return "fearful"
  } else if (lowerLabel.includes("disgust") || lowerLabel.includes("disgusted")) {
    return "disgusted"
  } else {
    return "neutral"
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
