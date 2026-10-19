import { gapLine, greeting, kitchenHeadline, optionalLine, sortIngredients, spoilLine, urgencyOf, useByLabel } from "../logic";
import type { Match } from "../types";
import { useStore } from "../store";

export function Week() {
  const { ingredients, matches, recipeId, step, startCook } = useStore();
  const soon = sortIngredients(ingredients).filter((item) => {
    const urgency = urgencyOf(item.useBy);
    return urgency === "urgent" || urgency === "soon";
  });
  const ready = matches.filter((match) => match.ready);
  const oneAway = matches.filter((match) => !match.ready && match.missing.length === 1);
  const waiting = matches.filter((match) => !match.ready);

  return (
    <div className="page">
      <header className="page-intro">
        <p className="kicker">{greeting()}</p>
        <h1 className="page-title">{kitchenHeadline(ingredients)}</h1>
        <p className="lede">Meals are ordered by what spoils first. A missing ingredient stays visible instead of sending you to a store.</p>
      </header>

      <ul className="stats" role="list">
        <li>
          <strong>{ready.length}</strong>
          <span>ready to cook</span>
        </li>
        <li>
          <strong>{oneAway.length}</strong>
          <span>one thing away</span>
        </li>
        <li>
          <strong>{soon.length}</strong>
          <span>to use soon</span>
        </li>
      </ul>

      {soon.length > 0 ? (
        <section className="section" aria-labelledby="soon-heading">
          <div className="section-head">
            <h2 id="soon-heading">Use soon</h2>
            <a href="#kitchen">Open the kitchen</a>
          </div>
          <ul className="rail" role="list" aria-label="Ingredients to use soon">
            {soon.map((item) => (
              <li key={item.id} className={`ticket ticket-${urgencyOf(item.useBy)}`}>
                <p className="ticket-top">
                  <span>{item.where === "fridge" ? "Fridge" : item.where === "pantry" ? "Pantry" : "Counter"}</span>
                  <span>{useByLabel(item.useBy, true)}</span>
                </p>
                <h3>{item.name}</h3>
                <p>{item.quantity}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="section" aria-labelledby="ready-heading">
        <div className="section-head">
          <h2 id="ready-heading">Ready tonight</h2>
        </div>
        {ready.length === 0 ? (
          <div className="empty">
            <p>Nothing is cookable from what you have.</p>
            <div className="cluster">
              <a className="btn btn-primary" href="#kitchen">
                Add an ingredient
              </a>
              <a className="btn btn-ghost" href="#share">
                See the step
              </a>
            </div>
          </div>
        ) : (
          <ol className="meal-list two" role="list">
            {ready.map((match, index) => (
              <li key={match.recipe.id}>
                <MealCard
                  match={match}
                  index={index}
                  continueCook={recipeId === match.recipe.id && step > 0}
                  onCook={() => startCook(match.recipe.id)}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {waiting.length > 0 ? (
        <section className="section" aria-labelledby="away-heading">
          <div className="section-head">
            <h2 id="away-heading">Not yet</h2>
          </div>
          <ol className="meal-list two" role="list">
            {waiting.map((match, index) => (
              <li key={match.recipe.id}>
                <MealCard
                  match={match}
                  index={index}
                  continueCook={recipeId === match.recipe.id && step > 0}
                  onCook={() => startCook(match.recipe.id)}
                />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function MealCard({
  match,
  index,
  continueCook,
  onCook,
}: {
  match: Match;
  index: number;
  continueCook: boolean;
  onCook: () => void;
}) {
  const offer = match.missing[0]?.offer;
  const label = continueCook ? "Continue" : match.ready ? "Cook this" : "Cook anyway";
  const note = spoilLine(match);
  const extra = optionalLine(match);

  return (
    <article className="card meal">
      <p className="num">No. {String(index + 1).padStart(2, "0")}</p>
      <h3>{match.recipe.name}</h3>
      <p>{match.recipe.summary}</p>
      <p className="meta">
        {match.recipe.minutes} min · serves {match.recipe.serves} · {match.recipe.tags.join(" · ")}
      </p>
      <p>{gapLine(match)}</p>
      {note ? <p className="hint">{note}</p> : null}
      {extra ? <p className="hint">{extra}</p> : null}
      <div className="cluster">
        <button type="button" className="btn btn-primary" onClick={onCook}>
          {label}
        </button>
        {offer ? (
          <a className="btn btn-ghost" href={`#offer-${offer.id}`}>
            {`See ${offer.neighbor}'s ${match.missing[0].name.toLowerCase()}`}
          </a>
        ) : null}
      </div>
    </article>
  );
}
