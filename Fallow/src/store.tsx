import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { ASSUMPTION, createIngredients, createOffers, DEFAULT_PLAN, recipes } from "./data";
import {
  isoFromOffset,
  matchRecipe,
  parseHash,
  planDays,
  sortMatches,
  suggestPlan,
  uid,
} from "./logic";
import type { Ingredient, Offer, Settings, State, Toast, View } from "./types";

const STORAGE_KEY = "fallow-kitchen-v1";

const defaultSettings: Settings = {
  scale: "md",
  theme: "paper",
  reduceMotion: false,
  sound: true,
};

function createSeedState(): State {
  return {
    view: "landing",
    ingredients: createIngredients(),
    offers: createOffers(),
    plan: [...DEFAULT_PLAN],
    recipeId: null,
    step: 0,
    settings: { ...defaultSettings },
    undo: null,
  };
}

function isIngredient(value: unknown): value is Ingredient {
  if (!value || typeof value !== "object") return false;
  const item = value as Ingredient;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.quantity === "string" &&
    (item.where === "fridge" || item.where === "pantry" || item.where === "counter")
  );
}

function isOffer(value: unknown): value is Offer {
  if (!value || typeof value !== "object") return false;
  const offer = value as Offer;
  return (
    typeof offer.id === "string" &&
    typeof offer.neighbor === "string" &&
    typeof offer.item === "string" &&
    typeof offer.provides === "string" &&
    typeof offer.when === "string" &&
    typeof offer.claimed === "boolean"
  );
}

function cleanSettings(value: unknown): Settings {
  const saved = (value ?? {}) as Partial<Settings>;
  return {
    scale: saved.scale === "sm" || saved.scale === "lg" || saved.scale === "md" ? saved.scale : "md",
    theme: saved.theme === "night" || saved.theme === "contrast" || saved.theme === "paper" ? saved.theme : "paper",
    reduceMotion: Boolean(saved.reduceMotion),
    sound: saved.sound !== false,
  };
}

function cleanPlan(value: unknown): (string | null)[] {
  if (!Array.isArray(value)) return [...DEFAULT_PLAN];
  const ids = new Set(recipes.map((recipe) => recipe.id));
  const next = value.slice(0, 7).map((item) => (typeof item === "string" && ids.has(item) ? item : null));
  while (next.length < 7) next.push(null);
  return next;
}

function loadState(): State {
  const seed = createSeedState();
  let saved: Partial<State> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw) as Partial<State>;
  } catch {
    saved = null;
  }

  const ingredients = Array.isArray(saved?.ingredients) ? saved.ingredients.filter(isIngredient) : seed.ingredients;
  const offers = Array.isArray(saved?.offers) ? saved.offers.filter(isOffer) : seed.offers;
  const plan = cleanPlan(saved?.plan);
  const settings = cleanSettings(saved?.settings);
  const recipeId =
    typeof saved?.recipeId === "string" && recipes.some((recipe) => recipe.id === saved.recipeId) ? saved.recipeId : null;
  const step = typeof saved?.step === "number" && saved.step >= 0 ? Math.floor(saved.step) : 0;

  let view: View = "landing";
  if (window.location.hash) view = parseHash(window.location.hash).view;
  else if (saved?.view && ["landing", "week", "kitchen", "cook", "share", "plan", "why"].includes(saved.view)) {
    view = saved.view;
  }

  return { view, ingredients, offers, plan, recipeId, step, settings, undo: null };
}

function withUndo(state: State, token: number, next: Omit<State, "undo">): State {
  return {
    ...next,
    undo: {
      token,
      ingredients: state.ingredients,
      offers: state.offers,
      plan: state.plan,
      recipeId: state.recipeId,
      step: state.step,
    },
  };
}

