import React from "react";

interface LearningFigureProps {
  visualKey?: string | null;
  caption?: string | null;
  compact?: boolean;
  className?: string;
}

type FigureTheme = {
  shell: string;
  frame: string;
  accent: string;
  accentSoft: string;
  muted: string;
};

function resolveTheme(visualKey: string): FigureTheme {
  const normalized = visualKey.toLowerCase();

  if (normalized.includes("color")) {
    return {
      shell: "from-rose-50 via-white to-amber-50",
      frame: "bg-white/85",
      accent: "bg-rose-500",
      accentSoft: "bg-amber-200",
      muted: "bg-slate-200",
    };
  }

  if (
    normalized.includes("form") ||
    normalized.includes("feedback") ||
    normalized.includes("inclusive")
  ) {
    return {
      shell: "from-emerald-50 via-white to-teal-50",
      frame: "bg-white/85",
      accent: "bg-emerald-500",
      accentSoft: "bg-emerald-200",
      muted: "bg-slate-200",
    };
  }

  if (
    normalized.includes("journey") ||
    normalized.includes("task") ||
    normalized.includes("navigation") ||
    normalized.includes("service")
  ) {
    return {
      shell: "from-sky-50 via-white to-indigo-50",
      frame: "bg-white/85",
      accent: "bg-sky-500",
      accentSoft: "bg-sky-200",
      muted: "bg-slate-200",
    };
  }

  return {
    shell: "from-violet-50 via-white to-cyan-50",
    frame: "bg-white/85",
    accent: "bg-violet-500",
    accentSoft: "bg-cyan-200",
    muted: "bg-slate-200",
  };
}

