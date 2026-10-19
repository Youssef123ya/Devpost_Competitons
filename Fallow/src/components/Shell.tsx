import { monthName } from "../logic";
import { IconCook, IconKitchen, IconPlan, IconShare, IconWeek } from "../icons";
import { useStore } from "../store";
import { Brand } from "./Brand";
import { Reading } from "./Reading";
import { Week } from "../views/Week";
import { Kitchen } from "../views/Kitchen";
import { Cook } from "../views/Cook";
import { Share } from "../views/Share";
import { Plan } from "../views/Plan";
import { Why } from "../views/Why";

const NAV = [
  { id: "week", href: "#week", label: "This week", short: "Week", Icon: IconWeek },
  { id: "kitchen", href: "#kitchen", label: "Kitchen", short: "Kitchen", Icon: IconKitchen },
  { id: "cook", href: "#cook", label: "Cook", short: "Cook", Icon: IconCook },
  { id: "share", href: "#share", label: "Share", short: "Share", Icon: IconShare },
  { id: "plan", href: "#plan", label: "Plan", short: "Plan", Icon: IconPlan },
] as const;

export function Shell() {
  const { view, recipeId } = useStore();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={view === "cook" && recipeId ? "shell is-cooking" : "shell"}>
      <nav className="sidenav" aria-label="Primary">
        <Brand href="#week" />
        <div className="nav-list">
          {NAV.map((item) => (
            <a
              key={item.id}
              className="nav-link"
              href={item.href}
              aria-current={view === item.id ? "page" : undefined}
            >
              <item.Icon />
              <span className="nav-long">{item.label}</span>
              <span className="nav-short">{item.short}</span>
              {item.id === "cook" && recipeId ? <span className="dot" aria-hidden="true" /> : null}
              {item.id === "cook" && recipeId ? <span className="sr-only">, in progress</span> : null}
            </a>
          ))}
        </div>
        <div className="nav-foot">
          <a href="#why">Why Fallow</a>
          <p>{monthName()} kitchen</p>
        </div>
      </nav>
      <div className="workspace">
        <header className="top">
          <div className="top-title">
            <span className="brand-mobile">
              <Brand href="#week" />
            </span>
            <p className="today">{today}</p>
          </div>
          <div className="landing-tools">
            <a className="header-why" href="#why">
              Why
            </a>
            <Reading />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="main">
          {view === "week" && <Week />}
          {view === "kitchen" && <Kitchen />}
          {view === "cook" && <Cook />}
          {view === "share" && <Share />}
          {view === "plan" && <Plan />}
          {view === "why" && <Why />}
        </main>
      </div>
    </div>
  );
}
