import type { Bin, Ingredient, Match, Offer, Recipe, View } from "./types";

export const BIN_LABEL: Record<Bin, string> = {
  fridge: "Fridge",
  pantry: "Pantry",
  counter: "Counter",
};

export const VIEWS: View[] = ["landing", "week", "kitchen", "cook", "share", "plan", "why"];

export function isView(value: string): value is View {
  return (VIEWS as string[]).includes(value);
}

export function parseHash(hash: string): { view: View; focusId: string | null } {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return { view: "landing", focusId: null };
  if (raw.startsWith("offer-")) return { view: "share", focusId: raw };
  if (isView(raw)) return { view: raw, focusId: null };
  return { view: "landing", focusId: null };
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isoFromOffset(offset: number, today = new Date()) {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function daysUntil(iso: string, today = new Date()) {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export type Urgency = "urgent" | "soon" | "steady" | "none";

export function urgencyOf(iso?: string): Urgency {
  if (!iso) return "none";
  const days = daysUntil(iso);
  if (days <= 1) return "urgent";
  if (days <= 4) return "soon";
  return "steady";
}

export function formatDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function useByLabel(iso?: string, compact = false) {
  if (!iso) return "Keeps";
  const days = daysUntil(iso);
  if (days < 0) return compact ? "Past date" : "Past its date";
  if (days === 0) return "Use today";
  if (days === 1) return compact ? "Tomorrow" : "Use tomorrow";
  if (compact) {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    return `${weekday} ${day}`;
  }
  return `Use by ${formatDay(iso)}`;
}

export function longDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function monthName(date = new Date()) {
  return date.toLocaleDateString(undefined, { month: "long" });
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

export function formatClock(total: number) {
  const safe = Math.max(0, total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function minutesLabel(minutes: number) {
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

export function sortIngredients(items: Ingredient[]) {
  const rank: Record<Urgency, number> = { urgent: 0, soon: 1, steady: 2, none: 3 };
  return items.slice().sort((a, b) => {
    const byNeed = rank[urgencyOf(a.useBy)] - rank[urgencyOf(b.useBy)];
    if (byNeed !== 0) return byNeed;
    const aDays = a.useBy ? daysUntil(a.useBy) : 99;
    const bDays = b.useBy ? daysUntil(b.useBy) : 99;
    if (aDays !== bDays) return aDays - bDays;
    return a.name.localeCompare(b.name);
  });
}

export function kitchenHeadline(items: Ingredient[]) {
  const urgent = sortIngredients(items).filter((item) => urgencyOf(item.useBy) === "urgent");
  if (urgent.length === 1) return `The ${urgent[0].name.toLowerCase()} won't wait.`;
  if (urgent.length === 2) {
    return `The ${urgent[0].name.toLowerCase()} and the ${urgent[1].name.toLowerCase()} won't wait.`;
  }
  if (urgent.length > 2) return `${urgent.length} things won't wait.`;
  const soon = items.filter((item) => urgencyOf(item.useBy) === "soon");
  if (soon.length > 0) return "Nothing spoils today. A few things are close.";
  if (items.length === 0) return "Your kitchen is quiet.";
  return "The kitchen can wait.";
}

export function planDays(today = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    const title =
      index === 0 ? "Tonight" : index === 1 ? "Tomorrow" : date.toLocaleDateString(undefined, { weekday: "long" });
    const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { index, title, dateLabel };
  });
}

function offerFor(name: string, offers: Offer[]) {
  return offers.find(
    (offer) => !offer.claimed && !offer.mine && offer.provides.toLowerCase() === name.toLowerCase(),
  );
}

export function matchRecipe(recipe: Recipe, ingredients: Ingredient[], offers: Offer[]): Match {
  const have = (name: string) => ingredients.some((item) => item.name.toLowerCase() === name.toLowerCase());
  const missing = recipe.needs
    .filter((name) => !have(name))
    .map((name) => ({ name, offer: offerFor(name, offers) }));
  const optional = recipe.optional
    .filter((name) => !have(name))
    .map((name) => ({ name, offer: offerFor(name, offers) }));

  let spoilIn: number | null = null;
  let spoilName: string | null = null;
  for (const item of ingredients) {
    if (!item.useBy) continue;
    if (!recipe.needs.some((name) => name.toLowerCase() === item.name.toLowerCase())) continue;
    const days = daysUntil(item.useBy);
    if (spoilIn == null || days < spoilIn) {
      spoilIn = days;
      spoilName = item.name;
    }
  }

  return { recipe, missing, optional, ready: missing.length === 0, spoilIn, spoilName };
}

export function sortMatches(matches: Match[]) {
  return matches.slice().sort((a, b) => {
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    const aSpoil = a.spoilIn ?? 99;
    const bSpoil = b.spoilIn ?? 99;
    if (aSpoil !== bSpoil) return aSpoil - bSpoil;
    return a.recipe.minutes - b.recipe.minutes;
  });
}

export function spoilLine(match: Match) {
  if (match.spoilIn == null || !match.spoilName || match.spoilIn > 2) return null;
  const name = match.spoilName.toLowerCase();
  if (match.spoilIn <= 0) return `Use the ${name} today.`;
  if (match.spoilIn === 1) return `Use the ${name} tomorrow.`;
  return `Use the ${name} in the next few days.`;
}

export function gapLine(match: Match) {
  if (match.missing.length === 0) return "Nothing else to buy.";
  return match.missing
    .map((gap) =>
      gap.offer
        ? `Needs ${gap.name.toLowerCase()} · ${gap.offer.neighbor} has some, ${gap.offer.distance}`
        : `Needs ${gap.name.toLowerCase()}`,
    )
    .join(". ");
}

export function optionalLine(match: Match) {
  const pending = match.optional.find((gap) => gap.offer);
  if (!pending?.offer) return null;
  return `${pending.name} would brighten it. ${pending.offer.neighbor} has one, ${pending.offer.distance}.`;
}

export function suggestPlan(plan: (string | null)[], matches: Match[]) {
  const readyIds = matches.filter((match) => match.ready).map((match) => match.recipe.id);
  if (readyIds.length === 0) return plan;
  let cursor = 0;
  return plan.map((slot) => {
    if (slot) return slot;
    const id = readyIds[cursor % readyIds.length];
    cursor += 1;
    return id;
  });
}

export function planNeedsFill(plan: (string | null)[], matches: Match[]) {
  if (!matches.some((match) => match.ready)) return false;
  return plan.some((slot) => !slot);
}

export function perishablesUsed(recipe: Recipe, ingredients: Ingredient[]) {
  return ingredients.filter(
    (item) => item.useBy && recipe.needs.some((name) => name.toLowerCase() === item.name.toLowerCase()),
  );
}

export function hasIngredient(ingredients: Ingredient[], name: string) {
  return ingredients.some((item) => item.name.toLowerCase() === name.toLowerCase());
}

export function missingSentence(names: string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is not in the kitchen yet.`;
  const head = names.slice(0, -1).join(", ");
  return `${head} and ${names[names.length - 1]} are not in the kitchen yet.`;
}
