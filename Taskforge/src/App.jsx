import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DUE_OPTIONS,
  ENERGY,
  SAMPLE,
  TIMES,
  blockMinutes,
  byDue,
  courseLanes,
  energyLabel,
  explain,
  normalizeTask,
  pickNext,
  weighTask,
} from './model';

const TASKS_KEY = 'halcyon.tasks.v1';
const LEGACY_TASKS_KEY = 'taskforge.tasks.v1';
const PREF_KEY = 'halcyon.prefs.v1';
const LEGACY_PREF_KEY = 'taskforge.prefs.v1';
const LOG_KEY = 'halcyon.log.v1';
const VIEWS = [
  { id: 'desk', label: 'Desk' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'log', label: 'Log' },
];

function readStored(key, legacyKey) {
  return localStorage.getItem(key) ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
}

function loadTasks() {
  try {
    const raw = readStored(TASKS_KEY, LEGACY_TASKS_KEY);
    if (!raw) return SAMPLE.map((task) => ({ ...task }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SAMPLE.map((task) => ({ ...task }));
    return parsed.map(normalizeTask).filter((task) => task && task.id);
  } catch {
    return SAMPLE.map((task) => ({ ...task }));
  }
}

function loadLarge() {
  try {
    return JSON.parse(readStored(PREF_KEY, LEGACY_PREF_KEY) ?? '{}').large === true;
  } catch {
    return false;
  }
}

function loadLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

function emptyDraft() {
  return {
    title: '',
    course: '',
    due: 'week',
    energy: 'steady',
    minutes: '25',
    firstStep: '',
  };
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatClock(total) {
  const safe = Math.max(0, total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function waitingCopy(count) {
  if (count === 0) return 'Nothing else is unfinished.';
  if (count === 1) return '1 other thing stays off this screen until you open the list.';
  return `${count} other things stay off this screen until you open the list.`;
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [large, setLarge] = useState(loadLarge);
  const [log, setLog] = useState(loadLog);
  const [view, setView] = useState('desk');
  const [energy, setEnergy] = useState(null);
  const [minutes, setMinutes] = useState(25);
  const [phase, setPhase] = useState('checkin');
  const [skipIds, setSkipIds] = useState([]);
  const [announce, setAnnounce] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [lastDone, setLastDone] = useState('');
  const [checkError, setCheckError] = useState('');
  const [formError, setFormError] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const headingRef = useRef(null);
  const timerOrigin = useRef(0);
  const skipInitialFocus = useRef(true);
  const previousRemaining = useRef(0);

  const openTasks = useMemo(
    () => tasks.filter((task) => !task.done).slice().sort(byDue),
    [tasks],
  );
  const doneTasks = useMemo(
    () => tasks.filter((task) => task.done),
    [tasks],
  );
  const choice = useMemo(
    () => pickNext(tasks, { energy: energy ?? 'low', minutes, skipIds }),
    [tasks, energy, minutes, skipIds],
  );
  const focusTask = tasks.find((task) => task.id === focusId) ?? null;
  const lanes = useMemo(() => courseLanes(tasks), [tasks]);
  const weights = choice.task && energy ? weighTask(choice.task, { energy, minutes }) : [];
  const queue = (choice.ranked ?? []).slice(1, 3);
  const sectionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ large }));
    document.documentElement.classList.toggle('text-large', large);
  }, [large]);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }, [log]);

  const focusKey =
    phase === 'focus'
      ? `focus:${focusId ?? ''}`
      : phase === 'next'
        ? `next:${choice.task?.id ?? 'none'}`
        : 'checkin';

  useEffect(() => {
    if (skipInitialFocus.current) {
      skipInitialFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [focusKey]);

  useEffect(() => {
    if (phase !== 'focus' || !running) return undefined;
    const id = window.setInterval(() => {
      setRemaining((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, running]);

  useEffect(() => {
    if (phase === 'focus' && running && remaining === 0) setRunning(false);
  }, [phase, running, remaining]);

  useEffect(() => {
    if (running && remaining > 0 && remaining !== timerOrigin.current && remaining % 60 === 0) {
      const left = remaining / 60;
      setAnnounce(`${left} minute${left === 1 ? '' : 's'} left.`);
    }
  }, [remaining, running]);

  useEffect(() => {
    if (phase === 'focus' && previousRemaining.current > 0 && remaining === 0) {
      setAnnounce('Time is up. You can mark this done or add five minutes.');
    }
    previousRemaining.current = remaining;
  }, [phase, remaining]);

  useEffect(() => {
    if (phase === 'focus') document.title = 'Focus · Halcyon Ledger';
    else if (view === 'ledger') document.title = 'Ledger · Halcyon Ledger';
    else if (view === 'log') document.title = 'Log · Halcyon Ledger';
    else if (phase === 'checkin') document.title = 'Halcyon Ledger';
    else if (!choice.task && openTasks.length === 0) document.title = 'Week clear · Halcyon Ledger';
    else document.title = 'Next step · Halcyon Ledger';
  }, [phase, view, choice.task, openTasks.length]);

  useEffect(() => {
    if (view === 'desk' || phase === 'focus') return;
    sectionRef.current?.focus();
  }, [view, phase]);

  function begin(event) {
    event.preventDefault();
    if (!energy) {
      setCheckError('Choose an energy level first.');
      return;
    }
    setCheckError('');
    setLastDone('');
    setView('desk');
    setPhase('next');
  }

  function startFocus() {
    if (!choice.task) return;
    const seconds = blockMinutes(choice.task, minutes) * 60;
    timerOrigin.current = seconds;
    setFocusId(choice.task.id);
    setRemaining(seconds);
    setRunning(true);
    setLastDone('');
    setView('desk');
    setPhase('focus');
    setAnnounce(`Focus started. ${seconds / 60} minutes on the clock.`);
  }

  function toggleRun() {
    const next = !running;
    const left = Math.max(1, Math.ceil(remaining / 60));
    setRunning(next);
    setAnnounce(next ? `Resumed. About ${left} minute${left === 1 ? '' : 's'} left.` : 'Paused.');
  }

  function addFive() {
    timerOrigin.current = -1;
    setRemaining((value) => value + 300);
    setRunning(true);
    setAnnounce('Five minutes added.');
  }

  function leaveFocus() {
    setRunning(false);
    setPhase('next');
    setAnnounce('Left the focus block. The step is still unfinished.');
  }

  function finish(id) {
    const task = tasks.find((item) => item.id === id);
    setTasks((current) => current.map((item) => (item.id === id ? { ...item, done: true } : item)));
    setSkipIds((current) => current.filter((item) => item !== id));
    setRunning(false);
    setFocusId(null);
    if (phase !== 'checkin') setPhase('next');
    setLastDone(task ? `Done. “${task.title}” is off the list.` : 'Done.');
    setAnnounce(task ? `Done. ${task.title} is off the list.` : 'Done.');
    if (task) {
      setLog((entries) =>
        [
          {
            id: uid(),
            title: task.title,
            course: task.course,
            minutes: blockMinutes(task, minutes),
            energy: task.energy,
            at: new Date().toISOString(),
          },
          ...entries,
        ].slice(0, 40),
      );
    }
    setView('desk');
  }

  function reopen(id) {
    setTasks((current) => current.map((item) => (item.id === id ? { ...item, done: false } : item)));
    setAnnounce('Put back on the list.');
  }

  function skip(id) {
    setLastDone('');
    setSkipIds((current) => (current.includes(id) ? current : [...current, id]));
    setAnnounce('Set aside for now.');
  }

  function makeNext(id) {
    if (!energy) {
      setCheckError('Choose an energy level first.');
      setAnnounce('Choose an energy level first.');
      setPhase('checkin');
      return;
    }
    setSkipIds(tasks.filter((task) => !task.done && task.id !== id).map((task) => task.id));
    setPhase('next');
    setView('desk');
    setLastDone('');
    setAnnounce('That one is the next step now.');
  }

  function removeTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setSkipIds((current) => current.filter((item) => item !== id));
    if (focusId === id) {
      setRunning(false);
      setPhase('next');
      setFocusId(null);
    }
    setAnnounce('Removed from the week.');
  }

  function addTask(event) {
    event.preventDefault();
    const title = draft.title.trim();
    const firstStep = draft.firstStep.trim();
    const minutesValue = Number(draft.minutes);
    if (!title || !firstStep) {
      setFormError('Add a name and the first physical step.');
      return;
    }
    if (!Number.isFinite(minutesValue) || minutesValue < 5 || minutesValue > 180) {
      setFormError('Minutes should be between 5 and 180.');
      return;
    }
    const due = DUE_OPTIONS.find((option) => option.id === draft.due) ?? DUE_OPTIONS[3];
    const task = normalizeTask({
      id: uid(),
      title,
      course: draft.course.trim() || 'General',
      dueLabel: due.label,
      dueRank: due.rank,
      energy: draft.energy,
      minutes: minutesValue,
      firstStep,
      done: false,
    });
    setTasks((current) => [...current, task]);
    setDraft(emptyDraft());
    setFormError('');
    setAnnounce(`Added ${title}.`);
  }

  function restoreSample() {
    setTasks(SAMPLE.map((task) => ({ ...task })));
    setSkipIds([]);
    setEnergy(null);
    setMinutes(25);
    setPhase('checkin');
    setRunning(false);
    setFocusId(null);
    setLastDone('');
    setCheckError('');
    setFormError('');
    setLog([]);
    setView('desk');
    setAnnounce('Sample week restored.');
  }

  const others = openTasks.filter((task) => task.id !== choice.task?.id).length;

  return (
    <div className="app" data-mode={phase === 'focus' ? 'focus' : 'plan'}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="wrap">
        <header className="top">
          <div>
            <p className="brand">Halcyon Ledger</p>
            <p className="eyebrow">One next step for the week</p>
          </div>
          <div className="top-actions">
            <p className="progress">
              {doneTasks.length} of {tasks.length} done
            </p>
            <button
              type="button"
              className="ghost"
              aria-pressed={large}
              onClick={() => setLarge((value) => !value)}
            >
              {large ? 'Default text size' : 'Larger text'}
            </button>
          </div>
        </header>

        {phase !== 'focus' && (
          <nav className="nav" aria-label="Desks">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={view === item.id ? 'page' : undefined}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <main id="main" tabIndex={-1}>
          {phase === 'checkin' && view === 'desk' && (
            <form onSubmit={begin}>
              <h1 ref={headingRef} tabIndex={-1}>
                What can you give this block?
              </h1>
              <p className="lede">
                Maya’s week mixes a lab report, a quiz email, a group chat, and a Thursday evening shift.
                She loses the start when they all show up at once. Mark the energy and the minutes that
                are real. Halcyon Ledger puts one step on the desk and keeps the courses in the ledger.
              </p>
              <p className="meta">
                {openTasks.length} unfinished · {doneTasks.length} done. The rest stay saved in this browser.
              </p>

              <div
                className="choices"
                role="group"
                aria-labelledby="energy-label"
                aria-describedby={checkError ? 'energy-error' : undefined}
              >
                <p id="energy-label" className="time-label">
                  Energy right now
                </p>
                {ENERGY.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    className="choice"
                    aria-pressed={energy === level.id}
                    onClick={() => {
                      setEnergy(level.id);
                      setCheckError('');
                    }}
                  >
                    <span className="choice-label">{level.label}</span>
                    <span className="choice-hint">{level.hint}</span>
                    {energy === level.id && <span className="selected">Selected</span>}
                  </button>
                ))}
              </div>
              {checkError && (
                <p id="energy-error" className="error" role="alert">
                  {checkError}
                </p>
              )}

              <p id="time-label" className="time-label">
                Minutes that are actually free
              </p>
              <div className="chips" role="group" aria-labelledby="time-label">
                {TIMES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="chip"
                    aria-pressed={minutes === value}
                    onClick={() => setMinutes(value)}
                  >
                    {minutes === value ? `${value} min, selected` : `${value} min`}
                  </button>
                ))}
              </div>

              <button type="submit" className="primary">
                Show my next step
              </button>
            </form>
          )}

          {phase === 'next' && view === 'desk' && choice.task && (
            <>
              {lastDone && <p className="banner">{lastDone}</p>}
              <p className="now">
                <span>
                  {energyLabel(energy)} energy · {minutes} minutes
                </span>
                <button type="button" className="link" onClick={() => setPhase('checkin')}>
                  Change
                </button>
              </p>
              <article className="hero">
                <p className="kicker">Next step</p>
                <h1 ref={headingRef} tabIndex={-1} className="step">
                  {choice.task.firstStep}
                </h1>
                <p className="meta">
                  {choice.task.course} · {choice.task.title} · due {choice.task.dueLabel.toLowerCase()} ·{' '}
                  {choice.task.minutes} min · {energyLabel(choice.task.energy).toLowerCase()} energy
                </p>
                <p className="why">{explain(choice.task, { energy, minutes, ...choice })}</p>
                <p className="waiting">{waitingCopy(others)}</p>
                <div className="actions">
                  <button type="button" className="primary" onClick={startFocus}>
                    {choice.stretched
                      ? `Start the first ${blockMinutes(choice.task, minutes)} minutes`
                      : `Start ${blockMinutes(choice.task, minutes)} minutes`}
                  </button>
                  <button type="button" className="ghost" onClick={() => skip(choice.task.id)}>
                    Not this one
                  </button>
                  <button type="button" className="ghost" onClick={() => finish(choice.task.id)}>
                    It’s done
                  </button>
                </div>
              </article>
              {weights.length > 0 && (
                <section className="scores" aria-label="How this step was weighed">
                  <h2>How this step was weighed</h2>
                  <ul className="meters">
                    {weights.map((meter) => (
                      <li key={meter.id} className="meter">
                        <span className="meter-label">{meter.label}</span>
                        <span className="meter-track">
                          <span className="meter-fill" style={{ width: `${meter.value}%` }} />
                        </span>
                        <span className="meter-value">{meter.value}</span>
                        <span className="meter-note">{meter.note}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="meta">Due still comes before a perfect clock. The bars explain the order.</p>
                </section>
              )}
              {queue.length > 0 && (
                <section className="queue">
                  <h2>Standing behind it</h2>
                  <ul>
                    {queue.map((task) => (
                      <li key={task.id}>
                        <p className="row-title">{task.firstStep}</p>
                        <p className="meta">
                          {task.course} · due {task.dueLabel.toLowerCase()} · {task.minutes} min
                        </p>
                        <button type="button" className="ghost" onClick={() => makeNext(task.id)}>
                          Bring this forward
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {phase === 'next' && view === 'desk' && !choice.task && openTasks.length > 0 && (
            <section>
              <h1 ref={headingRef} tabIndex={-1}>
                Those are set aside.
              </h1>
              <p className="lede">Every unfinished task was skipped for this block. You can bring them back.</p>
              <button type="button" className="primary" onClick={() => setSkipIds([])}>
                Bring them back
              </button>
            </section>
          )}

          {phase === 'next' && view === 'desk' && openTasks.length === 0 && (
            <section>
              <h1 ref={headingRef} tabIndex={-1}>
                The week is clear.
              </h1>
              <p className="lede">
                Everything on the list is done. Add something below, or restore Maya’s sample week to walk
                through it again.
              </p>
              {lastDone && <p className="banner">{lastDone}</p>}
              <button type="button" className="primary" onClick={restoreSample}>
                Restore the sample week
              </button>
            </section>
          )}

          {phase === 'focus' && focusTask && (
            <section className="focus-block">
              <p className="kicker">Stay with this</p>
              <h1 ref={headingRef} tabIndex={-1} className="step">
                {focusTask.firstStep}
              </h1>
              <p className="meta">
                {focusTask.course} · {focusTask.title}
              </p>
              <p className="clock" aria-hidden="true">
                {formatClock(remaining)}
              </p>
              <p className="why">
                {remaining === 0
                  ? 'Time is up. Mark it done if the step happened, or add five minutes.'
                  : 'The clock matches the block you said you had. The rest of the week is off this page.'}
              </p>
              <div className="actions">
                {remaining === 0 ? (
                  <button type="button" className="primary" onClick={() => finish(focusTask.id)}>
                    Mark done
                  </button>
                ) : (
                  <button type="button" className="primary" onClick={toggleRun}>
                    {running ? 'Pause' : 'Resume'}
                  </button>
                )}
                <button type="button" className="ghost" onClick={addFive}>
                  Add 5 minutes
                </button>
                {remaining > 0 && (
                  <button type="button" className="ghost" onClick={() => finish(focusTask.id)}>
                    I finished it
                  </button>
                )}
                <button type="button" className="link" onClick={leaveFocus}>
                  Leave this block
                </button>
              </div>
            </section>
          )}

          {phase !== 'focus' && view === 'desk' && (
            <>
              <details className="drawer">
                <summary>The rest of the week ({openTasks.length} unfinished)</summary>
                {openTasks.length === 0 ? (
                  <p className="meta">Nothing unfinished.</p>
                ) : (
                  <ul className="rows">
                    {openTasks.map((task) => (
                      <li key={task.id} className="row">
                        <div>
                          {task.id === choice.task?.id && phase === 'next' && (
                            <span className="pill">On screen now</span>
                          )}
                          {skipIds.includes(task.id) && <span className="pill">Set aside</span>}
                          <p className="row-title">{task.title}</p>
                          <p className="meta">
                            {task.course} · due {task.dueLabel.toLowerCase()} · {task.minutes} min ·{' '}
                            {energyLabel(task.energy).toLowerCase()} energy
                          </p>
                          <p className="row-step">{task.firstStep}</p>
                        </div>
                        <div className="row-actions">
                          <button type="button" onClick={() => makeNext(task.id)}>
                            Make this the step
                          </button>
                          <button type="button" onClick={() => finish(task.id)}>
                            Mark done
                          </button>
                          <button type="button" onClick={() => removeTask(task.id)}>
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </details>

              <details className="drawer">
                <summary>Add a task</summary>
                <form className="form" onSubmit={addTask} autoComplete="off">
                  <label>
                    Name
                    <input
                      value={draft.title}
                      maxLength={140}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, title: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    First physical step
                    <textarea
                      value={draft.firstStep}
                      maxLength={240}
                      placeholder="Open the doc and write the first sentence."
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, firstStep: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <div className="pair">
                    <label>
                      Course
                      <input
                        value={draft.course}
                        maxLength={80}
                        placeholder="Bio 210"
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, course: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Due
                      <select
                        value={draft.due}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, due: event.target.value }))
                        }
                      >
                        {DUE_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Minutes
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={draft.minutes}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, minutes: event.target.value }))
                        }
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Energy it needs
                    <select
                      value={draft.energy}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, energy: event.target.value }))
                      }
                    >
                      {ENERGY.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {formError && (
                    <p className="error" role="alert">
                      {formError}
                    </p>
                  )}
                  <button type="submit" className="primary">
                    Add to the week
                  </button>
                </form>
              </details>

              <details className="drawer">
                <summary>Finished ({doneTasks.length})</summary>
                {doneTasks.length === 0 ? (
                  <p className="meta">Nothing finished yet. Completing a step lands it here.</p>
                ) : (
                  <ul className="rows">
                    {doneTasks.map((task) => (
                      <li key={task.id} className="row">
                        <p className="done-title">{task.title}</p>
                        <p className="meta">{task.course}</p>
                        <div className="row-actions">
                          <button type="button" onClick={() => reopen(task.id)}>
                            Put back
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </>
          )}

          {phase !== 'focus' && view === 'ledger' && (
            <section>
              <h1 ref={sectionRef} tabIndex={-1}>
                The week by course
              </h1>
              <p className="lede">
                Each course is a lane. The bar is open minutes, so a long lab does not hide a short message
                that is due sooner. The desk still chooses one step.
              </p>
              {lanes.length === 0 ? (
                <p className="meta">Nothing unfinished. The ledger is clear.</p>
              ) : (
                <div className="lanes">
                  {lanes.map((lane) => {
                    const heaviest = Math.max(...lanes.map((item) => item.minutes), 1);
                    return (
                      <article key={lane.course} className="lane">
                        <h2>{lane.course}</h2>
                        <p className="meta">
                          {lane.count} open · {lane.minutes} min
                        </p>
                        <span className="meter-track" aria-hidden="true">
                          <span
                            className="meter-fill"
                            style={{ width: `${Math.round((lane.minutes / heaviest) * 100)}%` }}
                          />
                        </span>
                        <ul className="rows">
                          {lane.tasks.map((task) => (
                            <li key={task.id} className="row">
                              <p className="row-title">{task.title}</p>
                              <p className="meta">
                                Due {task.dueLabel.toLowerCase()} · {task.minutes} min ·{' '}
                                {energyLabel(task.energy).toLowerCase()} energy
                              </p>
                              <p className="row-step">{task.firstStep}</p>
                              <div className="row-actions">
                                <button type="button" onClick={() => makeNext(task.id)}>
                                  Make this the step
                                </button>
                                <button type="button" onClick={() => finish(task.id)}>
                                  Mark done
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {phase !== 'focus' && view === 'log' && (
            <section>
              <h1 ref={sectionRef} tabIndex={-1}>
                Blocks you have closed
              </h1>
              <p className="lede">
                Finishing a step writes a line here: the course, the minutes that fit the block, and when
                it closed. The desk stays clear of that history.
              </p>
              {log.length === 0 ? (
                <p className="meta">Nothing closed yet.</p>
              ) : (
                <ul className="rows">
                  {log.map((entry) => (
                    <li key={entry.id} className="row">
                      <p className="row-title">{entry.title}</p>
                      <p className="meta">
                        {entry.course} · {entry.minutes} min · {energyLabel(entry.energy).toLowerCase()}{' '}
                        energy · {formatWhen(entry.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </main>

        {phase !== 'focus' && (
          <footer className="foot">
            <button type="button" className="link" onClick={restoreSample}>
              Restore the sample week
            </button>
            <p>Saved in this browser. Nothing is sent to a server.</p>
          </footer>
        )}
      </div>
      <div className="sr" aria-live="polite">
        {announce}
      </div>
    </div>
  );
}
