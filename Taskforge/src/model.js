export const ENERGY = [
  { id: 'low', label: 'Low', hint: 'Foggy, tired, or between classes', rank: 0 },
  { id: 'steady', label: 'Steady', hint: 'You can follow a short procedure', rank: 1 },
  { id: 'sharp', label: 'Sharp', hint: 'You can hold something hard', rank: 2 },
];

export const TIMES = [10, 25, 45, 90];

export const DUE_OPTIONS = [
  { id: 'today', label: 'Today', rank: 0 },
  { id: 'tonight', label: 'Tonight', rank: 1 },
  { id: 'tomorrow', label: 'Tomorrow', rank: 2 },
  { id: 'week', label: 'This week', rank: 5 },
  { id: 'later', label: 'Later', rank: 9 },
];

export const SAMPLE = [
  {
    id: 'group-chat',
    title: 'Settle who submits the slides',
    course: 'Bio 210 group',
    dueLabel: 'Today',
    dueRank: 0,
    energy: 'low',
    minutes: 10,
    firstStep: 'Send one message naming who submits the slides tonight.',
    done: false,
  },
  {
    id: 'email-quiz',
    title: 'Ask about the missed quiz',
    course: 'Bio 110',
    dueLabel: 'Today',
    dueRank: 0,
    energy: 'low',
    minutes: 15,
    firstStep: 'Open mail and write the first line to Professor Adeyemi about Thursday’s quiz.',
    done: false,
  },
  {
    id: 'pack-lab',
    title: 'Pack for the 7am lab',
    course: 'Bio 210 lab',
    dueLabel: 'Tonight',
    dueRank: 1,
    energy: 'low',
    minutes: 10,
    firstStep: 'Put the lab coat, goggles, and notebook by the door.',
    done: false,
  },
  {
    id: 'lab-discussion',
    title: 'Start the discussion section',
    course: 'Bio 210 lab',
    dueLabel: 'Tomorrow',
    dueRank: 2,
    energy: 'steady',
    minutes: 45,
    firstStep: 'Open the lab doc and write what the result showed, in one sentence.',
    done: false,
  },
  {
    id: 'chem-prelab',
    title: 'Answer the pre-lab',
    course: 'Chem 201',
    dueLabel: 'Wednesday',
    dueRank: 3,
    energy: 'steady',
    minutes: 30,
    firstStep: 'Answer pre-lab question 1 only.',
    done: false,
  },
  {
    id: 'ecology-read',
    title: 'Read before the Thursday shift',
    course: 'Bio 240',
    dueLabel: 'Thursday',
    dueRank: 4,
    energy: 'low',
    minutes: 20,
    firstStep: 'Open the ecology PDF at page 42 and read to the next heading.',
    done: false,
  },
  {
    id: 'problem-set',
    title: 'Problem set 4, first two questions',
    course: 'Chem 201',
    dueLabel: 'Friday',
    dueRank: 5,
    energy: 'sharp',
    minutes: 50,
    firstStep: 'Rewrite problem-set question 1 in your own words.',
    done: false,
  },
  {
    id: 'essay-outline',
    title: 'Outline the essay introduction',
    course: 'Writing 105',
    dueLabel: 'Next Monday',
    dueRank: 8,
    energy: 'sharp',
    minutes: 40,
    firstStep: 'Write three bullets: the claim, the evidence, and why it matters.',
    done: false,
  },
];

const ENERGY_IDS = new Set(ENERGY.map((item) => item.id));

export function energyLabel(id) {
  return ENERGY.find((item) => item.id === id)?.label ?? 'Steady';
}

function energyRank(id) {
  return ENERGY.find((item) => item.id === id)?.rank ?? 1;
}

