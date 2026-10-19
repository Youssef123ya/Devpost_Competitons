import { isoFromOffset } from "./logic";
import type { Ingredient, Offer, Recipe } from "./types";

export const ASSUMPTION = "Salt and water are assumed. Everything else is listed.";

export const DEFAULT_PLAN: (string | null)[] = ["eggs", "skillet", "chickpea", null, "rice", "soup", null];

export function createIngredients(): Ingredient[] {
  return [
    { id: "bread", name: "Bread", quantity: "half a loaf", where: "counter", useBy: isoFromOffset(0) },
    { id: "kale", name: "Kale", quantity: "1 bunch", where: "fridge", useBy: isoFromOffset(1) },
    { id: "apples", name: "Apples", quantity: "3", where: "fridge", useBy: isoFromOffset(2) },
    { id: "squash", name: "Butternut squash", quantity: "1 small", where: "counter", useBy: isoFromOffset(3) },
    { id: "yogurt", name: "Yogurt", quantity: "1 tub", where: "fridge", useBy: isoFromOffset(5) },
    { id: "feta", name: "Feta", quantity: "a wedge", where: "fridge", useBy: isoFromOffset(6) },
    { id: "carrots", name: "Carrots", quantity: "4", where: "fridge", useBy: isoFromOffset(7) },
    { id: "eggs", name: "Eggs", quantity: "6", where: "fridge", useBy: isoFromOffset(8) },
    { id: "chickpeas", name: "Chickpeas", quantity: "1 can", where: "pantry" },
    { id: "onion", name: "Onion", quantity: "2", where: "pantry" },
    { id: "garlic", name: "Garlic", quantity: "1 head", where: "pantry" },
    { id: "rice", name: "Rice", quantity: "2 cups dry", where: "pantry" },
    { id: "oil", name: "Olive oil", quantity: "a bottle", where: "pantry" },
    { id: "chili", name: "Chili flakes", quantity: "a jar", where: "pantry" },
  ];
}

export function createOffers(): Offer[] {
  return [
    {
      id: "priya",
      neighbor: "Priya",
      item: "Ginger",
      provides: "Ginger",
      quantity: "a thumb",
      note: "From last night's tea. Still firm.",
      place: "Blue tin by the door",
      distance: "0.2 mi",
      when: "Today, until 8pm",
      claimed: false,
    },
    {
      id: "amina",
      neighbor: "Amina",
      item: "Rosemary",
      provides: "Rosemary",
      quantity: "3 sprigs",
      note: "Cut this morning. The extra apples are yours too, if you want them.",
      place: "On the step",
      distance: "0.3 mi",
      when: "Today, by 6pm",
      claimed: false,
    },
    {
      id: "leo",
      neighbor: "Leo",
      item: "Lemon",
      provides: "Lemon",
      quantity: "1",
      note: "Brightens the chickpea bowl. The bowl is already cookable without it.",
      place: "Porch box",
      distance: "0.6 mi",
      when: "Tomorrow morning",
      claimed: false,
    },
    {
      id: "sam",
      neighbor: "Sam",
      item: "Carrots",
      provides: "Carrots",
      quantity: "a bunch",
      note: "You already have carrots. These are if the soup is for company.",
      place: "Side gate",
      distance: "0.8 mi",
      when: "Saturday, 9 to 11",
      claimed: false,
    },
  ];
}

