"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  useAccount,
  useWalletClient,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { createCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";

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
  const frontCameraRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [frontStream, setFrontStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [dualPhoto, setDualPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { address, status, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingCoin, setIsCreatingCoin] = useState(false);
  const [coinAddress, setCoinAddress] = useState<string | null>(null);
  const { switchChain } = useSwitchChain();

  const isBase = chainId === base.id; // Base chain ID

  // Add useEffect to detect mobile on mount
  useEffect(() => {
    const mobileCheck =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    setIsMobile(mobileCheck);
  }, []);

  const startCamera = useCallback(
    async (forceFront?: boolean) => {
      try {
        // Stop any existing stream first
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }

        setCameraError(null);
        let mediaStream;
        let usingFrontCamera = false;

        // Use the memoized value instead of recalculating
        const mobileDevice = isMobile;

        // Determine which camera to use
        const facingMode =
          forceFront === true || (!mobileDevice && forceFront !== false)
            ? { exact: "user" }
            : forceFront === false
              ? { exact: "environment" }
              : mobileDevice
                ? { exact: "environment" }
                : "user";

        try {
          // Try to get camera with specified facing mode
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1920 },
            },
            audio: false,
          });

          // Set front camera flag based on what we requested
          usingFrontCamera =
            facingMode === "user" ||
            facingMode?.exact === "user" ||
            (!mobileDevice && facingMode !== { exact: "environment" });
        } catch (err) {
          console.log(
            "Error accessing camera with specified facing mode:",
            err,
          );
          console.log("Falling back to any available camera");

          // Fallback to any camera
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          // Try to detect camera type from settings
          if (mediaStream.getVideoTracks().length > 0) {
            const track = mediaStream.getVideoTracks()[0];
            const settings = track.getSettings();

            // Check facingMode in settings
            if (settings.facingMode) {
              usingFrontCamera = settings.facingMode === "user";
            } else {
              // Default to front camera on desktop, assume most common mobile case
              usingFrontCamera = !mobileDevice;
            }
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setIsFrontCamera(usingFrontCamera);
        setStream(mediaStream);
      } catch (error) {
        console.error("Error accessing camera:", error);
        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            setCameraError(
              "Camera access was denied. Please allow camera access to use this feature.",
            );
          } else if (error.name === "NotFoundError") {
            setCameraError(
              "No camera found. Please ensure you have a camera connected.",
            );
          } else {
            setCameraError(`Error accessing camera: ${error.message}`);
          }
        }
      }
    },
    [isMobile],
  ); // Only depend on isMobile, not stream

  // Add a function to start front camera for dual capture
  const startFrontCamera = useCallback(async () => {
    if (!isMobile) return; // Only needed for mobile

    // Don't restart if we already have a stream
    if (frontStream && frontCameraRef.current?.srcObject === frontStream) {
      console.log("Front camera already running, skipping restart");
      return;
    }

    // Stop existing front stream if any
    if (frontStream) {
      frontStream.getTracks().forEach((track) => track.stop());
    }

    try {
      console.log("Starting front camera...");
      // Try to get front-facing camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "user" },
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      // Make sure frontCameraRef is ready before setting srcObject
      if (frontCameraRef.current) {
        frontCameraRef.current.srcObject = mediaStream;
        console.log("Front camera stream set to video element");
      } else {
        console.warn("Front camera ref not ready");
      }

      setFrontStream(mediaStream);
    } catch (error) {
      console.error("Error accessing front camera for inset:", error);
    }
  }, [isMobile]); // Remove frontStream dependency to prevent cycles

  // Modified useEffect to start both cameras with better control flow
  useEffect(() => {
    let mainCameraInitialized = false;
    let frontCameraInitialized = false;
    let mainCleanupDone = false;
    let frontCleanupDone = false;

    const initCameras = async () => {
      try {
        await startCamera();
        mainCameraInitialized = true;

        if (isMobile && !frontCameraInitialized) {
          // Wait a moment for main camera to stabilize
          setTimeout(async () => {
            if (!frontCameraInitialized) {
              await startFrontCamera();
              frontCameraInitialized = true;
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Error initializing cameras:", err);
      }
    };

    initCameras();

    // Clean up function to stop all cameras when component unmounts
    return () => {
      if (stream && !mainCleanupDone) {
        stream.getTracks().forEach((track) => track.stop());
        mainCleanupDone = true;
      }

      if (frontStream && !frontCleanupDone) {
        frontStream.getTracks().forEach((track) => track.stop());
        frontCleanupDone = true;
      }
    };
  }, [startCamera, startFrontCamera, isMobile]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (frontStream) {
      frontStream.getTracks().forEach((track) => track.stop());
      setFrontStream(null);
    }
  }, [stream, frontStream]);

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

        // If we have a front camera and we're on mobile, add the inset
        if (frontCameraRef.current && frontStream && isMobile) {
          const frontVideo = frontCameraRef.current;

          // Calculate the size and position for the inset
          const insetSize = size * 0.3; // 30% of the main image
          const margin = size * 0.03; // 3% margin from corner

          // Position in bottom right corner
          const insetX = size - insetSize - margin;
          const insetY = size - insetSize - margin;

          // Calculate front camera center crop
          const frontSize = Math.min(
            frontVideo.videoWidth,
            frontVideo.videoHeight,
          );
          const frontXOffset = (frontVideo.videoWidth - frontSize) / 2;
          const frontYOffset = (frontVideo.videoHeight - frontSize) / 2;

          // Draw the front camera inset
          ctx.save(); // Save context state

          // Create circular clip for front camera
          ctx.beginPath();
          const circleX = insetX + insetSize / 2;
          const circleY = insetY + insetSize / 2;
          const radius = insetSize / 2;
          ctx.arc(circleX, circleY, radius, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();

          // Flip the context horizontally for selfie mirroring
          ctx.translate(insetX + insetSize, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(
            frontVideo,
            frontXOffset,
            frontYOffset,
            frontSize,
            frontSize,
            0,
            insetY,
            insetSize,
            insetSize,
          );

          ctx.restore(); // Restore context state

          // Add a white border around the inset
          ctx.beginPath();
          ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = "white";
          ctx.lineWidth = size * 0.01; // 1% border width
          ctx.stroke();
        }

        const photoUrl = canvas.toDataURL("image/jpeg", 1.0);
        setPhoto(photoUrl);
        stopCamera();
      }
    }
  }, [stopCamera, frontStream, isMobile]);

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

  const getButtonState = useCallback(() => {
    if (!status || status === "disconnected") {
      return {
        text: "Connect Wallet",
        disabled: false,
        action: null,
        isConnect: true,
        className: "bg-[#0052FF] text-white hover:bg-[#0052FF]/90",
      };
    }

    if (!isBase) {
      return {
        text: "Switch to Base",
        disabled: false,
        action: () => switchChain({ chainId: 8453 }),
        isConnect: false,
        className: "bg-[#0052FF] text-white hover:bg-[#0052FF]/90",
      };
    }

    if (!title.trim()) {
      return {
        text: "Add a title",
        disabled: true,
        action: () => {},
        isConnect: false,
        className: "bg-gray-400 text-gray-200 cursor-not-allowed",
      };
    }

    if (isUploading) {
      return {
        text: "Uploading...",
        disabled: true,
        action: () => {},
        isConnect: false,
        className: "bg-gray-400 text-gray-200 cursor-not-allowed",
      };
    }

    if (isCreatingCoin) {
      return {
        text: "Creating Coin...",
        disabled: true,
        action: () => {},
        isConnect: false,
        className: "bg-gray-400 text-gray-200 cursor-not-allowed",
      };
    }

    return {
      text: "Create BaseReal",
      disabled: false,
      action: handleCreateBaseReal,
      isConnect: false,
      className: "bg-[#0052FF] text-white hover:bg-[#0052FF]/90",
    };
  }, [
    status,
    isBase,
    title,
    isUploading,
    isCreatingCoin,
    switchChain,
    handleCreateBaseReal,
  ]);

  // Function to switch camera (optimized to prevent rerendering)
  const switchCamera = useCallback(() => {
    // First stop the current stream manually
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setStream(null); // Clear stream before starting new one
    }

    // Then start the new camera
    startCamera(!isFrontCamera);

    // Only restart front camera if we're switching to back camera and we don't already have a front stream
    if (
      isFrontCamera &&
      (!frontStream || frontStream.getVideoTracks().length === 0)
    ) {
      // We're switching to back camera, so restart front camera for PIP
      setTimeout(() => {
        startFrontCamera();
      }, 1000);
    }
  }, [startCamera, isFrontCamera, stream, startFrontCamera, frontStream]);

  return (
    <div className="relative">
      {!photo ? (
        <div className="relative w-full max-w-[480px] aspect-square bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${isFrontCamera ? "scale-x-[-1]" : ""}`}
          />

          {/* Front camera video element */}
          <video
            ref={frontCameraRef}
            autoPlay
            playsInline
            muted
            className={`${isMobile && frontStream && !isFrontCamera ? "absolute bottom-4 right-4 w-24 h-24 rounded-full object-cover border-2 border-white scale-x-[-1] z-10" : "hidden"}`}
          />

          {!stream ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white font-pixel">
              {cameraError ? (
                <div className="text-center p-4 text-red-500 max-w-sm">
                  <p>{cameraError}</p>
                  <button
                    onClick={() => {
                      setCameraError(null);
                      startCamera();
                    }}
                    className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <p>Loading camera...</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border-4 border-black" />
              </button>

              {/* Camera switch button (mobile only) */}
              {isMobile && (
                <button
                  onClick={switchCamera}
                  className="absolute top-4 right-4 bg-black/50 rounded-full p-2 text-white"
                  aria-label="Switch camera"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"></path>
                    <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"></path>
                    <path d="m9 9-2 2 2 2"></path>
                    <path d="m15 9 2 2-2 2"></path>
                  </svg>
                </button>
              )}
            </>
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
                // Also restart front camera if on mobile
                if (isMobile) {
                  // Delay for front camera to let main camera initialize first
                  setTimeout(() => {
                    startFrontCamera();
                  }, 1000);
                }
              }}
              className="bg-white rounded-full px-4 py-2 shadow-lg font-pixel"
            >
              Take Another
            </button>
            {!coinAddress ? (
              getButtonState().isConnect ? (
                <ConnectWallet className="rounded-full px-4 py-2 shadow-lg font-pixel bg-[#0052FF] text-white hover:bg-[#0052FF]/90" />
              ) : (
                <button
                  onClick={getButtonState().action ?? undefined}
                  disabled={getButtonState().disabled}
                  className={`rounded-full px-4 py-2 shadow-lg font-pixel ${getButtonState().className}`}
                >
                  {getButtonState().text}
                </button>
              )
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
