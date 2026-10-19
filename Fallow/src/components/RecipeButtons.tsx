import { gapLine } from "../logic";
import type { Match } from "../types";

type RecipeButtonsProps = {
  matches: Match[];
  onPick: (id: string) => void;
  currentId?: string | null;
};

export function RecipeButtons({ matches, onPick, currentId }: RecipeButtonsProps) {
  if (matches.length === 0) return null;

  return (
    <ul className="choice-list" role="list">
      {matches.map((match) => {
        const planned = currentId === match.recipe.id;
        return (
          <li key={match.recipe.id}>
            <button type="button" className="choice-row" onClick={() => onPick(match.recipe.id)}>
              <span>
                <strong>{match.recipe.name}</strong>
                <span className="muted">
                  {match.ready ? `${match.recipe.minutes} min · nothing else to buy` : gapLine(match)}
                </span>
              </span>
              {planned ? <span className="pill">Planned</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
