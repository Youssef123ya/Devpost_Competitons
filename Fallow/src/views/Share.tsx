import { useState, type FormEvent } from "react";
import { Dialog } from "../components/Dialog";
import { sortIngredients } from "../logic";
import { useStore } from "../store";

export function Share() {
  const { offers, claimOffer, takeBack, ingredients } = useStore();
  const [offering, setOffering] = useState(false);
  const ordered = offers.slice().sort((a, b) => Number(a.claimed) - Number(b.claimed) || Number(Boolean(a.mine)) - Number(Boolean(b.mine)));

  return (
    <div className="page">
      <header className="page-intro">
        <p className="kicker">Share</p>
        <h1 className="page-title">Left on the step</h1>
        <p className="lede">
          A neighbor&apos;s extra is a gift with a time on it, not a listing. Priya, Amina, Leo, and Sam are sample neighbors
          so the board has somewhere to start.
        </p>
      </header>
      <div className="cluster">
        <button type="button" className="btn btn-primary" onClick={() => setOffering(true)} disabled={ingredients.length === 0}>
          Offer something
        </button>
        {ingredients.length === 0 ? <p className="hint">Add food before you offer it.</p> : null}
      </div>
      <div className="offer-list">
        {ordered.map((offer) => (
          <article key={offer.id} id={`offer-${offer.id}`} className={offer.claimed ? "offer is-claimed" : "offer"} tabIndex={-1}>
            <p className="offer-who">{offer.neighbor}</p>
            <div className="offer-main">
              <h2>
                {offer.item}
                <span className="count"> · {offer.quantity}</span>
              </h2>
              <p>{offer.note}</p>
              <p className="meta">
                {offer.distance} · {offer.when} · {offer.place}
              </p>
            </div>
            <div className="offer-action">
              {offer.mine ? (
                <button type="button" className="btn btn-ghost" onClick={() => takeBack(offer.id)}>
                  Take back {offer.item.toLowerCase()}
                </button>
              ) : offer.claimed ? (
                <p className="pill">Picked up</p>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => claimOffer(offer.id)}>
                  Claim {offer.item.toLowerCase()}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {offering ? <OfferDialog onClose={() => setOffering(false)} /> : null}
    </div>
  );
}

function OfferDialog({ onClose }: { onClose: () => void }) {
  const { ingredients, offerIngredient } = useStore();
  const options = sortIngredients(ingredients);
  const [ingredientId, setIngredientId] = useState(options[0]?.id ?? "");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ingredientId) {
      setError("Choose something to offer.");
      return;
    }
    if (!when.trim()) {
      setError("Say when you will be around.");
      return;
    }
    offerIngredient(ingredientId, note, when);
    onClose();
  }

  return (
    <Dialog title="Offer something" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="hint">The soonest food is selected. Offering it removes it from your kitchen.</p>
        <div className="field">
          <label htmlFor="offer-item">From your kitchen</label>
          <select
            id="offer-item"
            data-autofocus
            value={ingredientId}
            onChange={(event) => setIngredientId(event.target.value)}
          >
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.quantity}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="offer-when">When</label>
          <input
            id="offer-when"
            value={when}
            onChange={(event) => {
              setWhen(event.target.value);
              if (error) setError("");
            }}
            placeholder="Today, until 7pm"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "offer-error" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="offer-note">Note, if you want one</label>
          <textarea id="offer-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </div>
        {error ? (
          <p id="offer-error" className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Leave it on the step
          </button>
        </div>
      </form>
    </Dialog>
  );
}
