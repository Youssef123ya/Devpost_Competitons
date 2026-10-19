import { Brand } from "../components/Brand";
import { Reading } from "../components/Reading";
import { kitchenHeadline, sortIngredients, urgencyOf, useByLabel } from "../logic";
import { useStore } from "../store";

export function Landing() {
  const { ingredients, matches, startCook } = useStore();
  const soon = sortIngredients(ingredients)
    .filter((item) => {
      const urgency = urgencyOf(item.useBy);
      return urgency === "urgent" || urgency === "soon";
    })
    .slice(0, 4);
  const first = matches.find((match) => match.ready);

  return (
    <div className="landing">
      <header className="landing-bar">
        <Brand href="#landing" />
        <div className="landing-tools">
          <a href="#why">Why</a>
          <Reading />
          <a className="btn btn-primary" href="#week">
            Enter
          </a>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">A kitchen for the week you are in</p>
            <h1 className="display">
              Dinner starts with what is <em>already here.</em>
            </h1>
            <p className="lede">
              Fallow starts from the food you have, the dates it will spoil, and what a neighbor left on the step.
              The useful question is what should leave the kitchen tonight.
            </p>
            <div className="cluster">
              <a className="btn btn-primary" href="#week">
                Enter the kitchen
              </a>
              {first ? (
                <button type="button" className="btn btn-ghost" onClick={() => startCook(first.recipe.id)}>
                  Cook what spoils first
                </button>
              ) : (
                <a className="btn btn-ghost" href="#kitchen">
                  Add what you have
                </a>
              )}
            </div>
          </div>
          <aside className="still" aria-hidden="true">
            <div className="still-back">
              <p className="kicker">Cook first</p>
              <p className="still-title">{first ? first.recipe.name : "The kitchen is open"}</p>
              <p>{first ? "Nothing else to buy." : "Add what you have."}</p>
            </div>
            <div className="still-front">
              <p className="kicker">Use soon</p>
              {soon.length === 0 ? (
                <p>Nothing is close to spoiling.</p>
              ) : (
                <ul className="stack" role="list">
                  {soon.map((item) => (
                    <li key={item.id} className="still-row">
                      <span>{item.name}</span>
                      <span>{useByLabel(item.useBy)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="hint">{kitchenHeadline(ingredients)}</p>
            </div>
          </aside>
        </section>

        <section className="section" aria-labelledby="night-heading">
          <div className="section-head">
            <h2 id="night-heading">How a night goes</h2>
          </div>
          <ol className="steps" role="list">
            <li className="card step-card">
              <p className="num">01</p>
              <h3>Name what you have</h3>
              <p>The bunch of kale, the bread from yesterday, the squash on the counter. Staples stay. Dates are the point.</p>
            </li>
            <li className="card step-card">
              <p className="num">02</p>
              <h3>Cook what spoils first</h3>
              <p>Meals are ordered by what should be used, not by what photographs well. If one thing is missing, the board says who has it.</p>
            </li>
            <li className="card step-card">
              <p className="num">03</p>
              <h3>One step at a time</h3>
              <p>The type is large, the timer stays on the screen, and the phone tries not to sleep. Wet hands get a big Next.</p>
            </li>
          </ol>
        </section>

        <section className="section" aria-labelledby="people-heading">
          <div className="section-head">
            <h2 id="people-heading">Three kitchens this is responsible to</h2>
          </div>
          <p className="lede">Design portraits, not testimonials. The interface has to work for these nights.</p>
          <div className="people">
            <article className="card person">
              <p className="num">Maya</p>
              <p>Cooks after class, often tired. Needs a path that starts at a small fridge and ends at a plate, without a shopping detour.</p>
            </article>
            <article className="card person">
              <p className="num">Jonah</p>
              <p>Shares a fridge. Needs to see what is close to the bin, and what can be offered without a group chat.</p>
            </article>
            <article className="card person">
              <p className="num">Amina</p>
              <p>Grows herbs and reads more comfortably in large type. Needs to leave rosemary on the step without making an account.</p>
            </article>
          </div>
        </section>

        <section className="promise" aria-labelledby="promise-heading">
          <h2 id="promise-heading">The screen stays quiet</h2>
          <ul className="bullets">
            <li>Text size, a night theme, and high contrast stay on this device.</li>
            <li>Urgency is written in words, not only color.</li>
            <li>Cook mode is one step, with large controls and a keyboard path.</li>
            <li>Nothing is drag-only. There is no account and no feed.</li>
          </ul>
          <a className="btn btn-primary" href="#week">
            Enter the kitchen
          </a>
        </section>

        <footer className="footer">
          <p>Fallow is the unplanted field: the food already here.</p>
          <p className="fineprint">
            Made for{" "}
            <a href="https://www.hyperbloomhacks.com/" target="_blank" rel="noreferrer">
              Hyperbloom October
            </a>
            , a UI/UX and web design hackathon. Sample neighbors are fictional.
          </p>
        </footer>
      </main>
    </div>
  );
}
