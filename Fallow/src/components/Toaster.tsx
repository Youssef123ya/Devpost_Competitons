import { useStore } from "../store";

export function Toaster() {
  const { toasts, undo, holdToast, releaseToast } = useStore();

  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast"
          onMouseEnter={() => holdToast(toast.id)}
          onMouseLeave={() => releaseToast(toast.id)}
          onFocus={() => holdToast(toast.id)}
          onBlur={() => releaseToast(toast.id)}
        >
          <p>{toast.text}</p>
          {toast.token != null ? (
            <button type="button" onClick={() => undo(toast.token as number)}>
              Undo
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