type Action =
  | { type: "view"; view: View }
  | { type: "settings"; settings: Partial<Settings> }
  | { type: "add"; item: Ingredient; token: number }
  | { type: "remove"; id: string; token: number }
  | { type: "offer"; id: string; note: string; when: string; token: number }
  | { type: "claim"; id: string; token: number }
  | { type: "take-back"; id: string; token: number }
  | { type: "set-plan"; index: number; recipeId: string | null; token: number }
  | { type: "fill-plan"; plan: (string | null)[]; token: number }
  | { type: "start-cook"; id: string }
  | { type: "set-step"; step: number }
  | { type: "clear-cook" }
  | { type: "finish"; clearIds: string[]; recipeId: string; token: number }
  | { type: "undo"; token: number }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "view":
      return state.view === action.view ? state : { ...state, view: action.view };
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "add":
      return withUndo(state, action.token, { ...state, ingredients: [...state.ingredients, action.item] });
    case "remove":
      return withUndo(state, action.token, {
        ...state,
        ingredients: state.ingredients.filter((item) => item.id !== action.id),
      });
    case "offer": {
      const item = state.ingredients.find((ingredient) => ingredient.id === action.id);
      if (!item) return state;
      const offer: Offer = {
        id: uid("offer"),
        neighbor: "You",
        item: item.name,
        provides: item.name,
        quantity: item.quantity,
        note: action.note.trim() || "Left on the step.",
        place: "Your step",
        distance: "here",
        when: action.when.trim(),
        claimed: false,
        mine: true,
        source: item,
      };
      return withUndo(state, action.token, {
        ...state,
        ingredients: state.ingredients.filter((ingredient) => ingredient.id !== item.id),
        offers: [offer, ...state.offers],
      });
    }
    case "claim": {
      const offer = state.offers.find((item) => item.id === action.id);
      if (!offer || offer.claimed || offer.mine) return state;
      const exists = state.ingredients.some((item) => item.name.toLowerCase() === offer.provides.toLowerCase());
      const ingredients = exists
        ? state.ingredients.map((item) =>
            item.name.toLowerCase() === offer.provides.toLowerCase()
              ? { ...item, note: `Also from ${offer.neighbor}.` }
              : item,
          )
        : [
            ...state.ingredients,
            {
              id: uid("ing"),
              name: offer.provides,
              quantity: offer.quantity,
              where: "counter" as const,
              useBy: isoFromOffset(2),
              note: `From ${offer.neighbor}.`,
            },
          ];
      return withUndo(state, action.token, {
        ...state,
        ingredients,
        offers: state.offers.map((item) => (item.id === offer.id ? { ...item, claimed: true } : item)),
      });
    }
    case "take-back": {
      const offer = state.offers.find((item) => item.id === action.id);
      if (!offer?.mine) return state;
      const restored: Ingredient = isIngredient(offer.source)
        ? offer.source
        : {
            id: uid("ing"),
            name: offer.provides,
            quantity: offer.quantity,
            where: "counter",
          };
      return withUndo(state, action.token, {
        ...state,
        ingredients: [...state.ingredients, restored],
        offers: state.offers.filter((item) => item.id !== offer.id),
      });
    }
    case "set-plan": {
      if (action.index < 0 || action.index > 6) return state;
      const plan = state.plan.slice();
      plan[action.index] = action.recipeId;
      return withUndo(state, action.token, { ...state, plan });
    }
    case "fill-plan":
      return withUndo(state, action.token, { ...state, plan: action.plan });
    case "start-cook": {
      const recipe = recipes.find((item) => item.id === action.id);
      if (!recipe) return state;
      const step = state.recipeId === action.id ? Math.min(state.step, recipe.steps.length - 1) : 0;
      return { ...state, view: "cook", recipeId: action.id, step };
    }
    case "set-step": {
      const recipe = recipes.find((item) => item.id === state.recipeId);
      if (!recipe) return state;
      const step = Math.max(0, Math.min(action.step, recipe.steps.length - 1));
      return { ...state, step };
    }
    case "clear-cook":
      return { ...state, recipeId: null, step: 0 };
    case "finish": {
      const plan = state.plan.slice();
      plan[0] = action.recipeId;
      const clear = new Set(action.clearIds);
      return withUndo(state, action.token, {
        ...state,
        plan,
        ingredients: state.ingredients.filter((item) => !clear.has(item.id)),
        view: "week",
        recipeId: null,
        step: 0,
      });
    }
    case "undo": {
      if (!state.undo || state.undo.token !== action.token) return state;
      return {
        ...state,
        ingredients: state.undo.ingredients,
        offers: state.undo.offers,
        plan: state.undo.plan,
        recipeId: state.undo.recipeId,
        step: state.undo.step,
        undo: null,
      };
    }
    case "reset":
      return { ...createSeedState(), view: "week" };
    default:
      return state;
  }
}

