import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

try {
  const prefs =
    localStorage.getItem('halcyon.prefs.v1') ?? localStorage.getItem('taskforge.prefs.v1') ?? '{}';
  if (JSON.parse(prefs).large === true) {
    document.documentElement.classList.add('text-large');
  }
} catch {
  // Ignore a broken preference and keep the default size.
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
