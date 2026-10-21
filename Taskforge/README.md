# Halcyon Ledger

One next step on the desk, and the rest of the week kept in a course ledger. Built for the Taskforge hackathon.

Maya Okonkwo is a second-year biology student. Her week holds a lab report, a missed-quiz email, a group chat waiting on one answer, a 7am lab to pack for, and a Thursday evening shift. A normal list puts all of that on screen at once. She loses the start, closes it, and does none of it.

**Barrier:** next-step freeze. The list is so long that choosing becomes the work, and a high-energy task crowds out the ten-minute thing that is due now.

**Change:** Halcyon Ledger asks two questions, energy and free minutes, then shows a single opening move. A weight for due, energy, and the clock sits under that step, with the next two pieces standing behind it. The Ledger groups the week by course. The Log keeps the blocks she has already closed. The focus clock matches the block she said she had, not the size of the whole assignment.

## Demo path

1. Choose **Low** and **10 min**. The step is the group-chat message. It is due today, it fits, and it is small.
2. Choose **Not this one**. The quiz email is also due today, but it needs 15 minutes, so the clock offers the first 10. A later task that happens to fit does not jump the line.
3. **Start the first 10 minutes.** The rest of the week leaves the page. Pause, add five minutes, or mark it done.
4. Open **Ledger** to see courses by open minutes, or **Log** after something is finished. **The rest of the week** and **Larger text** stay on the desk.
5. Choose **Change**, then **Sharp** and **45 min**, and set the short tasks aside. The lab discussion, then the problem set, can take the screen when the energy is actually there.

## How a step is chosen

Among unfinished tasks that were not set aside:

1. Prefer work at or below the energy you marked. If nothing qualifies, offer the soonest remaining task as an opening move and tell you to stop when the timer ends.
2. The soonest due date wins.
3. If two tasks share that due date, one that fits the clock wins over a longer one. If neither fits, the shorter one wins.
4. The timer is the smaller of the task length and the minutes you said you have.

**Make this the step** sets the other unfinished tasks aside for this block so that row becomes the one on screen.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

```bash
npm run build
npm run preview
```

Tasks and the text-size preference stay in `localStorage` on this machine. Restore the sample week from the footer.

## Accessibility

- The next step is the page heading. When it changes, focus moves to it.
- Energy and time use real buttons with `aria-pressed`, plus a visible “Selected” label.
- The ticking clock is hidden from assistive tech. Start, pause, each minute, and time-up are announced in a polite live region.
- Larger text scales the root font size. Focus rings are visible. Targets are at least 44px. Colors stay high contrast in the paper view and the dark focus view. `prefers-reduced-motion` and Windows forced colors are respected.
- No account, no remote requests, and the list is available without a mouse.

## Tools

React 18 and Vite. No UI kit and no backend. The choice logic is in `src/model.js`.

## Limitations

- Energy, minutes, and “set aside” last for this visit. A refresh asks for energy again. The task list itself is saved.
- Due dates are labels such as “Today”, not a calendar, so they do not roll forward tomorrow.
- The timer is a page clock. Leaving the tab still counts down, but closing the tab drops the focus session.
- It does not sync across devices, share a list, or estimate how long a task should take. You type the minutes.

## Submission notes

**Problem.** An overloaded student list with no single next action.

**User.** Maya Okonkwo, second-year biology, with a Thursday evening shift and a week of small and large coursework mixed together.

**Solution.** Halcyon Ledger: a check-in, one weighed opening move, a course ledger, a log of closed blocks, and a focus clock cut to the time available.

**What the prototype makes obvious.** Protecting the soonest fitting step matters more than showing every priority. A ten-minute reply due today should stay in front of a fifty-minute problem set. If the minutes are short, do the first slice of the due-today task rather than swapping in easier work that is due later.

**Pre-existing work.** None. This repository started from the hackathon brief.

**AI assistance.** The prototype was implemented with Cursor Grok, an AI coding assistant. Review the choice logic, copy, and sample week before submitting, and say so on the Devpost page.
