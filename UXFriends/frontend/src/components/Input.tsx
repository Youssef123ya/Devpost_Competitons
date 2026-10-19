import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconPosition?: "left" | "right";
}

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = "right",
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === "right" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-slate-200"
          } ${Icon && iconPosition === "right" ? "pr-12" : ""} ${Icon && iconPosition === "left" ? "pl-12" : ""} ${className}`}
          {...props}
        />
        {Icon && iconPosition === "left" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-2 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
