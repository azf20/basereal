"use client";

import { useCallback, useRef, useState } from "react";
import {
  useAccount,
  useWalletClient,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { createCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

const COLORS = [
  "#FFFFFF", // white
  "#000000", // black
  "#FF0000", // red
  "#00FF00", // green
  "#0000FF", // blue
  "#FFFF00", // yellow
  "#FF00FF", // magenta
  "#00FFFF", // cyan
];

export default function BaseReal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { address, status, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingCoin, setIsCreatingCoin] = useState(false);
  const [coinAddress, setCoinAddress] = useState<string | null>(null);
  const { switchChain } = useSwitchChain();

  const isBase = chainId === base.id; // Base chain ID

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      // Optionally show error to user
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert(
            "Camera access was denied. Please allow camera access to use this feature.",
          );
        } else if (error.name === "NotFoundError") {
          alert("No camera found. Please ensure you have a camera connected.");
        } else {
          alert("Error accessing camera: " + error.message);
        }
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");

      // Create a square canvas using the smaller dimension
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Calculate offset to center the image
        const xOffset = (video.videoWidth - size) / 2;
        const yOffset = (video.videoHeight - size) / 2;

        // Draw the center square portion of the video
        ctx.drawImage(video, xOffset, yOffset, size, size, 0, 0, size, size);
        const photoUrl = canvas.toDataURL("image/jpeg", 0.9);
        setPhoto(photoUrl);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const createCompositeImage = useCallback(async () => {
    if (!photo) return null;

    // Create a canvas with the same dimensions as the photo
    const canvas = document.createElement("canvas");
    const img = new Image();

    // Wait for the image to load
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = photo;
    });

    // Use original image dimensions
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw the photo
    ctx.drawImage(img, 0, 0);

    // Set text properties
    const fontSize = Math.floor(canvas.width * 0.05); // Scale font with image
    ctx.font = `600 ${fontSize}px 'Pixelify Sans', system-ui`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Calculate text position
    const padding = Math.floor(canvas.width * 0.04);
    const x = padding;
    const y = padding;

    // Draw the text
    ctx.fillText(title, x, y);

    return canvas.toDataURL("image/png");
  }, [photo, title, textColor]);

  const handleCreateBaseReal = useCallback(async () => {
    if (!photo || !address || !walletClient || !publicClient) return;

    setIsUploading(true);
    setCoinAddress(null);
    try {
      // Create the composite image with title
      const compositeImage = await createCompositeImage();
      if (!compositeImage) throw new Error("Failed to create composite image");

      // Convert data URL to File
      const imageBlob = await fetch(compositeImage).then((res) => res.blob());
      const imageFile = new File([imageBlob], "basereal.png", {
        type: "image/png",
      });

      // Create form data
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("title", title);

      // Upload image and create metadata
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload to IPFS");
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      // Create coin
      setIsCreatingCoin(true);

      const symbol = title
        .replace(/[^A-Z0-9]/gi, "")
        .substring(0, 8)
        .toUpperCase();

      const coinParams = {
        name: title,
        symbol: symbol,
        uri: result.metadata.url,
        payoutRecipient: address,
        platformReferrer: process.env
          .NEXT_PUBLIC_PLATFORM_REFERRER as `0x${string}`,
        initialPurchaseWei: BigInt(0),
      };

      const coinResult = await createCoin(
        coinParams,
        walletClient,
        publicClient,
      );
      console.log("Coin created:", coinResult);
      setCoinAddress(coinResult.address ?? null);
    } catch (error) {
      console.error("Error creating BaseReal:", error);
    } finally {
      setIsUploading(false);
      setIsCreatingCoin(false);
    }
  }, [photo, title, createCompositeImage, address, walletClient, publicClient]);

  if (!status || status === "disconnected") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-pixel">Welcome to BaseReal</h1>
          <p className="text-gray-600 font-pixel">
            Real photos, real coins.
            <br />
            Connect wallet to get started.
          </p>
        </div>
      </div>
    );
  }

  if (!isBase) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="relative w-full max-w-[480px] aspect-square bg-black rounded-lg overflow-hidden">
          <button
            onClick={() => switchChain({ chainId: 8453 })}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 text-white font-pixel text-sm"
          >
            Switch to Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {!photo ? (
        <div className="relative w-full max-w-[480px] aspect-square bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {!stream ? (
            <button
              onClick={startCamera}
              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-pixel"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg"
            >
              <div className="w-12 h-12 rounded-full border-4 border-black" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-[480px] bg-black rounded-lg overflow-hidden">
            <img
              src={photo}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 right-4">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setShowColorPicker(true)}
                onBlur={() => setTimeout(() => setShowColorPicker(false), 200)}
                placeholder="Add a title..."
                maxLength={50}
                rows={2}
                style={{ color: textColor }}
                className="w-full p-2 placeholder:text-white/70 focus:outline-none text-2xl font-semibold bg-transparent resize-none overflow-hidden"
              />
              {showColorPicker && (
                <div className="flex gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        textColor === color
                          ? "border-white"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setPhoto(null);
                setCoinAddress(null);
                startCamera();
              }}
              className="bg-white rounded-full px-4 py-2 shadow-lg font-pixel"
            >
              Take Another
            </button>
            {!coinAddress ? (
              <button
                onClick={handleCreateBaseReal}
                disabled={!title.trim() || isUploading || isCreatingCoin}
                className={`rounded-full px-4 py-2 shadow-lg font-pixel ${
                  !title.trim() || isUploading || isCreatingCoin
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-[#0052FF] text-white hover:bg-[#0052FF]/90"
                }`}
              >
                {isUploading
                  ? "Uploading..."
                  : isCreatingCoin
                    ? "Creating Coin..."
                    : "Create BaseReal"}
              </button>
            ) : (
              <a
                href={`/post/${coinAddress}`}
                className="rounded-full px-4 py-2 shadow-lg font-pixel bg-[#0052FF] text-white hover:bg-[#0052FF]/90"
              >
                View Post
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
