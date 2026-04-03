"use client";

import { useState, useRef, useCallback } from "react";

interface AvatarUploadProps {
  currentUrl: string | null;
  avatarColor: string;
  displayName: string;
  onCapture: (dataUrl: string) => void;
  onRemove: () => void;
}

export default function AvatarUpload({ currentUrl, avatarColor, displayName, onCapture, onRemove }: AvatarUploadProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 400 }, height: { ideal: 400 } },
      });
      setStream(mediaStream);
      setCameraActive(true);
      // Wait for ref to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      alert("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Square crop from center
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // Mirror the selfie
    ctx.translate(200, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 200, 200);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    onCapture(dataUrl);
    stopCamera();
  }, [onCapture, stopCamera]);

  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div>
      {/* Current avatar preview */}
      <div className="flex items-center gap-4 mb-3">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-[#e8450a]/10 text-[#e8450a] rounded-lg text-xs font-semibold"
          >
            Take Selfie
          </button>
          {currentUrl && (
            <button
              onClick={onRemove}
              className="px-4 py-2 text-gray-400 rounded-lg text-xs font-medium"
            >
              Remove Photo
            </button>
          )}
        </div>
      </div>

      {/* Camera view */}
      {cameraActive && (
        <div className="relative rounded-xl overflow-hidden mb-3 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-square object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={capturePhoto}
              className="w-14 h-14 bg-white rounded-full border-4 border-gray-300 shadow-lg"
              aria-label="Take photo"
            />
            <button
              onClick={stopCamera}
              className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center self-center"
              aria-label="Cancel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
