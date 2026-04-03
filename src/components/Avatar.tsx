"use client";

interface AvatarProps {
  displayName: string;
  avatarColor: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-16 h-16 text-xl",
  xl: "w-20 h-20 text-2xl",
};

export default function Avatar({ displayName, avatarColor, avatarUrl, size = "md", className = "" }: AvatarProps) {
  const sizeClass = SIZES[size];
  const initials = displayName.substring(0, 2).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-black shrink-0 ${className}`}
      style={{ backgroundColor: avatarColor }}
    >
      {initials}
    </div>
  );
}
