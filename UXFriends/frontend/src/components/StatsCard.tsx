import React from "react";
import { Card } from "./Card";

export interface StatsCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: "purple" | "teal" | "green" | "orange" | "yellow";
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "purple",
}: StatsCardProps) {
  const colorStyles = {
    purple: "from-purple-500 to-purple-600",
    teal: "from-teal-500 to-teal-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    yellow: "from-yellow-500 to-yellow-600",
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-slate-600 mb-1">{label}</div>
          <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
          {trend && (
            <div
              className={`text-sm font-semibold ${trend.positive ? "text-green-600" : "text-red-600"}`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorStyles[color]} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}
