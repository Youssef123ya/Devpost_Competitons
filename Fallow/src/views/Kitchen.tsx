import { useMemo, useState, type FormEvent } from "react";
import { Dialog } from "../components/Dialog";
import { ASSUMPTION } from "../data";
import { BIN_LABEL, sortIngredients, urgencyOf, useByLabel } from "../logic";
import type { Bin, Ingredient } from "../types";
import { useStore } from "../store";

type Filter = "all" | "soon" | "keeps";

export function Kitchen() {
  const { ingredients, removeIngredient, assumption } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortIngredients(ingredients).filter((item) => {
      const urgency = urgencyOf(item.useBy);
      if (filter === "soon" && urgency !== "urgent" && urgency !== "soon") return false;
      if (filter === "keeps" && urgency !== "steady" && urgency !== "none") return false;
      if (!needle) return true;
      const haystack = `${item.name} ${item.note ?? ""} ${item.where}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [ingredients, query, filter]);

  const soon = visible.filter((item) => {
    const urgency = urgencyOf(item.useBy);
    return urgency === "urgent" || urgency === "soon";
  });
  const rest = visible.filter((item) => !soon.includes(item));

  return (
    <div className="page">
      <header className="page-intro">
        <p className="kicker">Kitchen</p>
        <h1 className="page-title">What is already here</h1>
        <p className="lede">{assumption || ASSUMPTION}</p>
      </header>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="kitchen-search">Search the kitchen</label>
          <input
            id="kitchen-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kale, fridge, ginger"
          />
        </div>
        <div className="toolbar-actions">
          <div className="choices" role="group" aria-label="Filter ingredients">
            {(
              [
                ["all", "All"],
                ["soon", "Use soon"],
                ["keeps", "Keeps"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={filter === id ? "choice-btn is-on" : "choice-btn"}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            Add an ingredient
          </button>
        </div>
      </div>

      <p className="hint">
        Showing {visible.length} of {ingredients.length}.
      </p>

      {visible.length === 0 ? (
        <div className="empty">
          <p>{ingredients.length === 0 ? "Your kitchen is quiet." : "Nothing matches that search."}</p>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            Add an ingredient
          </button>
        </div>
      ) : (
        <>
          {soon.length > 0 ? <IngredientGroup title="Use soon" items={soon} onRemove={removeIngredient} /> : null}
          {rest.length > 0 ? <IngredientGroup title="The rest" items={rest} onRemove={removeIngredient} /> : null}
        </>
      )}

      {adding ? <AddDialog onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

function IngredientGroup({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: Ingredient[];
  onRemove: (id: string) => void;
}) {
  const headingId = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section className="section" aria-labelledby={headingId}>
      <div className="section-head">
        <h2 id={headingId}>
          {title}
          <span className="count"> {items.length}</span>
        </h2>
      </div>
      <ul className="ingredient-grid" role="list">
        {items.map((item) => (
          <li key={item.id} className={`ticket ticket-${urgencyOf(item.useBy)}`}>
            <p className="ticket-top">
              <span>{BIN_LABEL[item.where]}</span>
              <span>{useByLabel(item.useBy)}</span>
            </p>
            <h3>{item.name}</h3>
            <p>{item.quantity}</p>
            {item.note ? <p className="muted">{item.note}</p> : null}
            <button type="button" className="btn btn-ghost" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const { addIngredient } = useStore();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [where, setWhere] = useState<Bin>("fridge");
  const [useBy, setUseBy] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a name.");
      return;
    }
    addIngredient({
      name,
      quantity,
      where,
      useBy: useBy || undefined,
    });
    onClose();
  }

  return (
    <Dialog title="Add an ingredient" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="ingredient-name">Name</label>
          <input
            id="ingredient-name"
            data-autofocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
            placeholder="Kale"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "ingredient-error" : undefined}
            autoComplete="off"
          />
          {error ? (
            <p id="ingredient-error" className="form-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="hint">Use a simple name, like Kale or Ginger, so meals can recognize it.</p>
          )}
        </div>
        <div className="field">
          <label htmlFor="ingredient-quantity">Quantity</label>
          <input
            id="ingredient-quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="1 bunch"
          />
        </div>
        <fieldset>
          <legend>Where it lives</legend>
          <div className="choices">
            {(Object.keys(BIN_LABEL) as Bin[]).map((bin) => (
              <label key={bin} className={where === bin ? "choice is-on" : "choice"}>
                <input
                  type="radio"
                  name="where"
                  value={bin}
                  checked={where === bin}
                  onChange={() => setWhere(bin)}
                />
                {BIN_LABEL[bin]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="ingredient-date">Use by, if it spoils</label>
          <input id="ingredient-date" type="date" value={useBy} onChange={(event) => setUseBy(event.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add to the kitchen
          </button>
        </div>
      </form>
    </Dialog>
  );
}
