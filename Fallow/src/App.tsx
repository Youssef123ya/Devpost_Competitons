import { Toaster } from "./components/Toaster";
import { Shell } from "./components/Shell";
import { StoreProvider, useStore } from "./store";
import { Landing } from "./views/Landing";

export function App() {
  return (
    <StoreProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Frame />
      <Toaster />
    </StoreProvider>
  );
}

function Frame() {
  const { view } = useStore();
  if (view === "landing") return <Landing />;
  return <Shell />;
}
