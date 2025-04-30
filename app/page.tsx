"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Camera, CameraOff } from "lucide-react";

export default function Home() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expression, setExpression] = useState<string | null>(null);
  const [backgroundColour, setBackgroundColour] = useState("bg-background");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Map expressions to colors
  const expressionColors: Record<string, string> = {
    happy: "bg-yellow-100",
    sad: "bg-blue-100",
    angry: "bg-red-100",
    surprised: "bg-purple-100",
    neutral: "bg-gray-100",
    fearful: "bg-green-100",
    disgusted: "bg-orange-100",
  };

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

  // Update the captureFrame function to add more error handling and logging
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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      // Analyze expression every 1 second
      interval = setInterval(captureFrame, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isActive, captureFrame]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-6">
        Facial Expression Colour Mapper
      </h1>
      <p className="text-lg mb-8 max-w-2xl">
        This app detects your facial expressions in real-time and changes the
        background colour accordingly. Try smiling, frowning, or showing
        surprise!
      </p>

      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 ${backgroundColour}`}
      >
        <div className="w-full max-w-3xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Hugging Face Expression Detector
            </h1>
            <p className="text-muted-foreground">
              Using Hugging Face models to detect facial expressions and change
              background colours
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="aspect-video relative bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  isActive ? "block" : "hidden"
                }`}
              />

              {!isActive && (
                <div className="text-white text-center p-4">
                  <Camera className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>Camera is turned off</p>
                </div>
              )}

              {loading && (
                <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  Current Expression:
                  <span className="ml-2 font-bold">
                    {expression
                      ? expression.charAt(0).toUpperCase() + expression.slice(1)
                      : "None detected"}
                  </span>
                </p>
              </div>

              <Button
                onClick={isActive ? stopWebcam : startWebcam}
                variant={isActive ? "destructive" : "default"}
              >
                {isActive ? (
                  <>
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Camera
                  </>
                )}
              </Button>
            </div>
          </Card>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </main>
  );
}
