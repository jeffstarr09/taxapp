"use client";

import { useRef, useState } from "react";

interface AvatarUploadProps {
  currentUrl: string | null;
  avatarColor: string;
  displayName: string;
  onCapture: (dataUrl: string) => void;
  onRemove: () => void;
}

export default function AvatarUpload({ currentUrl, avatarColor, displayName, onCapture, onRemove }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) { setProcessing(false); return; }

        // Square crop from center, resize to 200x200
        const size = Math.min(img.width, img.height);
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setProcessing(false); return; }

        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        onCapture(dataUrl);
        setProcessing(false);
      };
      img.onerror = () => {
        alert("Could not load image. Try a different file.");
        setProcessing(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div>
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
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="px-4 py-2 bg-[#e8450a]/10 text-[#e8450a] rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            {processing ? "Processing..." : currentUrl ? "Change Photo" : "Add Photo"}
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

      {/* Hidden file input — accept images, allows camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden canvas for resizing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
