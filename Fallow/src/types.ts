export type Bin = "fridge" | "pantry" | "counter";

export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  where: Bin;
  useBy?: string;
  note?: string;
};

export type Step = {
  title: string;
  text: string;
  minutes?: number;
  uses: string[];
};

export type Recipe = {
  id: string;
  name: string;
  minutes: number;
  serves: number;
  tags: string[];
  summary: string;
  gear: string;
  needs: string[];
  optional: string[];
  steps: Step[];
};

export type Offer = {
  id: string;
  neighbor: string;
  item: string;
  provides: string;
  quantity: string;
  note: string;
  place: string;
  distance: string;
  when: string;
  claimed: boolean;
  mine?: boolean;
  source?: Ingredient;
};

export type Theme = "paper" | "night" | "contrast";
export type Scale = "sm" | "md" | "lg";

export type Settings = {
  scale: Scale;
  theme: Theme;
  reduceMotion: boolean;
  sound: boolean;
};

export type View = "landing" | "week" | "kitchen" | "cook" | "share" | "plan" | "why";

export type UndoSnap = {
  token: number;
  ingredients: Ingredient[];
  offers: Offer[];
  plan: (string | null)[];
  recipeId: string | null;
  step: number;
};

export type State = {
  view: View;
  ingredients: Ingredient[];
  offers: Offer[];
  plan: (string | null)[];
  recipeId: string | null;
  step: number;
  settings: Settings;
  undo: UndoSnap | null;
};

export type Gap = {
  name: string;
  offer?: Offer;
};

export type Match = {
  recipe: Recipe;
  missing: Gap[];
  optional: Gap[];
  ready: boolean;
  spoilIn: number | null;
  spoilName: string | null;
};

export type Toast = {
  id: number;
  text: string;
  token?: number;
};