function documentTitle(view: View, recipeId: string | null) {
  if (view === "cook") {
    const recipe = recipes.find((item) => item.id === recipeId);
    return recipe ? `${recipe.name} — Fallow` : "Cook — Fallow";
  }
  const labels: Record<View, string> = {
    landing: "Fallow — Cook what the week gives you",
    week: "This week — Fallow",
    kitchen: "Kitchen — Fallow",
    cook: "Cook — Fallow",
    share: "Share — Fallow",
    plan: "Plan — Fallow",
    why: "Why Fallow",
  };
  return labels[view];
}

export type Store = {
  view: View;
  ingredients: Ingredient[];
  offers: Offer[];
  plan: (string | null)[];
  recipeId: string | null;
  step: number;
  settings: Settings;
  matches: ReturnType<typeof sortMatches>;
  focusId: string | null;
  toasts: Toast[];
  assumption: string;
  setSettings: (settings: Partial<Settings>) => void;
  addIngredient: (input: Omit<Ingredient, "id">) => void;
  removeIngredient: (id: string) => void;
  offerIngredient: (id: string, note: string, when: string) => void;
  claimOffer: (id: string) => void;
  takeBack: (id: string) => void;
  setPlan: (index: number, recipeId: string | null) => void;
  fillPlan: () => void;
  startCook: (id: string) => void;
  setStep: (step: number) => void;
  chooseAnother: () => void;
  finishCook: (clearIds: string[]) => void;
  reset: () => void;
  undo: (token: number) => void;
  holdToast: (id: number) => void;
  releaseToast: (id: number) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [focusId, setFocusId] = useState<string | null>(() => parseHash(window.location.hash).focusId);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSerial = useRef(0);
  const tokenSerial = useRef(0);
  const timers = useRef<Record<number, number>>({});
  const skipFocus = useRef(true);

  const matches = useMemo(
    () => sortMatches(recipes.map((recipe) => matchRecipe(recipe, state.ingredients, state.offers))),
    [state.ingredients, state.offers],
  );

  useEffect(() => {
    const persist = {
      view: state.view,
      ingredients: state.ingredients,
      offers: state.offers,
      plan: state.plan,
      recipeId: state.recipeId,
      step: state.step,
      settings: state.settings,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch {
      /* The kitchen still works if storage is full or blocked. */
    }
  }, [state]);

  useEffect(() => {
    if (!window.location.hash) history.replaceState(null, "", `#${state.view}`);
  }, [state.view]);

  useEffect(() => {
    function onHash() {
      const parsed = parseHash(window.location.hash);
      dispatch({ type: "view", view: parsed.view });
      setFocusId(parsed.focusId);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme;
    root.dataset.scale = state.settings.scale;
    root.dataset.motion = state.settings.reduceMotion ? "reduce" : "system";
    root.dataset.cooking = state.view === "cook" && state.recipeId ? "true" : "false";
    const color = state.settings.theme === "night" ? "#161310" : state.settings.theme === "contrast" ? "#ffffff" : "#f3eee4";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
    document.title = documentTitle(state.view, state.recipeId);
  }, [state.settings, state.view, state.recipeId]);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      if (focusId) document.getElementById(focusId)?.focus();
      return;
    }
    if (focusId) {
      const target = document.getElementById(focusId);
      target?.scrollIntoView({ block: "center", behavior: "auto" });
      target?.focus();
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (state.view !== "landing") document.getElementById("main")?.focus();
  }, [state.view, state.recipeId, focusId]);

  function dismissToast(id: number) {
    window.clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }

  function notify(text: string, token?: number) {
    const id = ++toastSerial.current;
    setToasts((list) => [...list.slice(-2), { id, text, token }]);
    timers.current[id] = window.setTimeout(() => dismissToast(id), 12000);
  }

  function nextToken() {
    tokenSerial.current += 1;
    return tokenSerial.current;
  }

  const api: Store = {
    view: state.view,
    ingredients: state.ingredients,
    offers: state.offers,
    plan: state.plan,
    recipeId: state.recipeId,
    step: state.step,
    settings: state.settings,
    matches,
    focusId,
    toasts,
    assumption: ASSUMPTION,
    setSettings(settings) {
      dispatch({ type: "settings", settings });
    },
    addIngredient(input) {
      const token = nextToken();
      const item: Ingredient = { ...input, id: uid("ing"), name: input.name.trim(), quantity: input.quantity.trim() || "1" };
      dispatch({ type: "add", item, token });
      notify(`Added ${item.name}.`, token);
    },
    removeIngredient(id) {
      const item = state.ingredients.find((ingredient) => ingredient.id === id);
      if (!item) return;
      const token = nextToken();
      dispatch({ type: "remove", id, token });
      notify(`Removed ${item.name}.`, token);
    },
    offerIngredient(id, note, when) {
      const item = state.ingredients.find((ingredient) => ingredient.id === id);
      if (!item) return;
      const token = nextToken();
      dispatch({ type: "offer", id, note, when, token });
      notify(`${item.name} is on your step.`, token);
    },
    claimOffer(id) {
      const offer = state.offers.find((item) => item.id === id);
      if (!offer || offer.claimed || offer.mine) return;
      const exists = state.ingredients.some((item) => item.name.toLowerCase() === offer.provides.toLowerCase());
      const token = nextToken();
      dispatch({ type: "claim", id, token });
      notify(
        exists
          ? `You already have ${offer.item.toLowerCase()}. ${offer.neighbor}'s is noted.`
          : `${offer.item} from ${offer.neighbor} is in the kitchen.`,
        token,
      );
    },
    takeBack(id) {
      const offer = state.offers.find((item) => item.id === id);
      if (!offer?.mine) return;
      const token = nextToken();
      dispatch({ type: "take-back", id, token });
      notify(`${offer.item} is back in the kitchen.`, token);
    },
    setPlan(index, recipeId) {
      const token = nextToken();
      dispatch({ type: "set-plan", index, recipeId, token });
      const day = planDays()[index];
      if (!day) return;
      if (!recipeId) notify(`${day.title} is open.`, token);
      else {
        const name = recipes.find((recipe) => recipe.id === recipeId)?.name ?? "a meal";
        notify(`${day.title} is ${name}.`, token);
      }
    },
    fillPlan() {
      const next = suggestPlan(state.plan, matches);
      if (next.every((id, index) => id === state.plan[index])) return;
      const token = nextToken();
      dispatch({ type: "fill-plan", plan: next, token });
      notify("Open nights are filled with what you can cook.", token);
    },
    startCook(id) {
      dispatch({ type: "start-cook", id });
      if (window.location.hash !== "#cook") window.location.hash = "cook";
    },
    setStep(step) {
      dispatch({ type: "set-step", step });
    },
    chooseAnother() {
      dispatch({ type: "clear-cook" });
    },
    finishCook(clearIds) {
      if (!state.recipeId) return;
      const name = recipes.find((recipe) => recipe.id === state.recipeId)?.name ?? "Dinner";
      const token = nextToken();
      dispatch({ type: "finish", clearIds, recipeId: state.recipeId, token });
      notify(`Tonight is ${name}.`, token);
      if (window.location.hash !== "#week") window.location.hash = "week";
    },
    reset() {
      dispatch({ type: "reset" });
      notify("The sample kitchen is restored.");
      if (window.location.hash !== "#week") window.location.hash = "week";
    },
    undo(token) {
      dispatch({ type: "undo", token });
      setToasts((list) => list.filter((toast) => toast.token !== token));
    },
    holdToast(id) {
      window.clearTimeout(timers.current[id]);
    },
    releaseToast(id) {
      timers.current[id] = window.setTimeout(() => dismissToast(id), 3500);
    },
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("The kitchen store is missing.");
  return store;
}
