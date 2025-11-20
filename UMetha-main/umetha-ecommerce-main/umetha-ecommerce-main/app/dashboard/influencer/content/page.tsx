"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Upload,
  Video,
  Film,
  Sparkles,
  Loader2,
  Wand2,
  Image as ImageIcon,
} from "lucide-react";

// Predefined video styles for customization options
const VIDEO_STYLES = [
  { id: "cinematic", label: "Cinematic" },
  { id: "studio", label: "Studio Product Shot" },
  { id: "dynamic", label: "Fast-Paced TikTok Style" },
  { id: "minimal", label: "Minimal Aesthetic" },
  { id: "luxury", label: "Luxury Brand Look" },
];

export default function AIAdsPage() {
  // State hooks for managing user input and video generation process
  const [productImage, setProductImage] = useState<File | null>(null);  // Product image for the ad
  const [preview, setPreview] = useState<string | null>(null);  // Preview URL for the uploaded image
  const [aiImage, setAiImage] = useState<string | null>(null);  // Generated AI Image URL
  const [prompt, setPrompt] = useState<string>("Create a realistic image of a modern office with a laptop on the desk.");  // Default prompt for AI image generation
  const [style, setStyle] = useState("cinematic");  // Selected video style
  const [duration, setDuration] = useState(5);  // Video duration (default is 5 seconds)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);  // URL of the generated video
  const [loading, setLoading] = useState(false);  // Loading state while video or image is being generated

  // Picture Editor State
  const [rotation, setRotation] = useState(0);  // Image rotation in degrees
  const [flipHorizontal, setFlipHorizontal] = useState(false);  // Horizontal flip state
  const [flipVertical, setFlipVertical] = useState(false);  // Vertical flip state
  const [resize, setResize] = useState({ width: 300, height: 300 });  // Resize state for image dimensions

  // Handle file upload and set preview
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      setPreview(URL.createObjectURL(file));  // Create a preview URL for the uploaded image
    }
  };

  // Function to trigger AI image generation via API
  const generateAIImage = async () => {
    setLoading(true);
    setAiImage(null);  // Clear any previous AI image

    try {
      // Send request to backend API to generate the image
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data?.success) {
        setAiImage(data.imageUrl);  // Set the generated AI image URL
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger video generation via API
  const generateVideo = async () => {
    if (!productImage) return;  // Ensure product image is uploaded before proceeding

    setLoading(true);  // Show loading spinner
    setVideoUrl(null);  // Reset previous video URL if any

    const formData = new FormData();
    formData.append("productImage", productImage);
    formData.append("prompt", prompt);
    formData.append("style", style);
    formData.append("duration", String(duration));

    try {
      // Send request to backend API to generate the video
      const res = await fetch("/api/ai/generate-video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data?.success) {
        setVideoUrl(data.videoUrl);  // Set the video URL if successful
      }
    } catch (error) {
      console.error("Error generating video:", error);
    } finally {
      setLoading(false);  // Hide the loading spinner once the process is complete
    }
  };

  // Function to reset image transformations
  const resetTransformations = () => {
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setResize({ width: 300, height: 300 });
  };

  return (
    <div className="space-y-8">

      {/* Page Header */}
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Video className="w-6 h-6 text-purple-600" />
        AI Ad Video & Image Generator
      </h1>
      <p className="text-muted-foreground text-lg">
        Upload your product image, customize your ad prompt, and generate a professional AI advertisement video or image in just a few steps!
      </p>

      {/* How It Works Section */}
      <section className="bg-purple-50 p-6 rounded-lg shadow-lg space-y-4">
        <h3 className="text-2xl font-semibold text-purple-600">How It Works</h3>
        <p className="text-lg text-muted-foreground">
          Follow these easy steps to generate a professional AI advertisement video or image for your product.
        </p>
        <div className="space-y-2">
          <p><strong>1. Upload your product image:</strong> Choose a high-resolution image of the product you'd like to showcase in your ad.</p>
          <p><strong>2. Set up your ad:</strong> Provide a detailed prompt and choose a style for either the video or image generation.</p>
          <p><strong>3. Generate your ad video or image:</strong> Click the "Generate" button, and our AI will automatically create a professional ad video or image based on your preferences.</p>
        </div>
      </section>

      {/* Upload Section */}
      <Card className="p-6 space-y-4 border-purple-300">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-500" />
          Product Image
        </h2>
        <Input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="mb-4"
        />
        {preview && (
          <div className="mt-4">
            <Image
              src={preview}
              alt="Product preview"
              width={resize.width}
              height={resize.height}
              style={{
                transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
              }}
              className="rounded-md border shadow"
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Upload a high-quality image of your product to use in the ad. This will be the primary visual element of the generated video or image.
        </p>
      </Card>

      {/* AI Image Generation Section */}
      <Card className="p-6 space-y-4 border-purple-300">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-500" />
          AI Image Generator
        </h2>
        <div className="space-y-2">
          <label className="font-medium">Image Prompt</label>
          <Textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate."
            className="border-purple-500"
          />
        </div>
        <Button
          disabled={loading}
          onClick={generateAIImage}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Generating..." : "Generate Image"}
        </Button>
      </Card>

      {/* Generated AI Image */}
      {aiImage && (
        <Card className="p-6 border-purple-300">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-purple-500" />
            Generated Image
          </h2>
          <Image
            src={aiImage}
            alt="AI Generated"
            width={500}
            height={500}
            className="rounded-md shadow-lg"
          />
          <Button
            className="mt-4 bg-purple-600 hover:bg-purple-700"
            onClick={() =>
              navigator?.share
                ? navigator.share({ url: aiImage })
                : alert("Sharing not supported on this browser.")
            }
          >
            Share Image
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Click to download or share the generated image.
          </p>
        </Card>
      )}

      {/* Video Settings Section */}
      <Card className="p-6 space-y-6 border-purple-300">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Film className="w-5 h-5 text-purple-500" />
          Video Settings
        </h2>

        {/* Ad Prompt */}
        <div className="space-y-2">
          <label className="font-medium">Ad Prompt</label>
          <Textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the scene you want to create for your ad."
            className="border-purple-500"
          />
        </div>

        {/* Video Style Selection */}
        <div className="space-y-2">
          <label className="font-medium">Video Style</label>
          <p className="text-sm text-muted-foreground mb-2">
            Choose a style for your ad video. Each style will apply a different mood and aesthetic to the final result.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {VIDEO_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`border rounded-lg p-3 text-sm transition duration-200 ${
                  style === s.id
                    ? "border-purple-600 bg-purple-50 font-semibold"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Video Duration */}
        <div className="space-y-2 max-w-xs">
          <label className="font-medium">Duration (seconds)</label>
          <Input
            type="number"
            min={3}
            max={12}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border-purple-500"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Set the duration for the generated video (3 to 12 seconds).
          </p>
        </div>

        {/* Generate Video Button */}
        <Button
          disabled={loading || !productImage}
          onClick={generateVideo}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Generating..." : "Generate Video"}
        </Button>
      </Card>

      {/* Video Result Section */}
      {videoUrl && (
        <Card className="p-6 border-purple-300">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-purple-500" />
            Generated Video
          </h2>
          <video src={videoUrl} controls className="w-full rounded-lg shadow" />
          <Button
            className="mt-4 bg-purple-600 hover:bg-purple-700"
            onClick={() =>
              navigator?.share
                ? navigator.share({ url: videoUrl })
                : alert("Sharing not supported on this browser.")
            }
          >
            Share Video
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Click to download or share the generated ad video.
          </p>
        </Card>
      )}
    </div>
  );
}
