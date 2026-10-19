import { useEffect, useRef } from "react";
import type { Scale, Theme } from "../types";
import { useStore } from "../store";

const scales: { id: Scale; label: string }[] = [
  { id: "sm", label: "Small" },
  { id: "md", label: "Medium" },
  { id: "lg", label: "Large" },
];

const themes: { id: Theme; label: string }[] = [
  { id: "paper", label: "Paper" },
  { id: "night", label: "Night" },
  { id: "contrast", label: "Contrast" },
];

export function Reading() {
  const { settings, setSettings, view } = useStore();
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [view]);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const panel = ref.current;
      if (!panel?.open) return;
      if (!panel.contains(event.target as Node)) panel.open = false;
    }
    function onKey(event: KeyboardEvent) {
      const panel = ref.current;
      if (!panel?.open || event.key !== "Escape") return;
      if (document.querySelector("[role='dialog']")) return;
      panel.open = false;
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details className="reading" ref={ref}>
      <summary>Reading</summary>
      <div className="reading-panel">
        <fieldset>
          <legend>Text size</legend>
          <div className="choices">
            {scales.map((scale) => (
              <button
                key={scale.id}
                type="button"
                className={settings.scale === scale.id ? "choice-btn is-on" : "choice-btn"}
                aria-pressed={settings.scale === scale.id}
                onClick={() => setSettings({ scale: scale.id })}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Theme</legend>
          <div className="choices">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={settings.theme === theme.id ? "choice-btn is-on" : "choice-btn"}
                aria-pressed={settings.theme === theme.id}
                onClick={() => setSettings({ theme: theme.id })}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          className="switch"
          aria-pressed={settings.reduceMotion}
          onClick={() => setSettings({ reduceMotion: !settings.reduceMotion })}
        >
          <span>Reduce motion</span>
          <span>{settings.reduceMotion ? "On" : "Off"}</span>
        </button>
        <button
          type="button"
          className="switch"
          aria-pressed={settings.sound}
          onClick={() => setSettings({ sound: !settings.sound })}
        >
          <span>Timer sound</span>
          <span>{settings.sound ? "On" : "Off"}</span>
        </button>
        <p className="hint">Saved on this device.</p>
      </div>
    </details>
  );
}
