import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "right",
  fullWidth = false,
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-600 shadow-md hover:shadow-lg active:scale-95",
    secondary:
      "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500 shadow-md hover:shadow-lg active:scale-95",
    ghost:
      "bg-transparent text-purple-600 hover:bg-purple-50 focus:ring-purple-600",
    outline:
      "bg-transparent border-2 border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-600",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>جاري التحميل...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "right" && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === "left" && <Icon className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}
