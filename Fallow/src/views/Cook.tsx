import { useEffect, useRef, useState } from "react";
import { chime } from "../audio";
import { Dialog } from "../components/Dialog";
import { RecipeButtons } from "../components/RecipeButtons";
import { formatClock, hasIngredient, minutesLabel, missingSentence, perishablesUsed } from "../logic";
import type { Recipe } from "../types";
import { useStore } from "../store";

export function Cook() {
  const { matches, recipeId } = useStore();
  const match = matches.find((item) => item.recipe.id === recipeId);
  if (!match) return <CookPicker />;
  return <CookSession recipe={match.recipe} />;
}

function CookPicker() {
  const { matches, startCook } = useStore();
  const ready = matches.filter((match) => match.ready);
  const waiting = matches.filter((match) => !match.ready);

  return (
    <div className="page">
      <header className="page-intro">
        <p className="kicker">Cook</p>
        <h1 className="page-title">What are you making?</h1>
        <p className="lede">Ready meals come first, ordered by what spoils soonest.</p>
      </header>
      {ready.length > 0 ? (
        <section className="section" aria-labelledby="pick-ready">
          <h2 id="pick-ready">From what you have</h2>
          <RecipeButtons matches={ready} onPick={startCook} />
        </section>
      ) : (
        <div className="empty">
          <p>Nothing is cookable yet.</p>
          <a className="btn btn-primary" href="#kitchen">
            Add an ingredient
          </a>
        </div>
      )}
      {waiting.length > 0 ? (
        <section className="section" aria-labelledby="pick-wait">
          <h2 id="pick-wait">Needs something</h2>
          <RecipeButtons matches={waiting} onPick={startCook} />
        </section>
      ) : null}
    </div>
  );
}

