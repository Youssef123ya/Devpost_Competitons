# Fallow

Fallow is a weeknight kitchen. It starts from the food you already have, the dates it will spoil, and what a neighbor left on the step, then walks you through one dinner at a time.

Recipe sites assume a grocery run. Real kitchens are a half loaf, a bunch of kale, and a squash on the counter. Fallow orders meals by what should be used first.

## Run

```bash
npm install
npm run dev
```

Open the local address Vite prints. The app is a frontend prototype: the kitchen, the plan, and reading settings stay in this browser.

```bash
npm run build
npm run preview
```

## Try this

1. Enter the kitchen. The headline names what spoils today.
2. Cook the first meal. Arrow keys change the step. Space starts the timer.
3. On the last step, clear the perishables you used, or leave them.
4. Claim Priya's ginger. Carrot soup becomes cookable.
5. Open Reading for text size, a night theme, high contrast, and timer sound.

Priya, Amina, Leo, and Sam are sample neighbors.

## Design notes

- The week is an agenda, not seven cramped columns, so large text still has a place to sit.
- Cook mode is built for wet hands: one instruction, large controls, a timer that announces itself, and a request to keep the screen awake.
- Urgency is written in words. Color repeats it.
- Offering food removes it from your kitchen. Claiming a neighbor's gift puts it in.
- Nothing is drag-only. There is no account.

Made for Hyperbloom October, a UI/UX and web design hackathon.