export const recipes: Recipe[] = [
  {
    id: "eggs",
    name: "Skillet eggs on toast",
    minutes: 12,
    serves: 1,
    tags: ["Quick", "Dinner"],
    summary: "A late plate that uses the bread and the greens while they are still good.",
    gear: "A pan, and a toaster or a dry pan.",
    needs: ["Eggs", "Kale", "Bread", "Garlic", "Olive oil"],
    optional: [],
    steps: [
      {
        title: "Toast",
        text: "Toast the bread until the edges are firm. A dry pan works if you have no toaster.",
        minutes: 3,
        uses: ["Bread"],
      },
      {
        title: "Greens",
        text: "Warm a spoon of olive oil with the garlic. Add the kale and a pinch of salt, and stir until it wilts.",
        minutes: 3,
        uses: ["Olive oil", "Garlic", "Kale"],
      },
      {
        title: "Eggs",
        text: "Crack in as many eggs as you are hungry for. Cover the pan until the whites set and the yolks are still soft.",
        minutes: 3,
        uses: ["Eggs"],
      },
      {
        title: "Plate",
        text: "Set the eggs and kale on the toast. Eat it while the bread still cracks.",
        uses: ["Bread"],
      },
    ],
  },
  {
    id: "skillet",
    name: "Squash, kale & chili skillet",
    minutes: 28,
    serves: 2,
    tags: ["One pan", "Dinner"],
    summary: "Sweet squash, bitter kale, and heat. The kale is the reason to cook it soon.",
    gear: "A wide pan with a lid.",
    needs: ["Butternut squash", "Kale", "Onion", "Garlic", "Olive oil", "Chili flakes"],
    optional: [],
    steps: [
      {
        title: "Heat the pan",
        text: "Set a wide pan over medium heat. Add enough olive oil to gloss the surface.",
        minutes: 2,
        uses: ["Olive oil"],
      },
      {
        title: "Onion",
        text: "Cut the onion into crescents. Stir until the edges turn gold.",
        minutes: 6,
        uses: ["Onion"],
      },
      {
        title: "Garlic",
        text: "Stir in the garlic. Keep it moving so it smells sweet.",
        minutes: 1,
        uses: ["Garlic"],
      },
      {
        title: "Squash",
        text: "Add the squash in small cubes and a pinch of salt. Cover the pan and let it steam.",
        minutes: 10,
        uses: ["Butternut squash"],
      },
      {
        title: "Kale",
        text: "Tear in the kale. It will look like too much. Cover again until it wilts into the squash.",
        minutes: 4,
        uses: ["Kale"],
      },
      {
        title: "Chili",
        text: "Uncover the pan. Add chili flakes. Taste, then salt until the sweet and the bitter balance.",
        uses: ["Chili flakes"],
      },
    ],
  },
  {
    id: "chickpea",
    name: "Apple & chickpea bowl",
    minutes: 15,
    serves: 2,
    tags: ["Bowl", "No stove"],
    summary: "Cold, crisp, and done in one bowl. It uses the apples before they soften.",
    gear: "A bowl and a knife.",
    needs: ["Apples", "Chickpeas", "Yogurt", "Onion", "Olive oil"],
    optional: ["Lemon"],
    steps: [
      {
        title: "Apple",
        text: "Cut the apples into bite-size pieces. Leave the peel on.",
        uses: ["Apples"],
      },
      {
        title: "Onion",
        text: "Slice the onion thin. Raw is right for this bowl.",
        uses: ["Onion"],
      },
      {
        title: "Fold",
        text: "Add the chickpeas and the yogurt. Stir until the apples look dressed, not soupy.",
        uses: ["Chickpeas", "Yogurt"],
      },
      {
        title: "Finish",
        text: "Add a thread of olive oil and salt. A little lemon, if you have it, wakes the bowl up.",
        uses: ["Olive oil"],
      },
    ],
  },
  {
    id: "rice",
    name: "Squash rice with feta",
    minutes: 30,
    serves: 2,
    tags: ["Dinner"],
    summary: "The squash goes tender, the feta softens, and the chili keeps it awake.",
    gear: "A saucepan and a wide pan.",
    needs: ["Rice", "Butternut squash", "Feta", "Chili flakes", "Olive oil", "Onion"],
    optional: [],
    steps: [
      {
        title: "Start the rice",
        text: "Rinse the rice and start it simmering. Cube the squash while it cooks.",
        minutes: 15,
        uses: ["Rice"],
      },
      {
        title: "Squash",
        text: "Warm olive oil in a wide pan. Cook the onion and squash with a pinch of salt until the squash is tender.",
        minutes: 10,
        uses: ["Olive oil", "Onion", "Butternut squash"],
      },
      {
        title: "Feta",
        text: "Fold in the rice, the chili flakes, and the feta. Stop when the feta starts to soften.",
        uses: ["Feta", "Chili flakes", "Rice"],
      },
    ],
  },
  {
    id: "soup",
    name: "Carrot & yogurt soup",
    minutes: 35,
    serves: 2,
    tags: ["Pot", "Dinner"],
    summary: "A pot for a cool night. It is ready once the ginger is in the kitchen.",
    gear: "A pot.",
    needs: ["Carrots", "Onion", "Garlic", "Yogurt", "Ginger", "Olive oil"],
    optional: [],
    steps: [
      {
        title: "Onion and garlic",
        text: "Warm the olive oil. Cook the onion and garlic until they are soft and sweet.",
        minutes: 6,
        uses: ["Olive oil", "Onion", "Garlic"],
      },
      {
        title: "Carrots",
        text: "Add the carrots, cut into coins, and a pinch of salt. Stir for a minute so they take up the oil.",
        minutes: 2,
        uses: ["Carrots"],
      },
      {
        title: "Ginger",
        text: "Grate in the ginger. If it is not here yet, this is the step that waits on a neighbor.",
        uses: ["Ginger"],
      },
      {
        title: "Simmer",
        text: "Add water to just cover the carrots. Simmer until a coin breaks under a spoon.",
        minutes: 12,
        uses: ["Carrots"],
      },
      {
        title: "Yogurt",
        text: "Take the pot off the heat. Stir in the yogurt. If the pot is still boiling, the yogurt will split.",
        uses: ["Yogurt"],
      },
    ],
  },
  {
    id: "toast",
    name: "Apple & rosemary toast",
    minutes: 10,
    serves: 1,
    tags: ["Quick", "Snack"],
    summary: "A warm slice for the hour between things. Rosemary makes it smell like the month.",
    gear: "A toaster or a dry pan, and a small pan for the oil.",
    needs: ["Bread", "Apples", "Rosemary", "Olive oil"],
    optional: [],
    steps: [
      {
        title: "Toast",
        text: "Toast the bread until the center is dry.",
        minutes: 3,
        uses: ["Bread"],
      },
      {
        title: "Apple",
        text: "Slice an apple thin and lay it over the toast.",
        uses: ["Apples"],
      },
      {
        title: "Rosemary",
        text: "Strip the rosemary, warm it for a moment in olive oil, and spoon it over the apple with a little salt.",
        minutes: 2,
        uses: ["Rosemary", "Olive oil"],
      },
    ],
  },
];
