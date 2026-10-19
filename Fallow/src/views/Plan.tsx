import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { RecipeButtons } from "../components/RecipeButtons";
import { gapLine, planDays, planNeedsFill, spoilLine } from "../logic";
import { useStore } from "../store";

export function Plan() {
  const { plan, matches, setPlan, fillPlan } = useStore();
  const [editing, setEditing] = useState<number | null>(null);
  const days = planDays();
  const ready = matches.filter((match) => match.ready);
  const waiting = matches.filter((match) => !match.ready);
  const canFill = planNeedsFill(plan, matches);
  const day = editing == null ? null : days[editing];

  return (
    <div className="page">
      <header className="page-intro">
        <p className="kicker">Plan</p>
        <h1 className="page-title">Seven dinners</h1>
        <p className="lede">
          A night stays open until you choose. Filling open nights only uses meals you can cook from what you have. You can
          still plan one that is waiting on a neighbor.
        </p>
      </header>
      <div className="cluster">
        <button type="button" className="btn btn-primary" onClick={fillPlan} disabled={!canFill}>
          Fill open nights
        </button>
        {!canFill ? <p className="hint">Every night already has a dinner.</p> : null}
      </div>
      <ol className="agenda" role="list">
        {days.map((item) => {
          const recipeId = plan[item.index];
          const match = matches.find((entry) => entry.recipe.id === recipeId);
          const tonight = item.index === 0;
          return (
            <li key={item.index} className={tonight ? "day is-tonight" : "day"}>
              <div>
                <p className="kicker">{item.title}</p>
                <p className="meta">{item.dateLabel}</p>
              </div>
              <div>
                {match ? (
                  <>
                    <h2>{match.recipe.name}</h2>
                    <p>{gapLine(match)}</p>
                    {spoilLine(match) ? <p className="hint">{spoilLine(match)}</p> : null}
                    {!match.ready && match.missing[0]?.offer ? (
                      <a href={`#offer-${match.missing[0].offer.id}`}>
                        {`See ${match.missing[0].offer.neighbor}'s ${match.missing[0].name.toLowerCase()}`}
                      </a>
                    ) : null}
                  </>
                ) : (
                  <h2 className="muted">Open</h2>
                )}
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(item.index)}>
                {match ? `Change ${item.title}` : `Choose ${item.title}`}
              </button>
            </li>
          );
        })}
      </ol>

      {day ? (
        <Dialog title={`Dinner for ${day.title.toLowerCase()}`} onClose={() => setEditing(null)} wide>
          <button
            type="button"
            className="choice-row"
            data-autofocus
            onClick={() => {
              setPlan(day.index, null);
              setEditing(null);
            }}
          >
            <span>
              <strong>Leave this night open</strong>
              <span className="muted">Nothing planned.</span>
            </span>
          </button>
          {ready.length > 0 ? (
            <section>
              <h3 className="dialog-label">From what you have</h3>
              <RecipeButtons
                matches={ready}
                currentId={plan[day.index]}
                onPick={(id) => {
                  setPlan(day.index, id);
                  setEditing(null);
                }}
              />
            </section>
          ) : null}
          {waiting.length > 0 ? (
            <section>
              <h3 className="dialog-label">Needs something</h3>
              <RecipeButtons
                matches={waiting}
                currentId={plan[day.index]}
                onPick={(id) => {
                  setPlan(day.index, id);
                  setEditing(null);
                }}
              />
            </section>
          ) : null}
        </Dialog>
      ) : null}
    </div>
  );
}