function CookSession({ recipe }: { recipe: Recipe }) {
  const { step, setStep, ingredients, matches, chooseAnother, finishCook, settings, assumption } = useStore();
  const match = matches.find((item) => item.recipe.id === recipe.id);
  const index = Math.min(step, recipe.steps.length - 1);
  const current = recipe.steps[index];
  const [left, setLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [timerMessage, setTimerMessage] = useState("");
  const [stepMessage, setStepMessage] = useState("");
  const [finishOpen, setFinishOpen] = useState(false);
  const endRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const finishedRef = useRef(false);
  const firstStep = useRef(true);
  const handlers = useRef<{ next: () => void; prev: () => void; toggle: () => void; minutes: number }>({
    next: () => undefined,
    prev: () => undefined,
    toggle: () => undefined,
    minutes: 0,
  });
  runningRef.current = running;

  function announceTimer(message: string) {
    setTimerMessage("");
    window.setTimeout(() => setTimerMessage(message), 40);
  }

  function go(nextIndex: number) {
    if (nextIndex === index) return;
    if (runningRef.current) announceTimer("Timer stopped.");
    else setTimerMessage("");
    endRef.current = null;
    finishedRef.current = false;
    setRunning(false);
    setLeft(null);
    setStep(nextIndex);
  }

  function openFinish() {
    setFinishOpen(true);
  }

  function next() {
    if (index >= recipe.steps.length - 1) openFinish();
    else go(index + 1);
  }

  function prev() {
    if (index === 0) return;
    go(index - 1);
  }

  function startTimer() {
    if (!current.minutes) return;
    finishedRef.current = false;
    const seconds = current.minutes * 60;
    endRef.current = Date.now() + seconds * 1000;
    setLeft(seconds);
    setRunning(true);
    announceTimer(`Timer started. ${minutesLabel(current.minutes)} for ${current.title}.`);
  }

  function resumeTimer() {
    if (left == null || left <= 0) return;
    finishedRef.current = false;
    endRef.current = Date.now() + left * 1000;
    setRunning(true);
    announceTimer(`Timer resumed. ${formatClock(left)} left.`);
  }

  function pauseTimer() {
    if (endRef.current == null) return;
    const nextLeft = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
    endRef.current = null;
    setLeft(nextLeft);
    setRunning(false);
    announceTimer(`Timer paused. ${formatClock(nextLeft)} left.`);
  }

  function toggleTimer() {
    if (!current.minutes) return;
    if (running) pauseTimer();
    else if (left != null && left > 0) resumeTimer();
    else startTimer();
  }

  handlers.current = { next, prev, toggle: toggleTimer, minutes: current.minutes ?? 0 };

  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    setStepMessage(`Step ${index + 1} of ${recipe.steps.length}. ${current.title}. ${current.text}`);
  }, [index, current.text, current.title, recipe.steps.length]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (endRef.current == null) return;
      const nextLeft = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(nextLeft);
      if (nextLeft <= 0) {
        if (finishedRef.current) return;
        finishedRef.current = true;
        endRef.current = null;
        setRunning(false);
        announceTimer(`Timer finished. ${current.title} is done.`);
        if (settings.sound) chime();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running, current.title, settings.sound]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat) return;
      if (document.querySelector("[role='dialog']")) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select")) return;
      const inControl = Boolean(target?.closest("button, a, summary"));
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handlers.current.next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlers.current.prev();
      } else if (event.key === " " && handlers.current.minutes && !inControl) {
        event.preventDefault();
        handlers.current.toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    let active = true;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    };

    async function acquire() {
      if (!active || !nav.wakeLock) return;
      try {
        lock = await nav.wakeLock.request("screen");
      } catch {
        lock = null;
      }
    }

    void acquire();
    function onVisible() {
      if (document.visibilityState === "visible") void acquire();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [recipe.id]);

  const missingUses = current.uses.filter((name) => !hasIngredient(ingredients, name));
  const stepGaps = (match?.missing ?? []).filter((gap) =>
    missingUses.some((name) => name.toLowerCase() === gap.name.toLowerCase()),
  );
  const linked = stepGaps.find((gap) => gap.offer);
  const shown = left ?? (current.minutes ? current.minutes * 60 : 0);
  const progress = left == null || !current.minutes ? 0 : shown / (current.minutes * 60);
  const perishables = perishablesUsed(recipe, ingredients);
  let timerLabel = "Not started";
  if (left === 0) timerLabel = "Done";
  else if (running) timerLabel = "Running";
  else if (left != null) timerLabel = "Paused";

  let timerButton = current.minutes ? `Start a ${current.minutes}-minute timer` : "";
  if (running) timerButton = "Pause timer";
  else if (left != null && left > 0) timerButton = "Resume timer";
  else if (left === 0) timerButton = "Restart timer";

  return (
    <div className="cook">
      <p className="sr-only" aria-live="polite">
        {stepMessage}
      </p>
      <p className="sr-only" aria-live="assertive">
        {timerMessage}
      </p>
      <div className="cook-top">
        <div>
          <p className="kicker">
            {recipe.name} · step {index + 1} of {recipe.steps.length}
          </p>
          <p className="meta">
            {recipe.minutes} min · serves {recipe.serves} · {recipe.gear}
          </p>
        </div>
        <div className="cluster">
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            Print
          </button>
          <button type="button" className="btn btn-ghost" onClick={chooseAnother}>
            Choose another meal
          </button>
          <a className="btn btn-line" href="#week">
            Leave the stove
          </a>
        </div>
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={recipe.steps.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Step ${index + 1} of ${recipe.steps.length}`}
        aria-label="Recipe progress"
      >
        <span style={{ width: `${((index + 1) / recipe.steps.length) * 100}%` }} />
      </div>

      <div className="cook-layout">
        <div>
          <h1 className="step-title">{current.title}</h1>
          <p className="step-copy">{current.text}</p>
          <p className="hint">{assumption}</p>
          {missingUses.length > 0 ? (
            <div className="notice">
              <p>{missingSentence(missingUses)}</p>
              {linked?.offer ? (
                <a href={`#offer-${linked.offer.id}`}>
                  See {linked.offer.neighbor}&apos;s {linked.name.toLowerCase()}
                </a>
              ) : null}
            </div>
          ) : null}
          {current.uses.length > 0 ? (
            <ul className="cluster" role="list" aria-label="Ingredients for this step">
              {current.uses.map((name) => {
                const ok = hasIngredient(ingredients, name);
                return (
                  <li key={name} className="pill">
                    {ok ? name : `${name} · missing`}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="timer-block">
          {current.minutes ? (
            <>
              <div className="timer">
                <Ring progress={progress} />
                <p className="timer-readout">{left === 0 ? "Done" : formatClock(shown)}</p>
              </div>
              <p className="timer-status">{timerLabel}</p>
              <button type="button" className="btn btn-primary" onClick={toggleTimer}>
                {timerButton}
              </button>
            </>
          ) : (
            <p className="hint">This step has no set time.</p>
          )}
        </div>
      </div>

      <div className="cook-bar">
        <button type="button" className="btn btn-ghost" onClick={prev} disabled={index === 0}>
          Previous step
        </button>
        <button type="button" className="btn btn-primary" onClick={next}>
          {index === recipe.steps.length - 1 ? "Dinner is ready" : "Next step"}
        </button>
      </div>
      <p className="hint">Arrow keys change the step. Space runs the timer.</p>

      <section className="section" aria-labelledby="path-heading">
        <h2 id="path-heading">The whole path</h2>
        <ol className="path" role="list">
          {recipe.steps.map((item, stepIndex) => (
            <li key={item.title}>
              <button
                type="button"
                className={stepIndex === index ? "path-step is-current" : "path-step"}
                aria-current={stepIndex === index ? "step" : undefined}
                onClick={() => go(stepIndex)}
              >
                <span className="path-index">{stepIndex + 1}</span>
                <span>
                  <strong>{item.title}</strong>
                  <span className="muted">{item.minutes ? minutesLabel(item.minutes) : "No set time"}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {finishOpen ? (
        <Dialog title="Dinner is ready" onClose={() => setFinishOpen(false)}>
          <p>Tonight will be set to {recipe.name}.</p>
          {perishables.length > 0 ? (
            <>
              <p>Clear the perishable ingredients this meal used?</p>
              <ul className="bullets">
                {perishables.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ul>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setFinishOpen(false);
                    finishCook([]);
                  }}
                >
                  Leave them
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  data-autofocus
                  onClick={() => {
                    setFinishOpen(false);
                    finishCook(perishables.map((item) => item.id));
                  }}
                >
                  Clear them
                </button>
              </div>
            </>
          ) : (
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                data-autofocus
                onClick={() => {
                  setFinishOpen(false);
                  finishCook([]);
                }}
              >
                Back to the week
              </button>
            </div>
          )}
        </Dialog>
      ) : null}
    </div>
  );
}

function Ring({ progress }: { progress: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.max(0, Math.min(1, progress)) * circumference;
  return (
    <svg viewBox="0 0 120 120" className="ring" aria-hidden="true">
      <circle className="ring-track" cx="60" cy="60" r={radius} />
      <circle
        className="ring-value"
        cx="60"
        cy="60"
        r={radius}
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}