function FigureShell({
  children,
  compact,
  className = "",
}: {
  children: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-white/80 bg-white/90 shadow-sm ${compact ? "p-3" : "p-4"} ${className}`}
    >
      {children}
    </div>
  );
}

function BrowserFigure({
  children,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <FigureShell compact={compact}>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-2 h-3 flex-1 rounded-full bg-slate-100" />
      </div>
      {children}
    </FigureShell>
  );
}

function HierarchyFigure({
  theme,
  good,
  compact,
}: {
  theme: FigureTheme;
  good: boolean;
  compact?: boolean;
}) {
  const cardHeight = compact ? "h-24" : "h-40";

  return (
    <BrowserFigure compact={compact}>
      <div className={`grid ${cardHeight} grid-cols-[1.25fr_0.85fr] gap-3`}>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div
            className={`mb-3 h-4 rounded-full ${
              good ? `${theme.accent} w-1/2` : `${theme.muted} w-2/3`
            }`}
          />
          <div className={`mb-2 h-3 rounded-full ${theme.muted}`} />
          <div className={`mb-4 h-3 rounded-full ${theme.muted} w-5/6`} />
          <div className="grid grid-cols-2 gap-2">
            <div
              className={`rounded-2xl ${
                good ? "bg-violet-50" : "bg-orange-100"
              } p-3`}
            >
              <div
                className={`mb-2 h-3 rounded-full ${
                  good ? "bg-violet-300 w-3/5" : "bg-orange-300 w-full"
                }`}
              />
              <div className="h-10 rounded-xl bg-white/90" />
            </div>
            <div
              className={`rounded-2xl ${
                good ? "bg-slate-50" : "bg-teal-100"
              } p-3`}
            >
              <div
                className={`mb-2 h-3 rounded-full ${
                  good ? "bg-slate-200 w-2/5" : "bg-teal-300 w-full"
                }`}
              />
              <div className="h-10 rounded-xl bg-white/90" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className={`mb-4 h-3 rounded-full ${theme.muted} w-2/5`} />
          <div
            className={`rounded-2xl ${
              good ? `${theme.accent}` : "bg-orange-400"
            } ${good ? "h-12" : "h-10"}`}
          />
          <div className={`mt-4 h-3 rounded-full ${theme.muted} w-3/4`} />
          <div className={`mt-2 h-3 rounded-full ${theme.muted} w-1/2`} />
        </div>
      </div>
    </BrowserFigure>
  );
}

function CheckoutFigure({
  good,
  compact,
}: {
  good: boolean;
  compact?: boolean;
}) {
  const summaryWidth = good ? "w-1/2" : "w-5/6";

  return (
    <BrowserFigure compact={compact}>
      <div className={`${compact ? "h-24" : "h-40"} rounded-[28px] bg-slate-50 p-4`}>
        <div className="grid h-full grid-cols-[0.95fr_1.15fr] gap-4">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="mb-3 h-20 rounded-2xl bg-slate-100" />
            <div className="mb-2 h-3 rounded-full bg-slate-200 w-3/5" />
            <div className="mb-4 h-3 rounded-full bg-slate-200 w-2/5" />
            <div
              className={`rounded-2xl ${
                good ? "bg-orange-400" : "bg-orange-300"
              } h-10`}
            />
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100" />
              <div className="flex-1">
                <div className="mb-2 h-3 rounded-full bg-slate-200 w-1/2" />
                <div className="h-3 rounded-full bg-slate-200 w-1/3" />
              </div>
            </div>
            {!good ? (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="h-10 rounded-xl bg-slate-100" />
                <div className="h-10 rounded-xl bg-slate-100" />
              </div>
            ) : null}
            <div className={`mb-2 h-3 rounded-full bg-slate-200 ${summaryWidth}`} />
            <div className={`mb-2 h-3 rounded-full bg-slate-200 ${good ? "w-2/3" : "w-full"}`} />
            <div className={`mb-4 h-3 rounded-full bg-slate-200 ${good ? "w-1/3" : "w-4/5"}`} />
            <div className="flex items-end justify-between">
              <div className="h-5 w-16 rounded-full bg-slate-800" />
              <div className={`h-6 rounded-full ${good ? "w-20 bg-slate-900" : "w-28 bg-slate-700"}`} />
            </div>
          </div>
        </div>
      </div>
    </BrowserFigure>
  );
}

function ColorWheelFigure({
  good,
  compact,
}: {
  good: boolean;
  compact?: boolean;
}) {
  return (
    <FigureShell compact={compact}>
      <div className={`${compact ? "h-24" : "h-40"} flex items-center justify-center rounded-[28px] bg-white`}>
        <div className="relative h-32 w-32 rounded-full bg-[conic-gradient(#e53935_0deg,#fb8c00_50deg,#fdd835_100deg,#8bc34a_150deg,#26a69a_210deg,#42a5f5_260deg,#7e57c2_310deg,#d81b60_360deg)] shadow-inner">
          <div className="absolute inset-6 rounded-full bg-white" />
          <div
            className={`absolute h-14 w-3 origin-bottom rounded-full bg-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-full ${
              good ? "rotate-0" : "rotate-[24deg]"
            }`}
          />
          <div
            className={`absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-white ${
              good
                ? "left-1/2 top-3 bg-red-500"
                : "left-[70%] top-[68%] bg-green-400"
            }`}
          />
          <div
            className={`absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-white ${
              good
                ? "left-1/2 top-[86%] bg-sky-300"
                : "left-1/2 top-[86%] bg-sky-300"
            }`}
          />
          {!good ? (
            <div className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-white left-[78%] top-[76%] bg-emerald-300" />
          ) : null}
        </div>
      </div>
    </FigureShell>
  );
}

function FormFigure({
  good,
  compact,
}: {
  good: boolean;
  compact?: boolean;
}) {
  return (
    <BrowserFigure compact={compact}>
      <div className={`${compact ? "h-24" : "h-40"} rounded-[28px] bg-slate-50 p-4`}>
        <div className="grid h-full gap-3">
          <div>
            <div className="mb-2 h-3 rounded-full bg-slate-200 w-1/4" />
            <div
              className={`h-10 rounded-2xl border ${
                good ? "border-slate-200 bg-white" : "border-red-200 bg-red-50"
              }`}
            />
          </div>
          <div>
            <div className="mb-2 h-3 rounded-full bg-slate-200 w-1/3" />
            <div className="h-10 rounded-2xl border border-slate-200 bg-white" />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className={`h-9 rounded-2xl ${good ? "bg-emerald-500" : "bg-slate-300"}`} />
            <div
              className={`rounded-full px-3 py-2 text-xs font-semibold ${
                good ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}
            >
              {good ? "Ready" : "Error"}
            </div>
          </div>
        </div>
      </div>
    </BrowserFigure>
  );
}

