import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { useStore } from "../store";

export function Why() {
  const { reset, setSettings } = useStore();
  const [confirm, setConfirm] = useState(false);

  return (
    <article className="essay">
      <p className="kicker">Why Fallow</p>
      <h1 className="page-title">The kitchen works from what is already here.</h1>
      <p>
        Recipe sites start from a grocery list. Real dinners start from a fridge that is already half decided, food that
        expires on different days, and occasionally a neighbor&apos;s extra herbs. Fallow is a weeknight kitchen for that
        starting point.
      </p>
      <p>
        The name is the unplanted field: ground you did not sow, which still has something to eat. The sample kitchen is an
        October one. Bread today, kale tomorrow, squash and apples close behind.
      </p>

      <h2>A path through it</h2>
      <ol>
        <li>Open This week. The first meal uses the food that spoils soonest.</li>
        <li>Cook it one step at a time. Space starts the timer. Arrows move the step.</li>
        <li>On the last step, clear the perishables you used, or leave them.</li>
        <li>Claim Priya&apos;s ginger. Carrot soup becomes cookable.</li>
        <li>Offer something from your own kitchen, then take it back if you change your mind.</li>
      </ol>
      <p>
        <button type="button" className="btn btn-ghost" onClick={() => setSettings({ theme: "night" })}>
          Switch to the night theme
        </button>
      </p>

      <h2>Three nights it has to survive</h2>
      <ul>
        <li>Maya cooks after class, tired, and will not shop on the way home.</li>
        <li>Jonah shares a fridge and needs to know what should be eaten or given away.</li>
        <li>Amina gardens, leaves herbs on the step, and reads more comfortably in large type.</li>
      </ul>
      <p>These are design constraints, not quotes from real people.</p>

      <h2>What the interface refuses</h2>
      <ul>
        <li>No account, no feed, and no ads between the onion and the pan.</li>
        <li>No drag-only actions. Every choice is a button.</li>
        <li>No nutrition claims and no medical advice. Salt and water are assumed. Everything else is named.</li>
        <li>Color is never the only sign that something should be used today.</li>
      </ul>

      <h2>Reading, keyboard, and the stove</h2>
      <ul>
        <li>Text size, paper, night, and high contrast are in Reading, and they stay on this device.</li>
        <li>Cook mode keeps one instruction on screen, with large previous and next controls.</li>
        <li>The timer announces start, pause, and finish. The chime can be turned off.</li>
        <li>While you are cooking, the page asks the phone to keep the screen awake.</li>
        <li>A skip link, visible focus, and labeled controls are part of the kitchen.</li>
      </ul>

      <h2>What stays on this device</h2>
      <p>
        The kitchen, the plan, and your reading settings are saved in this browser. Refresh keeps your place in a recipe.
        There is no server behind the sample neighbors.
      </p>
      <p>
        <a href="#landing">Back to the introduction</a>
      </p>
      <p>
        <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
          Restore the sample kitchen
        </button>
      </p>

      {confirm ? (
        <Dialog title="Restore the sample kitchen?" onClose={() => setConfirm(false)}>
          <p>Your edits on this device will be cleared. The October fridge, the sample neighbors, and the week plan come back.</p>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)} data-autofocus>
              Keep my kitchen
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setConfirm(false);
                reset();
              }}
            >
              Restore
            </button>
          </div>
        </Dialog>
      ) : null}
    </article>
  );
}