export function normalizeTask(task) {
  if (!task || typeof task !== 'object') return null;
  const minutes = Number(task.minutes);
  return {
    id: String(task.id ?? ''),
    title: String(task.title ?? 'Untitled').slice(0, 140),
    course: String(task.course ?? 'General').slice(0, 80),
    dueLabel: String(task.dueLabel ?? 'Later').slice(0, 40),
    dueRank: Number.isFinite(Number(task.dueRank)) ? Number(task.dueRank) : 9,
    energy: ENERGY_IDS.has(task.energy) ? task.energy : 'steady',
    minutes: Number.isFinite(minutes) ? Math.min(180, Math.max(5, minutes)) : 25,
    firstStep: String(task.firstStep ?? task.title ?? 'Name the first move.').slice(0, 240),
    done: Boolean(task.done),
  };
}

export function byDue(a, b) {
  if (a.dueRank !== b.dueRank) return a.dueRank - b.dueRank;
  if (a.minutes !== b.minutes) return a.minutes - b.minutes;
  return a.title.localeCompare(b.title);
}

export function blockMinutes(task, minutes) {
  if (!task) return minutes;
  return Math.min(task.minutes, minutes);
}

function orderedPool(tasks, { energy, minutes, skipIds }) {
  const skip = new Set(skipIds);
  const open = tasks.filter((task) => !task.done && task.id && !skip.has(task.id));
  const userRank = energyRank(energy);
  const energyFits = open.filter((task) => energyRank(task.energy) <= userRank);
  const energyFallback = energyFits.length === 0 && open.length > 0;
  const pool = energyFits.length ? energyFits : open;
  const ranked = pool.slice().sort((a, b) => {
    if (a.dueRank !== b.dueRank) return a.dueRank - b.dueRank;
    const aFit = a.minutes <= minutes ? 0 : 1;
    const bFit = b.minutes <= minutes ? 0 : 1;
    if (aFit !== bFit) return aFit - bFit;
    if (a.minutes !== b.minutes) return a.minutes - b.minutes;
    return a.title.localeCompare(b.title);
  });
  return { ranked, energyFallback };
}

// Soonest due wins. Within the same due time, a task that fits the clock beats a longer one.
export function pickNext(tasks, options) {
  const { ranked, energyFallback } = orderedPool(tasks, options);
  const task = ranked[0] ?? null;
  return {
    task,
    ranked,
    stretched: Boolean(task && task.minutes > options.minutes),
    energyFallback,
  };
}

export function weighTask(task, { energy, minutes }) {
  const userRank = energyRank(energy);
  const taskRank = energyRank(task.energy);
  const due = Math.max(8, Math.round((1 - Math.min(task.dueRank, 9) / 9) * 100));
  const energyScore = taskRank <= userRank ? 100 - (userRank - taskRank) * 12 : 28;
  const fit = task.minutes <= minutes ? 100 : Math.max(8, Math.round((minutes / task.minutes) * 100));
  return [
    { id: 'due', label: 'Due', value: due, note: task.dueLabel },
    { id: 'energy', label: 'Energy', value: energyScore, note: energyLabel(task.energy) },
    { id: 'fit', label: 'Clock', value: fit, note: `${task.minutes} min` },
  ];
}

export function courseLanes(tasks) {
  const lanes = new Map();
  tasks.forEach((task) => {
    if (task.done) return;
    const lane = lanes.get(task.course) ?? {
      course: task.course,
      minutes: 0,
      count: 0,
      tasks: [],
    };
    lane.minutes += task.minutes;
    lane.count += 1;
    lane.tasks.push(task);
    lanes.set(task.course, lane);
  });
  return [...lanes.values()]
    .map((lane) => ({ ...lane, tasks: lane.tasks.slice().sort(byDue) }))
    .sort((a, b) => b.minutes - a.minutes || a.course.localeCompare(b.course));
}

export function explain(task, { energy, minutes, stretched, energyFallback }) {
  if (!task) return '';
  if (energyFallback) {
    return `What is left needs more focus than you marked. The timer will run for the ${minutes} minutes you have, then you stop.`;
  }
  if (stretched) {
    return `This is due ${task.dueLabel.toLowerCase()}, and it needs about ${task.minutes} minutes. The timer will run for the ${minutes} you actually have.`;
  }
  const level = energyLabel(energy).toLowerCase();
  return `This is the soonest work that fits ${level} energy and a ${task.minutes}-minute block.`;
}