function FlowFigure({
  good,
  compact,
}: {
  good: boolean;
  compact?: boolean;
}) {
  return (
    <FigureShell compact={compact}>
      <div className={`${compact ? "h-24" : "h-40"} rounded-[28px] bg-white p-4`}>
        <div className="grid h-full grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col items-center justify-center gap-3">
              <div
                className={`h-11 w-11 rounded-2xl ${
                  index === 0
                    ? "bg-sky-500"
                    : good
                      ? "bg-sky-100"
                      : index % 2 === 0
                        ? "bg-orange-100"
                        : "bg-violet-100"
                }`}
              />
              <div className="h-3 w-full rounded-full bg-slate-200" />
              {index < 3 ? (
                <div
                  className={`h-1 w-full rounded-full ${
                    good ? "bg-sky-300" : index === 1 ? "bg-orange-300" : "bg-slate-300"
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </FigureShell>
  );
}

function NavigationFigure({
  good,
  compact,
}: {
  good: boolean;
  compact?: boolean;
}) {
  return (
    <BrowserFigure compact={compact}>
      <div className={`${compact ? "h-24" : "h-40"} rounded-[28px] bg-slate-50 p-4`}>
        <div className="grid h-full grid-cols-[0.9fr_1.1fr] gap-4">
          <div className="rounded-2xl bg-white p-3">
            {Array.from({ length: good ? 4 : 6 }).map((_, index) => (
              <div key={index} className="mb-2 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${index === 0 ? "bg-sky-500" : "bg-slate-200"}`} />
                <div
                  className={`h-3 rounded-full bg-slate-200 ${
                    good ? (index === 0 ? "w-2/3" : "w-1/2") : index % 2 === 0 ? "w-full" : "w-3/4"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="h-12 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-slate-100" />
            </div>
            <div className={`h-20 rounded-2xl ${good ? "bg-sky-50" : "bg-orange-50"} p-3`}>
              <div className={`mb-2 h-3 rounded-full ${good ? "bg-sky-200 w-1/2" : "bg-orange-200 w-full"}`} />
              <div className="h-3 rounded-full bg-slate-200 w-3/4" />
              {!good ? <div className="mt-2 h-3 rounded-full bg-slate-200 w-full" /> : null}
            </div>
          </div>
        </div>
      </div>
    </BrowserFigure>
  );
}

function FeedbackFigure({
  good,
  compact,
}: {
  good: boolean;
  compact?: boolean;
}) {
  return (
    <FigureShell compact={compact}>
      <div className={`${compact ? "h-24" : "h-40"} grid gap-3`}>
        <div
          className={`rounded-2xl border p-4 ${
            good
              ? "border-emerald-200 bg-emerald-50"
              : "border-slate-200 bg-slate-100"
          }`}
        >
          <div className="mb-2 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-2xl ${good ? "bg-emerald-500" : "bg-slate-400"}`} />
            <div className="flex-1">
              <div className={`mb-2 h-3 rounded-full ${good ? "bg-emerald-300 w-1/2" : "bg-slate-300 w-4/5"}`} />
              <div className={`h-3 rounded-full ${good ? "bg-emerald-200 w-2/3" : "bg-slate-300 w-full"}`} />
            </div>
          </div>
        </div>
        <div
          className={`rounded-2xl border p-4 ${
            good ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
          }`}
        >
          <div className={`mb-2 h-3 rounded-full ${good ? "bg-amber-300 w-1/3" : "bg-red-300 w-3/4"}`} />
          <div className="h-3 rounded-full bg-white/80 w-2/3" />
        </div>
      </div>
    </FigureShell>
  );
}

function FigureFrame({
  visualKey,
  compact,
}: {
  visualKey: string;
  compact?: boolean;
}) {
  const theme = resolveTheme(visualKey);
  const normalized = visualKey.toLowerCase();

  if (normalized.includes("checkout")) {
    return <CheckoutFigure good={!normalized.includes("bad")} compact={compact} />;
  }

  if (normalized.includes("color-wheel")) {
    if (normalized.includes("compare")) {
      return (
        <div className={`grid ${compact ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
          <ColorWheelFigure good compact={compact} />
          <ColorWheelFigure good={false} compact={compact} />
        </div>
      );
    }

    return <ColorWheelFigure good={!normalized.includes("bad")} compact={compact} />;
  }

  if (
    normalized.includes("form-accessible") ||
    normalized.includes("inclusive-form") ||
    normalized.includes("form") ||
    normalized.includes("field")
  ) {
    return <FormFigure good={!normalized.includes("bad")} compact={compact} />;
  }

  if (
    normalized.includes("feedback-good") ||
    normalized.includes("feedback-bad") ||
    normalized.includes("feedback") ||
    normalized.includes("status") ||
    normalized.includes("microinteraction")
  ) {
    return <FeedbackFigure good={!normalized.includes("bad")} compact={compact} />;
  }

  if (
    normalized.includes("navigation-map") ||
    normalized.includes("advanced-navigation") ||
    normalized.includes("navigation")
  ) {
    return <NavigationFigure good={!normalized.includes("bad")} compact={compact} />;
  }

  if (
    normalized.includes("journey-flow") ||
    normalized.includes("journey") ||
    normalized.includes("task") ||
    normalized.includes("service-blueprint") ||
    normalized.includes("flow")
  ) {
    return <FlowFigure good={!normalized.includes("bad")} compact={compact} />;
  }

  return <HierarchyFigure theme={theme} good={!normalized.includes("bad")} compact={compact} />;
}

export function LearningFigure({
  visualKey,
  caption,
  compact = false,
  className = "",
}: LearningFigureProps) {
  if (!visualKey) {
    return null;
  }

  const theme = resolveTheme(visualKey);

  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br ${theme.shell} p-3 ${className}`}
    >
      <FigureFrame visualKey={visualKey} compact={compact} />
      {caption ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{caption}</p>
      ) : null}
    </div>
  );
}
