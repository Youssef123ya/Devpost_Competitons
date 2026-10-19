import React from "react";

export interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "md",
  status,
  className = "",
}: AvatarProps) {
  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-slate-400",
    away: "bg-yellow-500",
  };

  const statusSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeStyles[size]} rounded-full object-cover border-2 border-white shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm`}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 left-0 ${statusSizes[size]} ${statusColors[status]} border-2 border-white rounded-full`}
        />
      )}
    </div>
  );
}
