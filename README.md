# 🙂 Emotional Recognition

This app using a Hugging Face model which takes the image from the streaming video and maps it to a weight/score that is sent back to the front-end to determine what colour the background should be.

## 🤗 Hugging Face Model Integration

In `api/detect-expression-hf/route.ts` you will notice an async function that handles a **POST** to the Hugging face model.

```ts
const response = await fetch(
  "https://api-inference.huggingface.co/models/Rajaram1996/FacialEmoRecog",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
      "Content-Type": "application/octet-stream", // Important: Send as binary data
    },
    body: imageBuffer, // Send the raw binary data
  }
);
```

Before the response is posted to the model, it needs the `imageBuffer` - this is the video image that is being rendered in real time and is sent within the body.

```ts
const imageBuffer = await image.arrayBuffer();
```

The response is assigned to the result variable (`const result = await response.json()`). Once the response gives back a 200/OK, the score is then parsed. The response comes back in the format of `[{"label": "happy", "score": 0.9},...]` and now there needs to be some sort of mechanism in place to send this data to the frontend component, to change the background colour.

```ts
try {
  // The model might return different formats, so we handle multiple possibilities
  if (Array.isArray(result)) {
    // Format: [{"label": "happy", "score": 0.9}, ...]
    if (result.length > 0) {
      // Sort by score and get the highest
      const sorted = [...result].sort((a, b) => b.score - a.score);
      if (sorted[0] && sorted[0].label) {
        expression = mapExpression(sorted[0].label);
      }
    }
  } else if (typeof result === "object" && result !== null) {
    // Format: {"happy": 0.9, "sad": 0.1, ...}
    let highestScore = 0;
    for (const [emotion, score] of Object.entries(result)) {
      if (typeof score === "number" && score > highestScore) {
        highestScore = score;
        expression = mapExpression(emotion);
      }
    }
  }
} catch (err) {
  console.error("Error processing expression result:", err);
  // Fall back to neutral if we can't parse the result
}
```

You will notice there is a function called `mapExpression()`. This function returns a label that the frontend can use for the correct background colour.

```ts
function mapExpression(label: string): string {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes("happy") || lowerLabel.includes("joy")) {
    return "happy";
  } else if (lowerLabel.includes("sad") || lowerLabel.includes("unhappy")) {
    return "sad";
  } else if (lowerLabel.includes("angry") || lowerLabel.includes("anger")) {
    return "angry";
  } else if (
    lowerLabel.includes("surprise") ||
    lowerLabel.includes("surprised")
  ) {
    return "surprised";
  } else if (lowerLabel.includes("fear") || lowerLabel.includes("fearful")) {
    return "fearful";
  } else if (
    lowerLabel.includes("disgust") ||
    lowerLabel.includes("disgusted")
  ) {
    return "disgusted";
  } else {
    return "neutral";
  }
}
```

## 📹 Video Rendering

Using React Ref's to contain the canvas, stream and video of live stream whilst the user is using their camera on their device.

```ts
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const streamRef = useRef<MediaStream | null>(null);
```

The user has an option to turn the camera on and off and the state is contained based on the button that is clicked. The stream starts by the app finding the device, in this case the camera. `stream` ensures the video is on and the back-end can use the images from the video rendered. If the user would like to stop the video, they can click on the button and this will stop the tracking of the camera, and set set everything back to default.

```ts
const startWebcam = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsActive(true);
    }
  } catch (err) {
    console.error("Error accessing webcam:", err);
  }
};

const stopWebcam = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setExpression(null);
    setBackgroundColour("bg-background");
  }
};
```

Once the streaming of the camera starts, the frames of each image need to be captured to be sent to the backend for the functionality of the emotion recognition. Once the app knows the device is on and streaming, it creates a canvas on the DOM using native APIs. It then sends this data to the api to post it to the model.

React's `useCallback` functionality enables the app to be able send this data being rendered and retain it with the refs.

```ts
const captureFrame = useCallback(async () => {
  if (!isActive || loading) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas || video.paused || video.ended) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  // Set canvas dimensions to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw the current video frame to the canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert canvas to blob
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    try {
      setLoading(true);

      // Send the image to our API endpoint
      const formData = new FormData();
      formData.append("image", blob);

      const response = await fetch("/api/detect-expression-hf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(
          `Failed to analyze expression: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Expression detected:", data);

      if (data.expression) {
        setExpression(data.expression);
        setBackgroundColour(
          expressionColors[data.expression] || "bg-background"
        );
      }
    } catch (error) {
      console.error("Error analyzing expression:", error);
      // Don't update UI on error to maintain last valid state
    } finally {
      setLoading(false);
    }
  }, "image/jpeg");
}, [isActive, loading, expressionColors]);
```

## 🧪 Testing

[TO DO]

## 🧠 Other Considerations

- Make the response faster or functionality on the front-end to tell the user the analysis is "loading"
