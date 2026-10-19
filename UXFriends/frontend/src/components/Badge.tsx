import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "neutral";
  size?: "sm" | "md" | "lg";
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  icon: Icon,
  className = "",
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-purple-100 text-purple-700 border-purple-200",
    secondary: "bg-teal-100 text-teal-700 border-teal-200",
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-orange-100 text-orange-700 border-orange-200",
    error: "bg-red-100 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`badge border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </span>
  );
}
