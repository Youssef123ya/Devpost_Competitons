import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ className = "icon", children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconLeaf() {
  return (
    <svg viewBox="0 0 32 32" className="leaf" aria-hidden="true">
      <path d="M16.2 4.2c2 4 2.2 7-.2 10.6 4.6-.6 8-.2 10.8 2.4-4 1.1-6.6 3.4-7 8.2-2.2-4.2-4.8-6.3-9-7.2 3-2 4.4-5 5.4-14z" />
    </svg>
  );
}

export function IconWeek() {
  return (
    <Svg>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" />
    </Svg>
  );
}

export function IconKitchen() {
  return (
    <Svg>
      <path d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8z" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

export function IconCook() {
  return (
    <Svg>
      <path d="M12 3c1.2 2.2 1.2 3.6 0 5.2 2.2-.2 3.6 0 4.8 1.2-1.8.6-3 1.6-3.2 3.8-1-1.8-2.2-2.8-4.2-3.2 1.4-.9 2-2.2 2.6-7z" />
      <path d="M6 19.5h12" />
    </Svg>
  );
}

export function IconShare() {
  return (
    <Svg>
      <path d="M12 4v10" />
      <path d="M8.5 7.5 12 4l3.5 3.5" />
      <path d="M6 12.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5.5" />
    </Svg>
  );
}

export function IconPlan() {
  return (
    <Svg>
      <path d="M5 7h14M5 12h14M5 17h9" />
    </Svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <Svg className={className ?? "icon"}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}
